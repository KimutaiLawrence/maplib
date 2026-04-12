import { Layer } from './Layer'
import { Renderer } from '../core/Renderer'
import { Camera } from '../core/Camera'
import { TileCoord } from '../types'
import { GeoUtils } from '../utils/GeoUtils'

interface RasterLayerOptions {
  id: string
  visible?: boolean
  opacity?: number
  tiles: string[]
  minZoom?: number
  maxZoom?: number
}

export class RasterLayer extends Layer {
  private tiles: string[]
  private minZoom: number
  private maxZoom: number
  private textureLocations: Map<string, WebGLTexture | null> = new Map()
  private tileVertices: Map<string, Float32Array> = new Map()
  private tileIndices: Map<string, Uint16Array> = new Map()
  private gl: WebGL2RenderingContext
  private program: WebGLProgram

  constructor(options: RasterLayerOptions) {
    super({ id: options.id, visible: options.visible, opacity: options.opacity })
    this.tiles = options.tiles
    this.minZoom = options.minZoom ?? 0
    this.maxZoom = options.maxZoom ?? 19
  }

  getType(): string {
    return 'raster'
  }

  initWebGL(gl: WebGL2RenderingContext, program: WebGLProgram): void {
    this.gl = gl
    this.program = program
  }

  private getTileKey(coord: TileCoord): string {
    return `${coord.z}-${coord.x}-${coord.y}`
  }

  private createTexture(gl: WebGL2RenderingContext, tileKey: string): WebGLTexture {
    const texture = gl.createTexture()
    if (!texture) {
      this.textureLocations.set(tileKey, null)
      return null
    }
    
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    
    this.textureLocations.set(tileKey, texture)
    return texture
  }

  private loadTile(
    url: string,
    tileKey: string,
    coord: TileCoord
  ): Promise<void> {
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Tile fetch failed')
        return response.blob()
      })
      .then(blob => blob.arrayBuffer())
      .then(arrayBuffer => {
        const texture = this.textureLocations.get(tileKey)
        if (!texture) return
        
        const imageBitmap = createImageBitmap(arrayBuffer)
          .then(bitmap => {
            const gl = this.gl
            const program = this.program
            
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              bitmap
            )
            
            const tileSize = GeoUtils.TILE_SIZE
            const vertices = new Float32Array([
              0, 0, 1, 0, 1, 1, 0, 1
            ])
            const indices = new Uint16Array([0, 1, 2, 0, 2, 3])
            
            this.tileVertices.set(tileKey, vertices)
            this.tileIndices.set(tileKey, indices)
          })
      })
      .catch(err => {
        console.error(`Failed to load tile ${tileKey}:`, err)
        this.textureLocations.set(tileKey, null)
      })
  }

  render(renderer: Renderer, camera: Camera): void {
    if (!this.visible || this.opacity === 0) return

    const gl = renderer.getWebGL()
    const zoom = Math.floor(camera.getZoom())
    
    if (zoom < this.minZoom || zoom > this.maxZoom) return

    const center = camera.getCenter()
    const tileSize = GeoUtils.TILE_SIZE
    const centerX = GeoUtils.lngLatToWorld(center.lng, center.lat, zoom).x
    const centerY = GeoUtils.lngLatToWorld(center.lat, center.lng, zoom).y
    const worldSize = tileSize * Math.pow(2, zoom)
    const cameraX = centerX - worldSize / 2
    const cameraY = centerY - worldSize / 2

    const tileX0 = Math.floor(cameraX / tileSize)
    const tileX1 = Math.floor((cameraX + renderer.getWidth() * tileSize / Math.max(renderer.getWidth(), renderer.getHeight())) / tileSize)
    const tileY0 = Math.floor(cameraY / tileSize)
    const tileY1 = Math.floor((cameraY + renderer.getHeight() * tileSize / Math.max(renderer.getWidth(), renderer.getHeight())) / tileSize)

    for (let x = tileX0; x <= tileX1; x++) {
      for (let y = tileY0; y <= tileY1; y++) {
        const tileKey = this.getTileKey({ x, y, z: zoom })
        const texture = this.textureLocations.get(tileKey)
        
        if (!texture || !this.tileVertices.has(tileKey)) {
          const url = thistiles[0].replace('{z}', zoom.toString())
            .replace('{x}', x.toString())
            .replace('{y}', y.toString())
          this.loadTile(url, tileKey, { x, y, z: zoom })
          continue
        }

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        
        const vertices = this.tileVertices.get(tileKey)!
        const indices = this.tileIndices.get(tileKey)!
        
        // Bind buffers and draw
        // (In full implementation, would create and bind VAO/VBO/IBO)
      }
    }
  }

  onRemove(): void {
    for (const [key, texture] of this.textureLocations.entries()) {
      if (texture) {
        this.gl.deleteTexture(texture)
      }
    }
    this.textureLocations.clear()
    this.tileVertices.clear()
    this.tileIndices.clear()
  }
}