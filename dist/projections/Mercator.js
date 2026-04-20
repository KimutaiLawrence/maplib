const EARTH_RADIUS = 6378137;
export class Mercator {
    static DEFAULT = new Mercator();
    project(lngLat) {
        const x = lngLat.lng / 180;
        const sinLat = Math.sin(lngLat.lat * Math.PI / 180);
        const y = 0.5 * Math.log((1 + sinLat) / (1 - sinLat)) / Math.PI;
        return { x, y };
    }
    unproject(point) {
        const lng = point.x * 180;
        const n = Math.PI - 2 * Math.PI * point.y;
        const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
        return { lng, lat };
    }
    lngLatToWorld(lngLat, zoom) {
        const projected = this.project(lngLat);
        const size = 256 * Math.pow(2, zoom);
        return {
            x: projected.x * size + size / 2,
            y: projected.y * size + size / 2
        };
    }
    worldToLngLat(point, zoom) {
        const size = 256 * Math.pow(2, zoom);
        const normalized = {
            x: (point.x - size / 2) / size,
            y: (point.y - size / 2) / size
        };
        return this.unproject(normalized);
    }
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
//# sourceMappingURL=Mercator.js.map