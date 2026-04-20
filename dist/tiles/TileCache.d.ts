import { Tile } from './Tile';
import { TileCoord } from '../types';
export declare class TileCache {
    private maxCount;
    private tiles;
    private accessOrder;
    constructor(maxCount?: number);
    private getKey;
    getTile(coord: TileCoord): Tile | undefined;
    addTile(tile: Tile): void;
    loadTile(coord: TileCoord, urlTemplate: string): Promise<Tile>;
    hasTile(coord: TileCoord): boolean;
    evictTile(key: string): void;
    evictTilesOutsideZoom(zoom: number, maxZoomDiff?: number): void;
    clear(): void;
    getSize(): number;
    getCount(): number;
}
//# sourceMappingURL=TileCache.d.ts.map