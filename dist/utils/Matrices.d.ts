export declare class Matrices {
    static perspective(fov: number, aspect: number, near: number, far: number, out: Float32Array): Float32Array;
    static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number, out: Float32Array): Float32Array;
    static translate(out: Float32Array, a: Float32Array, v: [number, number, number]): Float32Array;
    static scale(out: Float32Array, a: Float32Array, v: [number, number, number]): Float32Array;
    static rotateZ(out: Float32Array, a: Float32Array, rad: number): Float32Array;
    static multiply(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array;
    static identity(out: Float32Array): Float32Array;
}
//# sourceMappingURL=Matrices.d.ts.map