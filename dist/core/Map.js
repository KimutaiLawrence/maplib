import { Renderer } from './Renderer';
import { Camera } from './Camera';
import { LayerCollection } from './LayerCollection';
export class Map {
    container;
    canvas;
    renderer;
    camera;
    layers;
    width;
    height;
    isDragging = false;
    lastMousePos = { x: 0, y: 0 };
    constructor(options) {
        this.container = this.getContainer(options.container);
        this.canvas = this.createCanvas();
        this.renderer = new Renderer(this.canvas);
        this.camera = new Camera(options.center.lng, options.center.lat, options.zoom);
        this.layers = new LayerCollection();
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.setupEvents();
        this.render();
    }
    getContainer(container) {
        if (typeof container === 'string') {
            const el = document.getElementById(container);
            if (!el) {
                throw new Error(`Container with id "${container}" not found`);
            }
            return el;
        }
        return container;
    }
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'display: block; width: 100%; height: 100%;';
        this.container.appendChild(canvas);
        return canvas;
    }
    setupEvents() {
        window.addEventListener('resize', () => this.onResize());
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMousePos = { x: e.offsetX, y: e.offsetY };
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging)
                return;
            const mouse = { x: e.offsetX, y: e.offsetY };
            const dx = mouse.x - this.lastMousePos.x;
            const dy = mouse.y - this.lastMousePos.y;
            this.camera.pan(dx, dy);
            this.lastMousePos = mouse;
            this.render();
        });
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            const point = { x: e.offsetX, y: e.offsetY };
            this.camera.zoomAtPoint(-delta * 0.5, point);
            this.render();
        }, { passive: false });
    }
    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.renderer.resize(this.width, this.height);
        this.camera.setSize(this.width, this.height);
        this.render();
    }
    render() {
        this.renderer.clear();
        const layers = this.layers.getLayers();
        for (const layer of layers) {
            if (layer.isVisible()) {
                layer.render(this.renderer, this.camera);
            }
        }
        this.renderer.requestRender(() => this.render());
    }
    addLayer(layer) {
        this.layers.addLayer(layer);
        this.render();
    }
    getCamera() {
        return this.camera;
    }
    getCenter() {
        return this.camera.getCenter();
    }
    setCenter(lngLat) {
        this.camera.setCenter(lngLat);
        this.render();
    }
    getZoom() {
        return this.camera.getZoom();
    }
    setZoom(zoom) {
        this.camera.setZoom(zoom);
        this.render();
    }
    pan(dx, dy) {
        this.camera.pan(dx, dy);
        this.render();
    }
    fitBounds(bounds) {
        const sw = bounds[0];
        const ne = bounds[1];
        const centerLng = (sw[0] + ne[0]) / 2;
        const centerLat = (sw[1] + ne[1]) / 2;
        this.setCenter({ lng: centerLng, lat: centerLat });
        // Simple zoom calculation based on bounds size
        const lngDiff = ne[0] - sw[0];
        const latDiff = ne[1] - sw[1];
        const maxDiff = Math.max(Math.abs(lngDiff), Math.abs(latDiff));
        const zoom = Math.floor(Math.log2(360 / maxDiff));
        this.setZoom(zoom);
    }
    destroy() {
        window.removeEventListener('resize', () => this.onResize());
        this.container.innerHTML = '';
    }
}
//# sourceMappingURL=Map.js.map