export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Bounds {
  min: Point
  max: Point
}

export interface LngLat {
  lng: number
  lat: number
}

export interface MapOptions {
  container: string | HTMLElement
  center: LngLat
  zoom: number
  minZoom?: number
  maxZoom?: number
  tileSize?: number
  pitch?: number
  bearing?: number
}

export interface TileCoord {
  x: number
  y: number
  z: number
}

export interface LayerOptions {
  id: string
  visible?: boolean
  opacity?: number
}

export type Layer = {
  getType(): string
  visible: boolean
  opacity: number
}