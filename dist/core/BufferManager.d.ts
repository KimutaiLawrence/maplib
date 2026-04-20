import { Point } from '../types';
interface BufferInfo {
    data: Float32Array;
    indices: Uint16Array;
    count: number;
    boundingBox: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}
export declare class BufferManager {
    private gl;
    private buffers;
    private activeBufferId;
    private maxBufferSize;
    private currentSize;
    constructor(gl: WebGLRenderingContext);
    createBuffer(points: Point[], indices?: Uint16Array): number;
    createBufferFromCoordinates(coords: Point[]): number;
    createBufferFromPolygon(ring: Point[]): number;
    uploadBuffer(bufferId: number, target?: GLenum): WebGLBuffer | null;
    uploadAllBuffers(bufferIds: number[]): WebGLBuffer[];
    bindBuffer(buffer: WebGLBuffer, offset: number, size: number, stride: number, type?: GLenum): void;
    getBufferInfo(bufferId: number): BufferInfo | undefined;
    bufferCount(bufferId: number): number;
    drawBuffer(bufferId: number, drawMode?: GLenum): void;
    drawArraysBuffer(bufferId: number, drawMode?: GLenum): void;
    clearBuffer(bufferId: number): void;
    deleteBuffer(bufferId: number): void;
    deleteAllBuffers(): void;
    updateBuffer(bufferId: number, points: Point[]): void;
    getMemoryUsage(): number;
    getBufferIDs(): number[];
    private generateIndices;
    private computeBoundingBox;
    isOutOfBounds(bufferId: number): boolean;
    getVisibleBuffers(): number[];
    updateMemoryUsage(bytes: number): void;
}
export {};
//# sourceMappingURL=BufferManager.d.ts.map