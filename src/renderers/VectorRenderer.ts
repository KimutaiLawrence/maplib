import { Point } from '../types'
import { BufferManager } from '../core/BufferManager'

const VECTOR_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_size;
uniform vec2 u_resolution;
uniform vec4 u_color;

void main() {
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace, 0, 1);
}
`

const VECTOR_FRAGMENT_SHADER = `
precision mediump float;
uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`

const LINE_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_nextPosition;
attribute float a_index;
uniform vec2 u_resolution;
uniform vec2 u_lineWidth;
uniform vec4 u_color;
uniform mat2 u_lineTransform;

varying vec2 v_center;
varying vec2 v_direction;
varying float v_index;

void main() {
  vec2 position = mod(a_index, 2.0) == 0.0 ? a_position : a_nextPosition;
  vec2 clipPos = (position / u_resolution) * 2.0 - 1.0;
  
  vec2 normal = normalize(vec2(-a_nextPosition.y + a_position.y, a_nextPosition.x - a_position.x));
  vec2 side = normal * u_lineWidth * sign(mod(a_index + 0.5, 2.0) - 1.0);
  
  gl_Position = vec4(clipPos + side, 0, 1);
  
  v_center = a_position;
  v_direction = a_nextPosition - a_position;
  v_index = a_index;
}
`

const LINE_FRAGMENT_SHADER = `
precision mediump float;
uniform vec4 u_color;
varying vec2 v_center;
varying vec2 v_direction;
varying float v_index;

void main() {
  vec2 pointOnLine = v_center + normalize(v_direction) * fract(v_index);
  vec2 normal = normalize(vec2(-v_direction.y, v_direction.x));
  vec2 direction = normalize(gl_PointCoord - 0.5);
  
  float width = length(dot(direction, normal));
  width *= 5.0;
  
  gl_FragColor = u_color * smoothstep(0.75, 0.0, width);
}
`

const POLYGON_VERTEX_SHADER = `
attribute vec2 a_position;
attribute float a_index;
uniform vec2 u_resolution;
uniform mat2 u_transform;

void main() {
  vec2 transformedPos = u_transform * a_position;
  vec2 clipSpace = (transformedPos / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace, 0, 1);
}
`

const POLYGON_FRAGMENT_SHADER = `
precision mediump float;
uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
`

const POINT_VERTEX_SHADER = `
attribute vec2 a_position;
attribute float a_size;
uniform vec2 u_resolution;

void main() {
  vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipSpace, 0, 1);
  gl_PointSize = a_size;
}
`

const POINT_FRAGMENT_SHADER = `
precision mediump float;
uniform vec4 u_color;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5, 0.5);
  float dist = length(coord);
  
  if (dist > 0.5) {
    discard;
  }
  
  gl_FragColor = u_color;
}
`

interface VectorGeometry {
  type: 'triangle' | 'line' | 'point'
  positions: Point[]
  indices?: Uint16Array[]
  color: [number, number, number, number]
}

interface TriangleBatch {
  positions: Float32Array
  count: number
  color: [number, number, number, number]
}

interface LineBatch {
  positions: Float32Array
  nextPositions: Float32Array
  indices: Float32Array
  count: number
  lineWidth: number
  color: [number, number, number, number]
}

interface PolyBatch {
  positions: Float32Array
  count: number
  color: [number, number, number, number]
}

interface PointBatch {
  positions: Float32Array
  sizes: Float32Array
  count: number
  color: [number, number, number, number]
}

export class VectorRenderer {
  private gl: WebGLRenderingContext
  private bufferManager: BufferManager
  private triangleBatches: TriangleBatch[] = []
  private lineBatches: LineBatch[] = []
  private polyBatches: PolyBatch[] = []
  private pointBatches: PointBatch[] = []
  
  private trianglesProgram: WebGLProgram | null = null
  private linesProgram: WebGLProgram | null = null
  private polygonsProgram: WebGLProgram | null = null
  private pointsProgram: WebGLProgram | null = null
  
  private trianglesBuffer: WebGLBuffer | null = null
  private linesBuffer: WebGLBuffer | null = null
  private polygonsBuffer: WebGLBuffer | null = null
  private pointsBuffer: WebGLBuffer | null = null

  private trianglesCount: number = 0
  private linesCount: number = 0
  private polygonsCount: number = 0
  private pointsCount: number = 0

  private maxBatchSize: number = 100000

  constructor(
    gl: WebGLRenderingContext,
    bufferManager: BufferManager
  ) {
    this.gl = gl
    this.bufferManager = bufferManager
    this.initShaders()
  }

  private initShaders(): void {
    this.trianglesProgram = this.createProgram(
      VECTOR_VERTEX_SHADER,
      VECTOR_FRAGMENT_SHADER
    )
    this.linesProgram = this.createProgram(
      LINE_VERTEX_SHADER,
      LINE_FRAGMENT_SHADER
    )
    this.polygonsProgram = this.createProgram(
      POLYGON_VERTEX_SHADER,
      POLYGON_FRAGMENT_SHADER
    )
    this.pointsProgram = this.createProgram(
      POINT_VERTEX_SHADER,
      POINT_FRAGMENT_SHADER
    )
  }

  createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const vertex = this.gl.createShader(this.gl.VERTEX_SHADER)
    const fragment = this.gl.createShader(this.gl.FRAGMENT_SHADER)

    if (!vertex || !fragment) {
      return null
    }

    this.gl.shaderSource(vertex, vertexSource)
    this.gl.shaderSource(fragment, fragmentSource)

    this.gl.compileShader(vertex)
    this.gl.compileShader(fragment)

    if (!this.gl.getShaderParameter(vertex, this.gl.COMPILE_STATUS)) {
      console.error('Vertex shader compile error:', this.gl.getShaderInfoLog(vertex))
      return null
    }

    if (!this.gl.getShaderParameter(fragment, this.gl.COMPILE_STATUS)) {
      console.error('Fragment shader compile error:', this.gl.getShaderInfoLog(fragment))
      return null
    }

    const program = this.gl.createProgram()
    
    if (!program) {
      return null
    }

    this.gl.attachShader(program, vertex)
    this.gl.attachShader(program, fragment)
    
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program))
      return null
    }

    this.gl.deleteShader(vertex)
    this.gl.deleteShader(fragment)

    return program
  }

  addGeometry(geometry: VectorGeometry): void {
    const color = geometry.color || [1.0, 1.0, 1.0, 1.0]
    
    switch (geometry.type) {
      case 'triangle':
        this.addTriangleBatch(geometry.positions, color)
        break
      case 'line':
        this.addLineBatch(geometry.positions, color, geometry.lineWidth)
        break
      case 'point':
        this.addPointBatch(geometry.positions, color)
        break
    }
  }

  addTriangleBatch(positions: Point[], indices?: Uint16Array[], color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0]): void {
    if (positions.length < 3) {
      return
    }

    if (this.trianglesCount + positions.length / 3 > this.maxBatchSize) {
      this.flush()
    }

    if (positions.length < 6) {
      return
    }

    const batchPositions = new Float32Array(positions.length * 2)
    
    for (let i = 0; i < positions.length; i++) {
      batchPositions[i * 2] = positions[i].x
      batchPositions[i * 2 + 1] = positions[i].y
    }

    this.triangleBatches.push({
      positions: batchPositions,
      count: positions.length,
      color
    })

    this.trianglesCount += positions.length / 3
  }

  addLineBatch(positions: Point[], color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0], lineWidth: number = 1.0): void {
    if (positions.length < 2) {
      return
    }

    const lineCount = positions.length - 1
    
    if (this.linesCount + lineCount > this.maxBatchSize) {
      this.flush()
    }

    const positionsBuffer = new Float32Array(lineCount * 2)
    const nextPositionsBuffer = new Float32Array(lineCount * 2)
    const indicesBuffer = new Float32Array(lineCount)

    for (let i = 0; i < lineCount; i++) {
      positionsBuffer[i * 2] = positions[i].x
      positionsBuffer[i * 2 + 1] = positions[i].y
      
      nextPositionsBuffer[i * 2] = positions[i + 1].x
      nextPositionsBuffer[i * 2 + 1] = positions[i + 1].y
      
      indicesBuffer[i] = i
    }

    this.lineBatches.push({
      positions: positionsBuffer,
      nextPositions: nextPositionsBuffer,
      indices: indicesBuffer,
      count: lineCount,
      lineWidth,
      color
    })

    this.linesCount += lineCount
  }

  addPolygonBatch(positions: Point[], color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0], fillOpacity: number = 1.0): void {
    if (positions.length < 3) {
      return
    }

    if (this.polygonsCount + positions.length > this.maxBatchSize) {
      this.flush()
    }

    const positionsBuffer = new Float32Array(positions.length * 2)

    for (let i = 0; i < positions.length; i++) {
      positionsBuffer[i * 2] = positions[i].x
      positionsBuffer[i * 2 + 1] = positions[i].y
    }

    this.polyBatches.push({
      positions: positionsBuffer,
      count: positions.length,
      color
    })

    this.polygonsCount += Math.ceil(positions.length / 3)
  }

  addPointBatch(positions: Point[], color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0]): void {
    if (positions.length === 0) {
      return
    }

    if (this.pointsCount + positions.length > this.maxBatchSize) {
      this.flush()
    }

    const positionsBuffer = new Float32Array(positions.length * 2)
    const sizesBuffer = new Float32Array(positions.length)

    for (let i = 0; i < positions.length; i++) {
      positionsBuffer[i * 2] = positions[i].x
      positionsBuffer[i * 2 + 1] = positions[i].y
      sizesBuffer[i] = 5.0
    }

    this.pointBatches.push({
      positions: positionsBuffer,
      sizes: sizesBuffer,
      count: positions.length,
      color
    })

    this.pointsCount += positions.length
  }

  flush(): void {
    if (this.triangleBatches.length > 0 || this.lineBatches.length > 0 || this.polyBatches.length > 0 || this.pointBatches.length > 0) {
      this.uploadBatches()
    }

    this.triangleBatches.length = 0
    this.lineBatches.length = 0
    this.polyBatches.length = 0
    this.pointBatches.length = 0
  }

  private uploadBatches(): void {
    const gl = this.gl
    
    if (this.triangleBatches.length > 0) {
      const totalSize = this.triangleBatches.reduce((acc, batch) => acc + batch.positions.length, 0)
      const positions = new Float32Array(totalSize)
      let offset = 0

      this.triangleBatches.forEach(batch => {
        positions.set(batch.positions, offset)
        offset += batch.positions.length
      })

      this.trianglesBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglesBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    }

    if (this.lineBatches.length > 0) {
      const totalSize = this.lineBatches.reduce((acc, batch) => acc + batch.positions.length, 0)
      const positions = new Float32Array(totalSize * 2)
      let offset = 0

      this.lineBatches.forEach(batch => {
        positions.set(batch.positions, offset)
        offset += batch.positions.length
      })

      this.linesBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, this.linesBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    }

    if (this.polyBatches.length > 0) {
      const totalSize = this.polyBatches.reduce((acc, batch) => acc + batch.positions.length, 0)
      const positions = new Float32Array(totalSize)
      let offset = 0

      this.polyBatches.forEach(batch => {
        positions.set(batch.positions, offset)
        offset += batch.positions.length
      })

      this.polygonsBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, this.polygonsBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    }

    if (this.pointBatches.length > 0) {
      const totalSize = this.pointBatches.reduce((acc, batch) => acc + batch.positions.length, 0)
      const positions = new Float32Array(totalSize)
      const sizes = new Float32Array(totalSize)
      let offset = 0

      this.pointBatches.forEach(batch => {
        positions.set(batch.positions, offset)
        sizes.set(batch.sizes, offset)
        offset += batch.positions.length
      })

      this.pointsBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    }

    this.triangleBatches.length = 0
    this.linesCount = 0
    this.polygonsCount = 0
    this.pointsCount = 0
    this.pointBatches.length = 0
    this.flush()
  }

  render(): void {
    this.flush()

    const gl = this.gl
    const resolution = new Float32Array([gl.canvas.width, gl.canvas.height])

    if (this.trianglesBuffer && this.trianglesProgram) {
      gl.useProgram(this.trianglesProgram)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.trianglesBuffer)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(gl.getUniformLocation(this.trianglesProgram, 'u_resolution'), resolution[0], resolution[1])
      gl.uniform4f(gl.getUniformLocation(this.trianglesProgram, 'u_color'), 1.0, 0.0, 0.0, 1.0)
      gl.drawArrays(gl.TRIANGLES, 0, this.trianglesCount)
      gl.disableVertexAttribArray(0)
    }

    if (this.linesBuffer && this.linesProgram) {
      gl.useProgram(this.linesProgram)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.linesBuffer)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(gl.getUniformLocation(this.linesProgram, 'u_resolution'), resolution[0], resolution[1])
      gl.uniform4f(gl.getUniformLocation(this.linesProgram, 'u_color'), 0.0, 0.0, 1.0, 1.0)
      gl.uniform2f(gl.getUniformLocation(this.linesProgram, 'u_lineWidth'), 1.0, 1.0)
      gl.uniformMatrix2fv(gl.getUniformLocation(this.linesProgram, 'u_lineTransform'), false, new Float32Array([1, 0, 0, 1]))
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.linesCount)
      gl.disableVertexAttribArray(0)
    }

    if (this.polygonsBuffer && this.polygonsProgram) {
      gl.useProgram(this.polygonsProgram)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.polygonsBuffer)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(gl.getUniformLocation(this.polygonsProgram, 'u_resolution'), resolution[0], resolution[1])
      gl.uniform4f(gl.getUniformLocation(this.polygonsProgram, 'u_color'), 0.0, 1.0, 0.0, 1.0)
      gl.uniformMatrix2fv(gl.getUniformLocation(this.polygonsProgram, 'u_transform'), false, new Float32Array([1, 0, 0, 1]))
      gl.drawArrays(gl.TRIANGLES, 0, this.polygonsCount)
      gl.disableVertexAttribArray(0)
    }

    if (this.pointsBuffer && this.pointsProgram) {
      gl.useProgram(this.pointsProgram)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(gl.getUniformLocation(this.pointsProgram, 'u_resolution'), resolution[0], resolution[1])
      gl.uniform4f(gl.getUniformLocation(this.pointsProgram, 'u_color'), 1.0, 1.0, 1.0, 1.0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArrays(gl.POINTS, 0, this.pointsCount)
      gl.disableVertexAttribArray(0)
      gl.disable(gl.BLEND)
    }
  }

  clear(): void {
    this.trianglesCount = 0
    this.linesCount = 0
    this.polygonsCount = 0
    this.pointsCount = 0
    
    this.triangleBatches.length = 0
    this.lineBatches.length = 0
    this.polyBatches.length = 0
    this.pointBatches.length = 0
    
    if (this.trianglesBuffer) {
      this.gl.deleteBuffer(this.trianglesBuffer)
      this.trianglesBuffer = null
    }
    
    if (this.linesBuffer) {
      this.gl.deleteBuffer(this.linesBuffer)
      this.linesBuffer = null
    }
    
    if (this.polygonsBuffer) {
      this.gl.deleteBuffer(this.polygonsBuffer)
      this.polygonsBuffer = null
    }
    
    if (this.pointsBuffer) {
      this.gl.deleteBuffer(this.pointsBuffer)
      this.pointsBuffer = null
    }
  }
}
