import { Camera } from './Camera';
import { RasterLayer } from '../layers/RasterLayer';
import { MapOptions, LngLat } from '../types';
export declare class Map {
    private container;
    private canvas;
    private renderer;
    private camera;
    private layers;
    private width;
    private height;
    private isDragging;
    private lastMousePos;
    constructor(options: MapOptions);
    private getContainer;
    private createCanvas;
    private setupEvents;
    private onResize;
    private render;
    addLayer(layer: RasterLayer): void;
    getCamera(): Camera;
    getCenter(): LngLat;
    setCenter(lngLat: LngLat): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    pan(dx: number, dy: number): void;
    fitBounds(bounds: [[number, number], [number, number]]): void;
    destroy(): void;
}
//# sourceMappingURL=Map.d.ts.map