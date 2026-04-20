export declare class GeoUtils {
    static TILE_SIZE: number;
    static MAX_ZOOM: number;
    static MIN_ZOOM: number;
    static latHashToY(lat: number): number;
    static yToLatHash(y: number): number;
    static lngToXTile(n: number, lng: number, zoom: number): number;
    static yToTile(n: number, lat: number, zoom: number): number;
    static xyZoomToWorld(x: number, y: number, z: number): number[];
    static worldToLngLat(x: number, y: number, zoom: number): {
        lng: number;
        lat: number;
    };
    static lngLatToWorld(lng: number, lat: number, zoom: number): {
        x: number;
        y: number;
    };
    static lngLatToTile(lng: number, lat: number, zoom: number): {
        x: number;
        y: number;
    };
    static tileToWorld(tx: number, ty: number, z: number): {
        x: number;
        y: number;
        size: number;
    };
    static getVisibleTiles(lng: number, lat: number, zoom: number, width: number, height: number, padding?: number): Array<{
        x: number;
        y: number;
    }>;
    static clampTileCoordinates(z: number, x: number, y: number, tx: number, ty: number): void;
    private static sinh;
}
//# sourceMappingURL=GeoUtils.d.ts.map