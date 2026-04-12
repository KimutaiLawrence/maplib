import { Renderer } from './Renderer'
import { Camera } from './Camera'
import { LayerCollection } from './LayerCollection'
import { RasterLayer } from '../layers/RasterLayer'
import { MapOptions, LngLat, Point } from '../types'

export class Map {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private camera: Camera
  private layers: LayerCollection
  private width: number
  private height: number
  private isDragging: boolean = false
  private lastMousePos: Point = { x: 0, y: 0 }

  constructor(options: MapOptions) {
    this.container = this.getContainer(options.container)
    this.canvas = this.createCanvas()
    this.renderer = new Renderer(this.canvas)
    this.camera = new Camera(options.center.lng, options.center.lat, options.zoom)
    this.layers = new LayerCollection()
    this.width = this.container.clientWidth
    this.height = this.container.clientHeight
    
    this.setupEvents()
    this.render()
  }

  private getContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const el = document.getElementById(container)
      if (!el) {
        throw new Error(`Container with id "${container}" not found`)
      }
      return el
    }
    return container
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'display: block; width: 100%; height: 100%;'
    this.container.appendChild(canvas)
    return canvas
  }

  private setupEvents(): void {
    window.addEventListener('resize', () => this.onResize())
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true
      this.lastMousePos = { x: e.offsetX, y: e.offsetY }
    })
    
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return
      const mouse = { x: e.offsetX, y: e.offsetY }
      const dx = mouse.x - this.lastMousePos.x
      const dy = mouse.y - this.lastMousePos.y
      this.camera.pan(dx, dy)
      this.lastMousePos = mouse
      this.render()
    })
    
    window.addEventListener('mouseup', () => {
      this.isDragging = false
    })
    
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      const delta = Math.sign(e.deltaY)
      const point = { x: e.offsetX, y: e.offsetY }
      this.camera.zoomAtPoint(-delta * 0.5, point)
      this.render()
    }, { passive: false })
  }

  private onResize(): void {
    this.width = this.container.clientWidth
    this.height = this.container.clientHeight
    this.renderer.resize(this.width, this.height)
    this.camera.setSize(this.width, this.height)
    this.render()
  }

  private render(): void {
    this.renderer.clear()
    
    const layers = this.layers.getLayers()
    for (const layer of layers) {
      if (layer.isVisible()) {
        layer.render(this.renderer, this.camera)
      }
    }
    
    this.renderer.requestRender(() => this.render())
  }

  addLayer(layer: RasterLayer): void {
    this.layers.addLayer(layer)
    this.render()
  }

  getCamera(): Camera {
    return this.camera
  }

  getCenter(): LngLat {
    return this.camera.getCenter()
  }

  setCenter(lngLat: LngLat): void {
    this.camera.setCenter(lngLat)
    this.render()
  }

  getZoom(): number {
    return this.camera.getZoom()
  }

  setZoom(zoom: number): void {
    this.camera.setZoom(zoom)
    this.render()
  }

  pan(dx: number, dy: number): void {
    this.camera.pan(dx, dy)
    this.render()
  }

  fitBounds(bounds: [[number, number], [number, number]]): void {
    const sw = bounds[0]
    const ne = bounds[1]
    const centerLng = (sw[0] + ne[0]) / 2
    const centerLat = (sw[1] + ne[1]) / 2
    this.setCenter({ lng: centerLng, lat: centerLat })
    // Simple zoom calculation based on bounds size
    const lngDiff = ne[0] - sw[0]
    const latDiff = ne[1] - sw[1]
    const maxDiff = Math.max(Math.abs(lngDiff), Math.abs(latDiff))
    const zoom = Math.floor(Math.log2(360 / maxDiff))
    this.setZoom(zoom)
  }

  destroy(): void {
    window.removeEventListener('resize', () => this.onResize())
    this.container.innerHTML = ''
  }
}