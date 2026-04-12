import { Layer } from '../layers/Layer'

export class LayerCollection {
  private layers: Map<string, Layer> = new Map()
  private orderedIds: string[] = []

  addLayer(layer: Layer): void {
    if (this.layers.has(layer.getId())) {
      throw new Error(`Layer with id ${layer.getId()} already exists`)
    }
    this.layers.set(layer.getId(), layer)
    this.orderedIds.push(layer.getId())
  }

  removeLayer(id: string): void {
    const layer = this.layers.get(id)
    if (layer) {
      layer.onRemove()
      this.layers.delete(id)
      const index = this.orderedIds.indexOf(id)
      if (index > -1) {
        this.orderedIds.splice(index, 1)
      }
    }
  }

  getLayer(id: string): Layer | undefined {
    return this.layers.get(id)
  }

  getLayers(): Layer[] {
    return this.orderedIds.map(id => this.layers.get(id)!).filter(Boolean)
  }

  getLayersOfType(type: string): Layer[] {
    return this.getLayers().filter(layer => layer.getType() === type)
  }

  hasLayer(id: string): boolean {
    return this.layers.has(id)
  }

  setLayerVisibility(id: string, visible: boolean): void {
    const layer = this.layers.get(id)
    if (layer) {
      layer.setVisible(visible)
    }
  }

  setLayerOpacity(id: string, opacity: number): void {
    const layer = this.layers.get(id)
    if (layer) {
      layer.setOpacity(opacity)
    }
  }
}