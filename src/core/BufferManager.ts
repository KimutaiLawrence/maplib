import { Point } from '../types'

type BufferType = 'array' | 'element' | 'transform'

interface BufferInfo {
  data: Float32Array
  indices: Uint16Array
  count: number
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number }
}

export class BufferManager {
  private buffers: Map<number, BufferInfo> = new Map()
  private activeBufferId: number = 0
  private maxBufferSize: number = 1024 * 1024
  private currentSize: number = 0

  constructor(private gl: WebGLRenderingContext) {}

  createBuffer(points: Point[], indices?: Uint16Array): number {
    const bufferId = ++this.activeBufferId
    const count = points.length
    
    const data = new Float32Array(count * 2)
    
    for (let i = 0; i < count; i++) {
      data[i * 2] = points[i].x
      data[i * 2 + 1] = points[i].y
    }

    const { minX, minY, maxX, maxY } = this.computeBoundingBox(points)

    const bufferInfo: BufferInfo = {
      data,
      indices: indices || this.generateIndices(count),
      count,
      boundingBox: { minX, minY, maxX, maxY }
    }

    this.buffers.set(bufferId, bufferInfo)
    this.currentSize += data.byteLength + bufferInfo.indices.byteLength

    return bufferId
  }

  createBufferFromCoordinates(coords: Point[]): number {
    return this.createBuffer(coords)
  }

  createBufferFromPolygon(ring: Point[]): number {
    return this.createBufferFromCoordinates(ring)
  }

  uploadBuffer(bufferId: number, target: GLenum = this.gl.ARRAY_BUFFER): WebGLBuffer | null {
    const bufferInfo = this.buffers.get(bufferId)
    
    if (!bufferInfo) {
      return null
    }

    const buffer = this.gl.createBuffer()
    
    if (!buffer) {
      return null
    }

    this.gl.bindBuffer(target, buffer)
    
    if (target === this.gl.ARRAY_BUFFER) {
      this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferInfo.data, this.gl.STATIC_DRAW)
    } else if (target === this.gl.ELEMENT_ARRAY_BUFFER) {
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices, this.gl.STATIC_DRAW)
    }

    return buffer
  }

  uploadAllBuffers(bufferIds: number[]): WebGLBuffer[] {
    const buffers: WebGLBuffer[] = []
    
    for (const id of bufferIds) {
      const buffer = this.uploadBuffer(id)
      if (buffer) {
        buffers.push(buffer)
      }
    }
    
    return buffers
  }

  bindBuffer(buffer: WebGLBuffer, offset: number, size: number, stride: number, type: GLenum = this.gl.FLOAT): void {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.vertexAttribPointer(offset, size, type, false, stride, 0)
    this.gl.enableVertexAttribArray(offset)
  }

  getBufferInfo(bufferId: number): BufferInfo | undefined {
    return this.buffers.get(bufferId)
  }

  bufferCount(bufferId: number): number {
    const info = this.buffers.get(bufferId)
    return info ? info.count : 0
  }

  drawBuffer(bufferId: number, drawMode: GLenum = this.gl.TRIANGLES): void {
    const bufferInfo = this.buffers.get(bufferId)
    
    if (!bufferInfo) {
      return
    }

    const vertexBuffer = this.uploadBuffer(bufferId, this.gl.ARRAY_BUFFER)
    const indexBuffer = this.uploadBuffer(bufferId, this.gl.ELEMENT_ARRAY_BUFFER)
    
    if (!vertexBuffer || !indexBuffer) {
      return
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 8, 0)
    this.gl.enableVertexAttribArray(0)

    this.gl.drawElements(drawMode, bufferInfo.indices.length, this.gl.UNSIGNED_SHORT, 0)
  }

  drawArraysBuffer(bufferId: number, drawMode: GLenum = this.gl.TRIANGLES): void {
    const bufferInfo = this.buffers.get(bufferId)
    
    if (!bufferInfo) {
      return
    }

    const buffer = this.uploadBuffer(bufferId, this.gl.ARRAY_BUFFER)
    
    if (!buffer) {
      return
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 8, 0)
    this.gl.enableVertexAttribArray(0)

    this.gl.drawArrays(drawMode, 0, bufferInfo.count)
  }

  clearBuffer(bufferId: number): void {
    const info = this.buffers.get(bufferId)
    
    if (info) {
      this.currentSize -= info.data.byteLength + info.indices.byteLength
      info.data = new Float32Array(0)
      info.indices = new Uint16Array(0)
      info.count = 0
    }
  }

  deleteBuffer(bufferId: number): void {
    const info = this.buffers.get(bufferId)
    
    if (info) {
      this.currentSize -= info.data.byteLength + info.indices.byteLength
      this.buffers.delete(bufferId)
    }
  }

  deleteAllBuffers(): void {
    this.buffers.forEach(info => {
      this.currentSize -= info.data.byteLength + info.indices.byteLength
    })
    this.buffers.clear()
    this.currentSize = 0
  }

  updateBuffer(bufferId: number, points: Point[]): void {
    const info = this.buffers.get(bufferId)
    
    if (!info) {
      this.createBuffer(points)
      return
    }

    this.currentSize -= info.data.byteLength
    
    const newPoints = new Float32Array(points.length * 2)
    
    for (let i = 0; i < points.length; i++) {
      newPoints[i * 2] = points[i].x
      newPoints[i * 2 + 1] = points[i].y
    }

    info.data = newPoints
    info.count = points.length
    info.indices = this.generateIndices(points.length)
    info.boundingBox = this.computeBoundingBox(points)
    
    this.currentSize += newPoints.byteLength + info.indices.byteLength
  }

  getMemoryUsage(): number {
    return this.currentSize
  }

  getBufferIDs(): number[] {
    return Array.from(this.buffers.keys())
  }

  private generateIndices(count: number): Uint16Array {
    if (count < 3) {
      return new Uint16Array(Math.min(count, 0))
    }

    const indices: Uint16Array = new Uint16Array((count - 2) * 3)
    let index = 0
    
    for (let i = 1; i < count - 1; i++) {
      indices[index++] = 0
      indices[index++] = i
      indices[index++] = i + 1
    }

    return indices
  }

  private computeBoundingBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }

    return { minX, minY, maxX, maxY }
  }

  isOutOfBounds(bufferId: number): boolean {
    const info = this.buffers.get(bufferId)
    
    if (!info) {
      return true
    }

    const { minX, minY, maxX, maxY } = info.boundingBox
    
    return minX > 1 || minY > 1 || maxX < 0 || maxY < 0
  }

  getVisibleBuffers(): number[] {
    const visible: number[] = []
    
    this.buffers.forEach((info, bufferId) => {
      if (!this.isOutOfBounds(bufferId)) {
        visible.push(bufferId)
      }
    })

    return visible
  }

  updateMemoryUsage(bytes: number): void {
    this.currentSize += bytes
  }
}
