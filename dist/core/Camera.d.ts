import { LngLat, Point } from '../types';
export declare class Camera {
    private lng;
    private lat;
    private zoom;
    private pitch;
    private bearing;
    private width;
    private height;
    private tileSize;
    constructor(lng: number, lat: number, zoom: number);
    getCenter(): LngLat;
    setCenter(lngLat: LngLat): void;
    getZoom(): number;
    setZoom(zoom: number): void;
    getPitch(): number;
    setPitch(pitch: number): void;
    getBearing(): number;
    setBearing(bearing: number): void;
    setSize(width: number, height: number): void;
    screenToWorld(screenPoint: Point): Point;
    worldToScreen(worldPoint: Point): Point;
    pan(dx: number, dy: number): void;
    zoomAtPoint(delta: number, point: Point): void;
    rotate(delta: number): void;
    tilt(delta: number): void;
}
//# sourceMappingURL=Camera.d.ts.map