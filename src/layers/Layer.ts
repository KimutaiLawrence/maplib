import { Renderer } from '../core/Renderer'
import { Camera } from '../core/Camera'
import { LayerOptions } from '../types'

export abstract class Layer {
  protected id: string
  protected visible: boolean
  protected opacity: number

  constructor(options: LayerOptions) {
    this.id = options.id
    this.visible = options.visible !== false
    this.opacity = options.opacity ?? 1.0
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

  abstract getType(): string

  abstract render(renderer: Renderer, camera: Camera): void

  onRemove(): void {
    // Override in child classes
  }
}