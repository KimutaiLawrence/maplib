import { Point } from '../types';
import { BufferManager } from '../core/BufferManager';
interface VectorGeometry {
    type: 'triangle' | 'line' | 'point';
    positions: Point[];
    indices?: Uint16Array[];
    color: [number, number, number, number];
}
export declare class VectorRenderer {
    private triangleBatches;
    private lineBatches;
    private polyBatches;
    private pointBatches;
    private trianglesProgram;
    private linesProgram;
    private polygonsProgram;
    private pointsProgram;
    private trianglesBuffer;
    private linesBuffer;
    private polygonsBuffer;
    private pointsBuffer;
    private trianglesCount;
    private linesCount;
    private polygonsCount;
    private pointsCount;
    private maxBatchSize;
    constructor(gl: WebGLRenderingContext, bufferManager: BufferManager);
    private initShaders;
    createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null;
    addGeometry(geometry: VectorGeometry): void;
    addTriangleBatch(positions: Point[], indices?: Uint16Array[], color?: [number, number, number, number]): void;
    addLineBatch(positions: Point[], color?: [number, number, number, number], lineWidth?: number): void;
    addPolygonBatch(positions: Point[], color?: [number, number, number, number], fillOpacity?: number): void;
    addPointBatch(positions: Point[], color?: [number, number, number, number]): void;
    flush(): void;
    private uploadBatches;
    render(): void;
    clear(): void;
}
export {};
//# sourceMappingURL=VectorRenderer.d.ts.map