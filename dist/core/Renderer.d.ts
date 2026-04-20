export declare class Renderer {
    private canvas;
    private gl;
    private width;
    private height;
    private animationFrameId;
    constructor(canvas: HTMLCanvasElement);
    private initWebGL;
    resize(width: number, height: number): void;
    clear(): void;
    requestRender(fn: () => void): void;
    getWebGL(): WebGL2RenderingContext;
    getWidth(): number;
    getHeight(): number;
}
//# sourceMappingURL=Renderer.d.ts.map