import { LayerOptions, TileCoord } from '../types';
import { Renderer, Camera } from '../core';
import { VectorTile } from '../tiles/VectorTile';
export interface VectorLayerOptions extends LayerOptions {
    source?: string;
    minZoom?: number;
    maxZoom?: number;
    tileSize?: number;
    paint?: {
        'fill-color'?: string;
        'fill-opacity'?: number;
        'line-color'?: string;
        'line-width'?: number;
        'line-opacity'?: number;
        'circle-radius'?: number;
        'circle-color'?: string;
        'circle-opacity'?: number;
    };
}
export interface TileInfo {
    vecTile: VectorTile;
    tile: TileCoord;
    loaded: boolean;
    error: string | null;
}
export interface TileKey {
    x: number;
    y: number;
    z: number;
}
export declare class VectorLayer {
    protected id: string;
    protected visible: boolean;
    protected opacity: number;
    protected source: string | null;
    protected minZoom: number;
    protected maxZoom: number;
    protected tileSize: number;
    protected paint: {
        fillColor: string;
        fillOpacity: number;
        lineColor: string;
        lineWidth: number;
        lineOpacity: number;
        circleRadius: number;
        circleColor: string;
        circleOpacity: number;
    };
    protected tiles: Map<string, TileInfo>;
    protected visibleTiles: TileInfo[];
    constructor(options: VectorLayerOptions);
    getId(): string;
    isVisible(): boolean;
    setVisible(visible: boolean): void;
    getOpacity(): number;
    setOpacity(opacity: number): void;
    getType(): string;
    getSource(): string | null;
    setSource(source: string): void;
    getMinZoom(): number;
    getMaxZoom(): number;
    getTileSize(): number;
    getTiles(): Map<string, TileInfo>;
    getTile(tileCoord: TileCoord): TileInfo | null;
    setTile(tileCoord: TileCoord, tileInfo: TileInfo): void;
    updateTile(tileCoord: TileCoord, tile: VectorTile): void;
    removeTile(tileCoord: TileCoord): void;
    clearTiles(): void;
    addTile(tileCoord: TileCoord, vecTile: VectorTile): void;
    loadTiles(camera: Camera): Promise<void[]>;
    render(renderer: Renderer, camera: Camera): void;
    onRemove(): void;
    private getTileKey;
    private getTileUrl;
    private getVisibleTiles;
    private calculateTileExtent;
    private parseColor;
}
//# sourceMappingURL=VectorLayer.d.ts.map