import { Layer } from './Layer';
import { Renderer } from '../core/Renderer';
import { Camera } from '../core/Camera';
interface RasterLayerOptions {
    id: string;
    visible?: boolean;
    opacity?: number;
    tiles: string[];
    minZoom?: number;
    maxZoom?: number;
    tileSize?: number;
}
export declare class RasterLayer extends Layer {
    private tiles;
    private minZoom;
    private maxZoom;
    private tileSize;
    private tileCache;
    constructor(options: RasterLayerOptions);
    getType(): string;
    getMinZoom(): number;
    getMaxZoom(): number;
    getTileSize(): number;
    private getVisibleTiles;
    update(renderer: Renderer, camera: Camera): Promise<void>;
    render(renderer: Renderer, camera: Camera): void;
    destroy(): Promise<void>;
}
export {};
//# sourceMappingURL=RasterLayer.d.ts.map