import { LayerOptions, TileCoord } from '../types'
import { Renderer, Camera } from '../core'
import { VectorTile } from '../tiles/VectorTile'
import { VectorRenderer } from '../renderers/VectorRenderer'
import { BufferManager } from '../core/BufferManager'
import { GeoUtils } from '../utils/GeoUtils'
const MIN_ZOOM = 0
const MAX_ZOOM = 22
const TILE_SIZE = 512

export interface VectorLayerOptions extends LayerOptions {
  source?: string
  minZoom?: number
  maxZoom?: number
  tileSize?: number
  paint?: {
    'fill-color'?: string
    'fill-opacity'?: number
    'line-color'?: string
    'line-width'?: number
    'line-opacity'?: number
    'circle-radius'?: number
    'circle-color'?: string
    'circle-opacity'?: number
  }
}

export interface TileInfo {
  vecTile: VectorTile
  tile: TileCoord
  loaded: boolean
  error: string | null
}

export interface TileKey {
  x: number
  y: number
  z: number
}

const parseLayerName = (name: string): string => name.toLowerCase().trim().replace(/\s+/g, '_')

export class VectorLayer {
  protected id: string
  protected visible: boolean
  protected opacity: number
  protected source: string | null
  protected minZoom: number
  protected maxZoom: number
  protected tileSize: number
  protected paint: {
    fillColor: string
    fillOpacity: number
    lineColor: string
    lineWidth: number
    lineOpacity: number
    circleRadius: number
    circleColor: string
    circleOpacity: number
  }
  protected tiles: Map<string, TileInfo> = new Map()
  protected visibleTiles: TileInfo[] = []

  constructor(options: VectorLayerOptions) {
    this.id = options.id
    this.visible = options.visible !== false
    this.opacity = options.opacity ?? 1.0
    this.source = options.source || null
    this.minZoom = options.minZoom ?? MIN_ZOOM
    this.maxZoom = options.maxZoom ?? MAX_ZOOM
    this.tileSize = options.tileSize ?? TILE_SIZE
    
    this.paint = {
      fillColor: 'rgba(100, 149, 237, ',
      fillOpacity: 0.8,
      lineColor: 'rgba(52, 152, 219, ',
      lineWidth: 2.0,
      lineOpacity: 1.0,
      circleRadius: 5.0,
      circleColor: 'rgba(155, 89, 182, ',
      circleOpacity: 1.0
    }
    
    if (options.paint) {
      if (options.paint['fill-color']) {
        this.paint.fillColor = options.paint['fill-color']
      }
      if (options.paint['fill-opacity'] !== undefined) {
        this.paint.fillOpacity = options.paint['fill-opacity']
      }
      if (options.paint['line-color']) {
        this.paint.lineColor = options.paint['line-color']
      }
      if (options.paint['line-width'] !== undefined) {
        this.paint.lineWidth = options.paint['line-width']
      }
      if (options.paint['line-opacity'] !== undefined) {
        this.paint.lineOpacity = options.paint['line-opacity']
      }
      if (options.paint['circle-radius'] !== undefined) {
        this.paint.circleRadius = options.paint['circle-radius']
      }
      if (options.paint['circle-color']) {
        this.paint.circleColor = options.paint['circle-color']
      }
      if (options.paint['circle-opacity'] !== undefined) {
        this.paint.circleOpacity = options.paint['circle-opacity']
      }
    }
  }

  getId(): string {
    return this.id
  }

  isVisible(): boolean {
    return this.visible
  }

  setVisible(visible: boolean): void {
    this.visible = visible
  }

  getOpacity(): number {
    return this.opacity
  }

  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity))
  }

  getType(): string {
    return 'vector'
  }

  getSource(): string | null {
    return this.source
  }

  setSource(source: string): void {
    this.source = source
  }

  getMinZoom(): number {
    return this.minZoom
  }

  getMaxZoom(): number {
    return this.maxZoom
  }

  getTileSize(): number {
    return this.tileSize
  }

  getTiles(): Map<string, TileInfo> {
    return this.tiles
  }

  getTile(tileCoord: TileCoord): TileInfo | null {
    const key = this.getTileKey(tileCoord)
    return this.tiles.get(key) || null
  }

  setTile(tileCoord: TileCoord, tileInfo: TileInfo): void {
    const key = this.getTileKey(tileCoord)
    this.tiles.set(key, tileInfo)
  }

  updateTile(tileCoord: TileCoord, tile: VectorTile): void {
    const tileInfo = this.getTile(tileCoord) || { vecTile: tile, tile: tileCoord, loaded: false, error: null }

    tileInfo.vecTile = tile
    tileInfo.tile = tileCoord
    tileInfo.loaded = true

    this.setTile(tileCoord, tileInfo)
  }

  removeTile(tileCoord: TileCoord): void {
    const key = this.getTileKey(tileCoord)
    this.tiles.delete(key)
  }

  clearTiles(): void {
    this.tiles.clear()
    this.visibleTiles.length = 0
  }

  addTile(tileCoord: TileCoord, vecTile: VectorTile): void {
    const key = this.getTileKey(tileCoord)
    
    if (!this.tiles.has(key)) {
      this.tiles.set(key, {
        vecTile: vecTile,
        tile: tileCoord,
        loaded: false,
        error: null
      })
    }
    
    const tileInfo = this.getTile(tileCoord)!
    tileInfo.vecTile = vecTile
    tileInfo.loaded = true
  }

  loadTiles(camera: Camera): Promise<void[]> {
    const tiles = this.getVisibleTiles(camera)
    const promises: Promise<void>[] = []

    for (const tileCoord of tiles) {
      const tileInfo = this.getTile(tileCoord)
      
      if (!tileInfo) {
        const vecTile = new VectorTile(tileCoord.x, tileCoord.y, tileCoord.z)
        const key = this.getTileKey(tileCoord)
        
        this.tiles.set(key, {
          vecTile: vecTile,
          tile: tileCoord,
          loaded: false,
          error: null
        })
        
        const url = this.getTileUrl(tileCoord)
        promises.push(vecTile.load(url).then(() => {
          const loadedTileInfo = this.getTile(tileCoord)
          if (loadedTileInfo) {
            loadedTileInfo.loaded = true
          }
        }).catch((error) => {
          const loadedTileInfo = this.getTile(tileCoord)
          if (loadedTileInfo) {
            loadedTileInfo.loaded = false
            loadedTileInfo.error = error.message
          }
        }))
      } else if (!tileInfo.loaded) {
        promises.push(tileInfo.vecTile.load(this.getTileUrl(tileCoord)).then(() => {
          tileInfo.loaded = true
        }).catch((error) => {
          tileInfo.loaded = false
          tileInfo.error = error.message
        }))
      }
    }

    return Promise.all(promises)
  }

  render(renderer: Renderer, camera: Camera): void {
    if (!this.visible || this.opacity === 0) {
      return
    }

    const gl = renderer.getWebGL()
    const vecRenderer = new VectorRenderer(gl, new BufferManager(gl))
    
    const visibleTiles = this.getVisibleTiles(camera)
    this.visibleTiles.length = 0

    const tileColor = this.parseColor(this.paint.fillColor, this.paint.fillOpacity * this.opacity)

    for (const tileCoord of visibleTiles) {
      const tileInfo = this.getTile(tileCoord)
      
      if (!tileInfo || !tileInfo.loaded || tileInfo.error) {
        continue
      }

      const data = tileInfo.vecTile.getData()
      
      if (!data || !data.layers || data.layers.length === 0) {
        continue
      }

      this.visibleTiles.push(tileInfo)

      for (const layer of data.layers) {
        const layerName = parseLayerName(layer.name)
        
        for (const feature of layer.features) {
          const coords = feature.coordinates[0]
          
          if (!coords || coords.length === 0) {
            continue
          }

          if (feature.geometryType === 'LineString' || coords.length < 4) {
            vecRenderer.addLineBatch(coords, tileColor, this.paint.lineWidth)
          } else if (feature.geometryType === 'Polygon' || coords.length > 2) {
            vecRenderer.addPolygonBatch(coords, tileColor, this.paint.fillOpacity)
          }
        }
      }
    }

    vecRenderer.flush()
    vecRenderer.render()
  }

  onRemove(): void {
    this.tiles.clear()
    this.visibleTiles.length = 0
  }

  private getTileKey(tileCoord: TileCoord): string {
    return `${tileCoord.x}_${tileCoord.y}_${tileCoord.z}`
  }

  private getTileUrl(tileCoord: TileCoord): string {
    let url = ''
    
    if (this.source && this.source.startsWith('https://')) {
      url = this.source.replace('{z}', tileCoord.z.toString()).replace('{x}', tileCoord.x.toString()).replace('{y}', tileCoord.y.toString())
    } else {
      url = `https://demotiles.maplibre.org/${tileCoord.z}/${tileCoord.x}/${tileCoord.y}.mvt`
    }
    
    return url
  }

  private getVisibleTiles(camera: Camera): TileCoord[] {
    const visibleTiles: TileCoord[] = []
    const zoom = camera.getZoom()
    const center = camera.getCenter()
    
    if (zoom < this.minZoom || zoom > this.maxZoom) {
      return visibleTiles
    }

    const lng = center.lng
    const lat = center.lat
    
    const worldX = (lng + 180) / 360
    const worldY = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2

    const x = Math.floor(worldX * Math.pow(2, zoom))
    const y = Math.floor(worldY * Math.pow(2, zoom))

    const extent = this.calculateTileExtent(camera, zoom)
    
    const minX = Math.max(0, x - extent)
    const maxX = Math.min(Math.pow(2, zoom) - 1, x + extent)
    const minY = Math.max(0, y - extent)
    const maxY = Math.min(Math.pow(2, zoom) - 1, y + extent)

    for (let tileX = minX; tileX <= maxX; tileX++) {
      for (let tileY = minY; tileY <= maxY; tileY++) {
        visibleTiles.push({ x: tileX, y: tileY, z: zoom })
      }
    }

    return visibleTiles
  }

  private calculateTileExtent(camera: Camera, zoom: number): number {
    const pitch = Math.min(camera.getPitch(), 60)
    const tilt = Math.max(0, pitch / 60)
    return Math.floor(1 + Math.pow(2, zoom / 10) * Math.pow(1.5 + tilt, 4))
  }

  private parseColor(colorStr: string, opacity: number = 1.0): [number, number, number, number] {
    const colorMatch = colorStr.match(/rgba?\(([^)]+)\)/)
    
    if (!colorMatch) {
      return [0, 0, 0, 0]
    }

    const values = colorMatch[1].split(',').map(parseFloat)
    
    if (values.length === 0) {
      return [0, 0, 0, 0]
    }

    const alpha = values.length === 4 ? values[3] * opacity : opacity
    
    return [values[0] / 255, values[1] / 255, values[2] / 255, alpha]
  }
}
