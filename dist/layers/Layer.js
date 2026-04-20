export class Layer {
    id;
    visible;
    opacity;
    constructor(options) {
        this.id = options.id;
        this.visible = options.visible !== false;
        this.opacity = options.opacity ?? 1.0;
    }
    getId() {
        return this.id;
    }
    isVisible() {
        return this.visible;
    }
    setVisible(visible) {
        this.visible = visible;
    }
    getOpacity() {
        return this.opacity;
    }
    setOpacity(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
    }
    onRemove() {
        // Override in child classes
    }
}
//# sourceMappingURL=Layer.js.map