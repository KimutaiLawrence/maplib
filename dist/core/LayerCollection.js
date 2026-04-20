export class LayerCollection {
    layers = new Map();
    orderedIds = [];
    addLayer(layer) {
        if (this.layers.has(layer.getId())) {
            throw new Error(`Layer with id ${layer.getId()} already exists`);
        }
        this.layers.set(layer.getId(), layer);
        this.orderedIds.push(layer.getId());
    }
    removeLayer(id) {
        const layer = this.layers.get(id);
        if (layer) {
            layer.onRemove();
            this.layers.delete(id);
            const index = this.orderedIds.indexOf(id);
            if (index > -1) {
                this.orderedIds.splice(index, 1);
            }
        }
    }
    getLayer(id) {
        return this.layers.get(id);
    }
    getLayers() {
        return this.orderedIds.map(id => this.layers.get(id)).filter(Boolean);
    }
    getLayersOfType(type) {
        return this.getLayers().filter(layer => layer.getType() === type);
    }
    hasLayer(id) {
        return this.layers.has(id);
    }
    setLayerVisibility(id, visible) {
        const layer = this.layers.get(id);
        if (layer) {
            layer.setVisible(visible);
        }
    }
    setLayerOpacity(id, opacity) {
        const layer = this.layers.get(id);
        if (layer) {
            layer.setOpacity(opacity);
        }
    }
}
//# sourceMappingURL=LayerCollection.js.map