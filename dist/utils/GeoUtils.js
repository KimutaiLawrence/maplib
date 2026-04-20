export class GeoUtils {
    static TILE_SIZE = 512;
    static MAX_ZOOM = 19;
    static MIN_ZOOM = 0;
    static latHashToY(lat) {
        return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2;
    }
    static yToLatHash(y) {
        return (Math.PI / 4 - Math.atan(sinh(y * Math.PI))) * 180 / Math.PI;
    }
    static lngToXTile(n, lng, zoom) {
        return Math.floor((lng + 180) / 360 * Math.pow(2, zoom) * n);
    }
    static yToTile(n, lat, zoom) {
        const hash = this.latHashToY(lat);
        return Math.floor(hash * Math.pow(2, zoom) * n);
    }
    static xyZoomToWorld(x, y, z) {
        const tileSize = this.TILE_SIZE;
        const worldSize = tileSize << z;
        return [
            x * tileSize,
            y * tileSize,
            worldSize,
            worldSize
        ];
    }
    static worldToLngLat(x, y, zoom) {
        const tileSize = this.TILE_SIZE;
        const worldSize = tileSize * Math.pow(2, zoom);
        const lng = (x / worldSize) * 360 - 180;
        const n = Math.PI - (2 * Math.PI * y) / worldSize;
        const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
        return { lng, lat };
    }
    static lngLatToWorld(lng, lat, zoom) {
        const tileSize = this.TILE_SIZE;
        const worldSize = tileSize * Math.pow(2, zoom);
        const x = (lng + 180) / 360 * worldSize;
        const n = Math.PI - (2 * Math.PI * lat) / 180;
        const y = (worldSize / 2) - (worldSize * Math.log(Math.tan(n / 2))) / (2 * Math.PI);
        return { x, y };
    }
    static lngLatToTile(lng, lat, zoom) {
        const x = (lng + 180) / 360 * Math.pow(2, zoom);
        const n = Math.PI - (2 * Math.PI * lat) / 180;
        const y = (Math.pow(2, zoom) / 2) * (1 - Math.log(Math.tan(n / 2)) / Math.PI);
        return { x: Math.floor(x), y: Math.floor(y) };
    }
    static tileToWorld(tx, ty, z) {
        const tileSize = this.TILE_SIZE;
        const worldSize = tileSize * Math.pow(2, z);
        return {
            x: tx * tileSize,
            y: ty * tileSize,
            size: tileSize
        };
    }
    static getVisibleTiles(lng, lat, zoom, width, height, padding = 0) {
        const tileSize = this.TILE_SIZE;
        const tileAt = { x: 0, y: 0 };
        const zoomLevel = zoom;
        const mapMinTile = this.lngLatToTile(-180, 85.06, zoomLevel);
        const mapMaxTile = this.lngLatToTile(180, -85.06, zoomLevel);
        const mapMax = [
            mapMaxTile.x * tileSize,
            mapMaxTile.y * tileSize
        ];
        const mapMin = [0, 0];
        const pixelX = (this.lngLatToWorld(lng, lat, zoomLevel).x / tileSize) + (padding / tileSize);
        const pixelY = (this.lngLatToWorld(lng, lat, zoomLevel).y / tileSize) + (padding / tileSize);
        const zoomRes = pixelX - (this.lngLatToTile(lng, lat, zoomLevel).x);
        tileAt.x = Math.floor(pixelX - (this.lngLatToTile(lng, lat, zoomLevel).x) - 0.5);
        const pixelRes = pixelY - (this.lngLatToTile(lng, lat, zoomLevel).y);
        tileAt.y = Math.floor(pixelY - (this.lngLatToTile(lng, lat, zoomLevel).y) - 0.5);
        const visibleTiles = [];
        if (tileAt.x < mapMin[0] || tileAt.x > mapMax[0] ||
            tileAt.y < mapMin[1] || tileAt.y > mapMax[1])
            return visibleTiles;
        let top = tileAt.y;
        let bottom = tileAt.y + Math.ceil(height / tileSize) + 1;
        let left = tileAt.x;
        let right = tileAt.x + Math.ceil(width / tileSize) + 1;
        top = Math.floor(zoomRes) > 0 ? top : top > 0 ? top - 1 : top;
        bottom = Math.floor(zoomRes) > 0 ? bottom : bottom < 180 ? bottom + 1 : bottom;
        top = Math.floor(pixelRes) > 0 ? top : top > 0 ? top - 1 : top;
        bottom = Math.floor(pixelRes) > 0 ? bottom : bottom < 180 ? bottom + 1 : bottom;
        for (let y = top; y <= bottom; y++) {
            this.clampTileCoordinates(zoomLevel, x, y, tileAt.x, tileAt.y);
            for (let x = left; x <= right; x++) {
                this.clampTileCoordinates(zoomLevel, x, tileAt.x, tileAt.y);
                visibleTiles.push({ x, y });
            }
        }
        return visibleTiles;
    }
    static clampTileCoordinates(z, x, y, tx, ty) {
        const max = Math.pow(2, z);
        if (x < 0 || x >= max)
            return;
        if (y < 0 || y >= max)
            return;
    }
    static sinh(x) {
        const exp = Math.exp(x);
        return (exp - 1 / exp) / 2;
    }
}
//# sourceMappingURL=GeoUtils.js.map