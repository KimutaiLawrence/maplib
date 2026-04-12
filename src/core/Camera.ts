import { LngLat, Point } from '../types'
import { GeoUtils } from '../utils/GeoUtils'

export class Camera {
  private lng: number
  private lat: number
  private zoom: number
  private pitch: number
  private bearing: number
  private width: number
  private height: number
  private tileSize: number

  constructor(lng: number, lat: number, zoom: number) {
    this.lng = lng
    this.lat = lat
    this.zoom = zoom
    this.pitch = 0
    this.bearing = 0
    this.width = 0
    this.height = 0
    this.tileSize = GeoUtils.TILE_SIZE
  }

  getCenter(): LngLat {
    return { lng: this.lng, lat: this.lat }
  }

  setCenter(lngLat: LngLat): void {
    this.lng = lngLat.lng
    this.lat = lngLat.lat
  }

  getZoom(): number {
    return this.zoom
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(GeoUtils.MIN_ZOOM, Math.min(GeoUtils.MAX_ZOOM, zoom))
  }

  getPitch(): number {
    return this.pitch
  }

  setPitch(pitch: number): void {
    this.pitch = Math.max(0, Math.min(60, pitch))
  }

  getBearing(): number {
    return this.bearing
  }

  setBearing(bearing: number): void {
    this.bearing = ((bearing % 360) + 360) % 360
  }

  setSize(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  screenToWorld(screenPoint: Point): Point {
    const center = GeoUtils.lngLatToWorld(this.lng, this.lat, this.zoom)
    const scale = this.tileSize * Math.pow(2, this.zoom) / Math.max(this.width, this.height)
    
    return {
      x: screenPoint.x * scale + center.x - this.width * scale / 2,
      y: screenPoint.y * scale + center.y - this.height * scale / 2
    }
  }

  worldToScreen(worldPoint: Point): Point {
    const center = GeoUtils.lngLatToWorld(this.lng, this.lat, this.zoom)
    const scale = this.tileSize * Math.pow(2, this.zoom) / Math.max(this.width, this.height)

    return {
      x: (worldPoint.x - center.x + this.width * scale / 2) / scale,
      y: (worldPoint.y - center.y + this.height * scale / 2) / scale
    }
  }

  pan(dx: number, dy: number): void {
    const scale = this.tileSize * Math.pow(2, this.zoom) / Math.max(this.width, this.height)
    const deltaLngLat = GeoUtils.worldToLngLat(
      this.width * scale / 2 - dx,
      this.height * scale / 2 - dy,
      this.zoom
    )
    
    this.lng = deltaLngLat.lng
    this.lat = deltaLngLat.lat
  }

  zoomAtPoint(delta: number, point: Point): void {
    const worldPoint = this.screenToWorld(point)
    this.zoom += delta
    this.zoom = Math.max(GeoUtils.MIN_ZOOM, Math.min(GeoUtils.MAX_ZOOM, this.zoom))
    
    const newPoint = this.screenToWorld(point)
    const deltaWorld = {
      x: worldPoint.x - newPoint.x,
      y: worldPoint.y - newPoint.y
    }

    const deltaLngLat = GeoUtils.worldToLngLat(
      deltaWorld.x,
      deltaWorld.y,
      this.zoom
    )

    this.lng = deltaLngLat.lng
    this.lat = deltaLngLat.lat
  }

  rotate(delta: number): void {
    this.bearing = ((this.bearing + delta) % 360 + 360) % 360
  }

  tilt(delta: number): void {
    this.pitch = Math.max(0, Math.min(60, this.pitch + delta))
  }
}