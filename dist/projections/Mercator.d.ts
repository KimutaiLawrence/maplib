import { Point, LngLat } from '../types';
export declare class Mercator {
    static DEFAULT: Mercator;
    project(lngLat: LngLat): Point;
    unproject(point: Point): LngLat;
    lngLatToWorld(lngLat: LngLat, zoom: number): Point;
    worldToLngLat(point: Point, zoom: number): LngLat;
    distance(p1: Point, p2: Point): number;
}
//# sourceMappingURL=Mercator.d.ts.map