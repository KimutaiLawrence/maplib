import Pbf from 'pbf'
import { TileCoord, Point } from '../types'

export type GeometryType = 'LineString' | 'Polygon' | 'MultiPolygon'

export interface Feature {
  id: number | string
  geometryType: GeometryType
  coordinates: Point[][]
  properties: Map<string, unknown>
}

export interface VectorLayerData {
  version: number
  layers: Array<{
    name: string
    features: Feature[]
  }>
}

function zigZagDecode(n: number): number {
  return (n >>> 1) ^ -(n & 1)
}

export class VectorTile {
  private tileCoord: TileCoord
  private data: VectorLayerData | null = null
  private loaded: boolean = false
  private error: string | null = null

  constructor(x: number, y: number, z: number) {
    this.tileCoord = { x, y, z }
  }

  async load(url: string): Promise<void> {
    if (this.loaded || this.data !== null) {
      return
    }

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()

      if (!response.ok) {
        throw new Error(`Failed to load vector tile: ${response.status} ${response.statusText}`)
      }

      this.parse(arrayBuffer)
      this.loaded = true
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  parse(buffer: ArrayBuffer): void {
    const pbf = new Pbf(buffer)
    
    this.data = {
      version: 2,
      layers: []
    }

    while (!pbf.end()) {
      const tag = pbf.readVarint()
      const wireType = tag & 0x07
      const fieldNumber = tag >>> 3

      switch (fieldNumber) {
        case 1:
          pbf.readVarint()
          break
        case 2:
          pbf.readVarint()
          break
        case 3:
          const layer = this.decodeLayer(pbf)
          if (layer) {
            this.data.layers.push(layer)
          }
          break
        default:
          pbf.skip(tag)
          break
      }
    }
  }

  private decodeLayer(pbf: Pbf): { name: string; features: Feature[] } | null {
    const layerExtent = 4096
    const layerKeyValues = new Map<number, { type: string; values: Array<string | number> }>()
    
    let name = ''

    while (!pbf.end()) {
      const tag = pbf.readVarint()
      const fieldNumber = tag >>> 3
      const wireType = tag & 0x07

      switch (fieldNumber) {
        case 1:
          name = pbf.readString()
          break
        case 2:
          pbf.readVarint()
          break
        case 3:
          pbf.readVarint()
          break
        case 4:
          const keyValuesSize = pbf.readVarint()
          const keyValuesStart = pbf.pos
          pbf.pos += keyValuesSize
          const keyValuesData = pbf.bytes.slice(keyValuesStart, pbf.pos)
          
          this.decodeKeyValue(pbf, new Uint8Array(keyValuesData), layerKeyValues)
          break
        case 15:
          const featureSize = pbf.readVarint()
          const featureStart = pbf.pos
          const featureData = pbf.bytes.slice(featureStart, featureStart + featureSize)
          
          const feature = this.decodeFeature(new Uint8Array(featureData), pbf, layerKeyValues, layerExtent)
          if (feature && this.data) {
            if (!this.data.layers[this.data.layers.length - 1]?.features) {
              this.data.layers[this.data.layers.length - 1] = { name: 'unnamed', features: [] }
            }
            this.data.layers[this.data.layers.length - 1].features.push(feature)
          }
          break
        default:
          pbf.pos += 1
          break
      }
    }

    return name ? { name, features: this.data.layers[this.data.layers.length - 1]?.features || [] } : null
  }

  private decodeKeyValue(buffer: Uint8Array, pbf: Pbf, layerKeyValues: Map<number, { type: string; values: Array<string | number> }>): Map<number, { type: string; values: Array<string | number> }> {
    const kvPbf = new Pbf(buffer)
    const result = new Map<number, { type: string; values: Array<string | number> }>()
    
    while (!kvPbf.end()) {
      const tag = kvPbf.readVarint()
      const key = kvPbf.readString()
      const values = pbf.readVarint()
      
      result.set(key.length, { type: 'string', values: [key, values] })
    }
    
    return result
  }

  private decodeFeature(buffer: Uint8Array, pbf: Pbf, layerKeyValues: Map<number, { type: string; values: Array<string | number> }>, extent: number): Feature | null {
    const pbfFeature = new Pbf(buffer)
    const feature: Feature = {
      id: null,
      geometryType: 'LineString',
      coordinates: [],
      properties: layerKeyValues
    }

    const tags = new Map<string, unknown>()
    let geometryStart = 0

    while (!pbfFeature.end()) {
      const tag = pbfFeature.readVarint()
      const fieldNumber = tag >>> 3
      const wireType = tag & 0x07

      switch (fieldNumber) {
        case 1:
          feature.id = pbfFeature.readVarint()
          break
        case 2:
          feature.id = pbfFeature.readVarint()
          break
        case 3:
          const size = pbfFeature.readVarint()
          const end = pbfFeature.pos + size
          const data = pbfFeature.bytes.slice(pbfFeature.pos, end)
          
          pbfFeature.pos = end
          while (!pbfFeature.end()) {
            const key = pbfFeature.readVarint()
            const value = pbfFeature.readVarint()
            tags.set(key.toString(), value)
          }
          break
        case 4:
          const geometerySize = pbfFeature.readVarint()
          geometryStart = pbfFeature.pos
          pbfFeature.pos += geometerySize
          
          const geometryData = pbfFeature.bytes.slice(geometryStart, pbfFeature.pos)
          const ringType = new Pbf(geometryData).readVarint()
          feature.geometryType = (ringType === 0 || ringType === 1) ? 'LineString' : 'Polygon'
          
          const points = this.decodeGeometry(geometryData, extent)
          feature.coordinates.push(points)
          break
        default:
          break
      }
    }

    return feature
  }

  private decodeGeometry(buffer: Uint8Array, extent: number): Point[] {
    const pbf = new Pbf(buffer)
    const points: Point[] = []
    
    let x = 0
    let y = 0

    pbf.readVarint()

    while (!pbf.end()) {
      const rawX = pbf.readVarint()
      const rawY = pbf.readVarint()

      x += zigZagDecode(rawX)
      y += zigZagDecode(rawY)

      points.push({
        x: x / extent,
        y: 1 - y / extent
      })
    }

    return points
  }

  isLoaded(): boolean {
    return this.loaded
  }

  getData(): VectorLayerData | null {
    return this.data
  }

  getError(): string | null {
    return this.error
  }

  getTileCoord(): TileCoord {
    return this.tileCoord
  }
}
