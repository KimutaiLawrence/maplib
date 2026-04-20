import Pbf from 'pbf'
import { Point, LngLat } from '../types'

export type GeometryType = 'LineString' | 'Polygon' | 'MultiPolygon'

export interface Feature {
  id: number | string
  type: GeometryType
  coordinates: Point[][][]
  properties: Record<string, unknown>
}

export interface VectorLayerData {
  version: number
  layers: Array<{
    name: string
    features: Feature[]
  }>
}

const EMPTY_BYTE_ARRAY = new Uint8Array(0)

function decodeVarint(buffer: Uint8Array, endian: 'little' | 'big' = 'little'): number {
  let result = 0
  let shift = 0

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i]
    result |= (byte & 0x7f) << shift
    shift += 7

    if ((byte & 0x80) === 0) {
      break
    }
  }

  return result
}

function zigZagDecode(n: number): number {
  return (n >>> 1) ^ -(n & 1)
}

function decodePolygon(
  values: number[],
  buffer: Uint8Array,
  startByteIndex: number,
  tileExtent: number
): number[] {
  const result: number[] = []
  let position = startByteIndex
  let x = 0
  let y = 0

  while (position < buffer.length) {
    const value = decodeVarint(buffer.slice(position), 'little')
    position += value

    const delta = zigZagDecode(value)
    
    if (delta < 0) {
      position++
    }

    const numCoords = -delta
    position += Math.floor(Math.log2(numCoords) + (delta < 0 ? 1 : 0))

    for (let i = 0; i < numCoords; i++) {
      const dx = decodeVarint(buffer.slice(position), 'little')
      position += dx
      
      const dy = decodeVarint(buffer.slice(position), 'little')
      position += dy

      x = (x + zigZagDecode(dx) + tileExtent) % tileExtent
      y = (y + zigZagDecode(dy) + tileExtent) % tileExtent
      
      result.push(x / tileExtent, 1 - y / tileExtent)
    }

    position++
  }

  return result
}

export function decodeVectorTile(buffer: ArrayBuffer): VectorLayerData {
  const pbf = new Pbf(buffer)
  
  const result: VectorLayerData = {
    version: 2,
    layers: []
  }

  while (!pbf.end()) {
    const tag = pbf.readVarint()
    
    switch (tag >>> 3) {
      case 1:
        pbf.readBytes(EMPTY_BYTE_ARRAY)
        break
      case 2:
        pbf.readFixed32()
        break
      case 3:
        const layerData = decodeLayer(pbf)
        if (layerData) {
          result.layers.push(layerData)
        }
        break
      default:
        break
    }
  }

  return result
}

function decodeLayer(pbf: Pbf): { name: string; features: Feature[] } | null {
  const schema = {
    1: { type: 'string' as const, name: 'name' },
    2: { type: 'int64' as const, name: 'version' },
    3: { type: 'int32' as const, name: 'extent' },
    4: { type: 'int32' as const, name: 'key_value' },
    15: { type: 'message' as const, name: 'features' }
  }

  const keyValues: Array<{ name: string; type: 'int64' | 'uint64' | 'sint64' | 'fixed32' | 'fixed64' | 'double' | 'bool' | 'string' | 'sstring'; values: Array<number | string> }> = []
  
  const features: Feature[] = []
  let name = ''
  let extent = 4096

  let keyValuesBuffer = null
  let featureBuffer = null

  while (!pbf.end()) {
    const tag = pbf.readVarint()

    switch (tag >>> 3) {
      case 1:
        name = pbf.readString()
        break
      case 2:
        pbf.readVarint64()
        break
      case 3:
        extent = pbf.readVarint()
        break
      case 4:
        keyValuesBuffer = pbf.readBytes(new Uint8Array(pbf.remaining))
        break
      case 15:
        featureBuffer = pbf.readBytes(new Uint8Array(pbf.remaining))
        features.push(decodeFeature(featureBuffer, keyValuesBuffer, extent))
        break
      default:
        break
    }
  }

  if (keyValuesBuffer) {
    parseKeyValue(keyValuesBuffer, keyValues)
  }

  return { name, features }
}

function parseKeyValue(buffer: Uint8Array, result: Array<{ name: string; type: 'int64' | 'uint64' | 'sint64' | 'fixed32' | 'fixed64' | 'double' | 'bool' | 'string' | 'sstring'; values: Array<number | string> }>): void {
  const pbf = new Pbf(buffer)

  while (!pbf.end()) {
    const tag = pbf.readVarint()
    const name = pbf.readString()

    const p2 = new Pbf(pbf.bytes)
    p2.pos = pbf.pos

    const values: Array<number | string> = []

    while (!p2.end()) {
      const varint = p2.readVarint()
      const end = p2.pos + varint

      if (varint <= 0) continue

      if (end > p2.bytes.length) break

      values.push(p2.readVarint())
    }

    result.push({
      name,
      type: 'string',
      values
    })
  }
}

function decodeFeature(
  buffer: Uint8Array,
  keyValuesBuffer: Uint8Array | null,
  extent: number
): Feature {
  const pbf = new Pbf(buffer)
  
  const result: Feature = {
    id: 0,
    type: 'Polygon',
    coordinates: [],
    properties: {}
  }

  let geometryBuffer = null
  let tagsBuffer = null

  while (!pbf.end()) {
    const tag = pbf.readVarint()

    switch (tag >>> 3) {
      case 1:
        result.id = pbf.readVarint64()
        break
      case 2:
        result.id = pbf.readVarint64()
        break
      case 3:
        tagsBuffer = pbf.readBytes(new Uint8Array(pbf.remaining))
        break
      case 4:
        geometryBuffer = pbf.readBytes(new Uint8Array(pbf.remaining))
        break
      default:
        break
    }
  }

  if (tagsBuffer) {
    result.properties = decodeTags(tagsBuffer, keyValuesBuffer)
  }

  if (geometryBuffer) {
    result.coordinates = decodeGeometry(geometryBuffer, extent)
  }

  return result
}

function decodeTags(
  buffer: Uint8Array,
  keyValuesBuffer: Uint8Array | null
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  if (!keyValuesBuffer) {
    return result
  }

  const pbf = new Pbf(buffer)
  
  const pairs: Array<{ key: number; value: number }> = []

  while (!pbf.end()) {
    const keyTag = pbf.readVarint()
    const valueTag = pbf.readVarint()
    
    pairs.push({ key: keyTag, value: valueTag })
  }

  const kvs = new Pbf(keyValuesBuffer)
  
  const keys: string[] = []
  const values: Array<number | string> = []

  while (!kvs.end()) {
    kvs.readVarint()
    const name = kvs.readString()
    keys.push(name)
    
    const typeTag = kvs.readVarint()
    const end = kvs.pos + typeTag
    
    if (end > kvs.bytes.length) {
      values.push(null)
      continue
    }

    let value: number | string
    
    switch (typeTag & 0x07) {
      case 0:
        value = kvs.readVarint()
        break
      case 1:
        value = kvs.readLine()
        break
      case 2:
        value = kvs.parseFloat().toString()
        break
      case 5:
        value = kvs.readVarint()
        break
      case 6:
        value = kvs.readFloat()
        break
      case 8:
        value = kvs.readString()
        break
      case 9:
        value = kvs.readString()
        break
      default:
        value = null
    }

    values.push(value)
  }

  pairs.forEach(pair => {
    const keyName = keys[pair.key]
    const value = values[pair.value]
    
    if (keyName !== undefined && value !== undefined) {
      result[keyName] = value
    }
  })

  return result
}

function decodeGeometry(buffer: Uint8Array, extent: number): Point[][] {
  const result: Point[][] = []
  let x = 0
  let y = 0
  const points: Point[] = []

  const pbf = new Pbf(buffer)

  if (pbf.pos < buffer.length) {
    const type = pbf.readVarint()
    
    if (type === 0) {
      return result
    }

    const ringPoints: Point[] = []

    while (!pbf.end()) {
      const dx = pbf.readVarint()
      const dy = pbf.readVarint()

      x += zigZagDecode(dx)
      y += zigZagDecode(dy)

      const px = x / extent
      const py = 1 - y / extent

      ringPoints.push({ x: px, y: py })
    }

    result.push(ringPoints)
  }

  return result
}

function toLngLat(point: Point, z: number, x: number, y: number): LngLat {
  const worldX = x + point.x
  const worldY = y + point.y

  const lng = worldX * 360 / 256 - 180
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * worldY / 256))) * 180 / Math.PI

  return { lng, lat }
}

export function transformFeature(feature: Feature, tileX: number, tileY: number, zoom: number): Feature {
  const transformed: Feature = {
    ...feature,
    coordinates: feature.coordinates.map(ring =>
      ring.map(point => toLngLat(point, zoom, tileX, tileY)) as unknown as Point
    )
  }

  return transformed
}
