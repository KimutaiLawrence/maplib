import { Tile, TileState } from './Tile';
export class TileCache {
    maxCount;
    tiles = new Map();
    accessOrder = new Set();
    constructor(maxCount = 64) {
        this.maxCount = maxCount;
    }
    getKey(coord) {
        return `${coord.z}-${coord.x}-${coord.y}`;
    }
    getTile(coord) {
        const key = this.getKey(coord);
        const tile = this.tiles.get(key);
        if (tile) {
            this.accessOrder.delete(key);
            this.accessOrder.add(key);
        }
        return tile;
    }
    addTile(tile) {
        const key = tile.getKey();
        if (!this.tiles.has(key)) {
            if (this.tiles.size >= this.maxCount) {
                const oldestKey = Array.from(this.accessOrder.values())[0];
                this.evictTile(oldestKey);
            }
            this.tiles.set(key, tile);
        }
        this.accessOrder.delete(key);
        this.accessOrder.add(key);
    }
    loadTile(coord, urlTemplate) {
        const existingTile = this.getTile(coord);
        if (existingTile && existingTile.getState() === TileState.Loaded) {
            return Promise.resolve(existingTile);
        }
        const tile = existingTile || new Tile(coord.x, coord.y, coord.z);
        const url = urlTemplate
            .replace('{z}', coord.z.toString())
            .replace('{x}', coord.x.toString())
            .replace('{y}', coord.y.toString());
        return tile.load(url).then(() => {
            this.addTile(tile);
            return tile;
        });
    }
    hasTile(coord) {
        const tile = this.getTile(coord);
        return tile !== undefined && tile.getState() === TileState.Loaded;
    }
    evictTile(key) {
        const tile = this.tiles.get(key);
        if (tile) {
            tile.reset();
            this.tiles.delete(key);
            this.accessOrder.delete(key);
        }
    }
    evictTilesOutsideZoom(zoom, maxZoomDiff = 1) {
        const keysToRemove = [];
        for (const [key, tile] of this.tiles.entries()) {
            if (Math.abs(tile.getZ() - zoom) > maxZoomDiff) {
                keysToRemove.push(key);
            }
        }
        for (const key of keysToRemove) {
            this.evictTile(key);
        }
    }
    clear() {
        for (const tile of this.tiles.values()) {
            tile.reset();
        }
        this.tiles.clear();
        this.accessOrder.clear();
    }
    getSize() {
        return this.tiles.size;
    }
    getCount() {
        return this.tiles.size;
    }
}
//# sourceMappingURL=TileCache.js.map