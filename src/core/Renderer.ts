export class Renderer {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private width: number
  private height: number
  private animationFrameId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.width = canvas.width
    this.height = canvas.height
    this.gl = this.initWebGL()
  }

  private initWebGL(): WebGL2RenderingContext {
    const gl = this.canvas.getContext('webgl2')
    if (!gl) {
      throw new Error('WebGL 2.0 not supported')
    }
    gl.clearColor(0.1, 0.1, 0.15, 1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    return gl
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
    this.gl.viewport(0, 0, width, height)
  }

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  }

  requestRender(fn: () => void): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.animationFrameId = requestAnimationFrame(() => {
      fn()
      this.animationFrameId = null
    })
  }

  getWebGL(): WebGL2RenderingContext {
    return this.gl
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }
}