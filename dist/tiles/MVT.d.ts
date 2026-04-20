import { Point } from '../types';
export type GeometryType = 'LineString' | 'Polygon' | 'MultiPolygon';
export interface Feature {
    id: number | string;
    type: GeometryType;
    coordinates: Point[][][];
    properties: Record<string, unknown>;
}
export interface VectorLayerData {
    version: number;
    layers: Array<{
        name: string;
        features: Feature[];
    }>;
}
export declare function decodeVectorTile(buffer: ArrayBuffer): VectorLayerData;
export declare function transformFeature(feature: Feature, tileX: number, tileY: number, zoom: number): Feature;
//# sourceMappingURL=MVT.d.ts.map