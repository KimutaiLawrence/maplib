import { TileCoord, Point } from '../types';
export type GeometryType = 'LineString' | 'Polygon' | 'MultiPolygon';
export interface Feature {
    id: number | string;
    geometryType: GeometryType;
    coordinates: Point[][];
    properties: Map<string, unknown>;
}
export interface VectorLayerData {
    version: number;
    layers: Array<{
        name: string;
        features: Feature[];
    }>;
}
export declare class VectorTile {
    private tileCoord;
    private data;
    private loaded;
    private error;
    constructor(x: number, y: number, z: number);
    load(url: string): Promise<void>;
    parse(buffer: ArrayBuffer): void;
    private decodeLayer;
    private decodeKeyValue;
    private decodeFeature;
    private decodeGeometry;
    isLoaded(): boolean;
    getData(): VectorLayerData | null;
    getError(): string | null;
    getTileCoord(): TileCoord;
}
//# sourceMappingURL=VectorTile.d.ts.map