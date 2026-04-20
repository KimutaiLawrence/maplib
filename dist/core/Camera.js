import { GeoUtils } from '../utils/GeoUtils';
export class Camera {
    lng;
    lat;
    zoom;
    pitch;
    bearing;
    width;
    height;
    tileSize;
    constructor(lng, lat, zoom) {
        this.lng = lng;
        this.lat = lat;
        this.zoom = zoom;
        this.pitch = 0;
        this.bearing = 0;
        this.width = 0;
        this.height = 0;
        this.tileSize = GeoUtils.TILE_SIZE;
    }
    getCenter() {
        return { lng: this.lng, lat: this.lat };
    }
    setCenter(lngLat) {
        this.lng = lngLat.lng;
        this.lat = lngLat.lat;
    }
    getZoom() {
        return this.zoom;
    }
    setZoom(zoom) {
        this.zoom = Math.max(GeoUtils.MIN_ZOOM, Math.min(GeoUtils.MAX_ZOOM, zoom));
    }
    getPitch() {
        return this.pitch;
    }
    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(60, pitch));
    }
    getBearing() {
        return this.bearing;
    }
    setBearing(bearing) {
        this.bearing = ((bearing % 360) + 360) % 360;
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    screenToWorld(screenPoint) {
        const center = GeoUtils.lngLatToWorld(this.lng, this.lat, this.zoom);
        const scale = this.tileSize * Math.pow(2, this.zoom) / Math.max(this.width, this.height);
        return {
            x: screenPoint.x * scale + center.x - this.width * scale / 2,
            y: screenPoint.y * scale + center.y - this.height * scale / 2
        };
    }
    worldToScreen(worldPoint) {
        const center = GeoUtils.lngLatToWorld(this.lng, this.lat, this.zoom);
        const scale = this.tileSize * Math.pow(2, this.zoom) / Math.max(this.width, this.height);
        return {
            x: (worldPoint.x - center.x + this.width * scale / 2) / scale,
            y: (worldPoint.y - center.y + this.height * scale / 2) / scale
        };
    }
    pan(dx, dy) {
        const scale = this.tileSize * Math.pow(2, this.zoom) / Math.max(this.width, this.height);
        const deltaLngLat = GeoUtils.worldToLngLat(this.width * scale / 2 - dx, this.height * scale / 2 - dy, this.zoom);
        this.lng = deltaLngLat.lng;
        this.lat = deltaLngLat.lat;
    }
    zoomAtPoint(delta, point) {
        const worldPoint = this.screenToWorld(point);
        this.zoom += delta;
        this.zoom = Math.max(GeoUtils.MIN_ZOOM, Math.min(GeoUtils.MAX_ZOOM, this.zoom));
        const newPoint = this.screenToWorld(point);
        const deltaWorld = {
            x: worldPoint.x - newPoint.x,
            y: worldPoint.y - newPoint.y
        };
        const deltaLngLat = GeoUtils.worldToLngLat(deltaWorld.x, deltaWorld.y, this.zoom);
        this.lng = deltaLngLat.lng;
        this.lat = deltaLngLat.lat;
    }
    rotate(delta) {
        this.bearing = ((this.bearing + delta) % 360 + 360) % 360;
    }
    tilt(delta) {
        this.pitch = Math.max(0, Math.min(60, this.pitch + delta));
    }
}
//# sourceMappingURL=Camera.js.map