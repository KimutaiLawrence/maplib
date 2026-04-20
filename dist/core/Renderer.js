export class Renderer {
    canvas;
    gl;
    width;
    height;
    animationFrameId = null;
    constructor(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.gl = this.initWebGL();
    }
    initWebGL() {
        const gl = this.canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL 2.0 not supported');
        }
        gl.clearColor(0.1, 0.1, 0.15, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        return gl;
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    requestRender(fn) {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.animationFrameId = requestAnimationFrame(() => {
            fn();
            this.animationFrameId = null;
        });
    }
    getWebGL() {
        return this.gl;
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
}
//# sourceMappingURL=Renderer.js.map