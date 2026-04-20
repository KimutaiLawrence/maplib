export class BufferManager {
    gl;
    buffers = new Map();
    activeBufferId = 0;
    maxBufferSize = 1024 * 1024;
    currentSize = 0;
    constructor(gl) {
        this.gl = gl;
    }
    createBuffer(points, indices) {
        const bufferId = ++this.activeBufferId;
        const count = points.length;
        const data = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            data[i * 2] = points[i].x;
            data[i * 2 + 1] = points[i].y;
        }
        const { minX, minY, maxX, maxY } = this.computeBoundingBox(points);
        const bufferInfo = {
            data,
            indices: indices || this.generateIndices(count),
            count,
            boundingBox: { minX, minY, maxX, maxY }
        };
        this.buffers.set(bufferId, bufferInfo);
        this.currentSize += data.byteLength + bufferInfo.indices.byteLength;
        return bufferId;
    }
    createBufferFromCoordinates(coords) {
        return this.createBuffer(coords);
    }
    createBufferFromPolygon(ring) {
        return this.createBufferFromCoordinates(ring);
    }
    uploadBuffer(bufferId, target = this.gl.ARRAY_BUFFER) {
        const bufferInfo = this.buffers.get(bufferId);
        if (!bufferInfo) {
            return null;
        }
        const buffer = this.gl.createBuffer();
        if (!buffer) {
            return null;
        }
        this.gl.bindBuffer(target, buffer);
        if (target === this.gl.ARRAY_BUFFER) {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferInfo.data, this.gl.STATIC_DRAW);
        }
        else if (target === this.gl.ELEMENT_ARRAY_BUFFER) {
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices, this.gl.STATIC_DRAW);
        }
        return buffer;
    }
    uploadAllBuffers(bufferIds) {
        const buffers = [];
        for (const id of bufferIds) {
            const buffer = this.uploadBuffer(id);
            if (buffer) {
                buffers.push(buffer);
            }
        }
        return buffers;
    }
    bindBuffer(buffer, offset, size, stride, type = this.gl.FLOAT) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(offset, size, type, false, stride, 0);
        this.gl.enableVertexAttribArray(offset);
    }
    getBufferInfo(bufferId) {
        return this.buffers.get(bufferId);
    }
    bufferCount(bufferId) {
        const info = this.buffers.get(bufferId);
        return info ? info.count : 0;
    }
    drawBuffer(bufferId, drawMode = this.gl.TRIANGLES) {
        const bufferInfo = this.buffers.get(bufferId);
        if (!bufferInfo) {
            return;
        }
        const vertexBuffer = this.uploadBuffer(bufferId, this.gl.ARRAY_BUFFER);
        const indexBuffer = this.uploadBuffer(bufferId, this.gl.ELEMENT_ARRAY_BUFFER);
        if (!vertexBuffer || !indexBuffer) {
            return;
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 8, 0);
        this.gl.enableVertexAttribArray(0);
        this.gl.drawElements(drawMode, bufferInfo.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
    drawArraysBuffer(bufferId, drawMode = this.gl.TRIANGLES) {
        const bufferInfo = this.buffers.get(bufferId);
        if (!bufferInfo) {
            return;
        }
        const buffer = this.uploadBuffer(bufferId, this.gl.ARRAY_BUFFER);
        if (!buffer) {
            return;
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 8, 0);
        this.gl.enableVertexAttribArray(0);
        this.gl.drawArrays(drawMode, 0, bufferInfo.count);
    }
    clearBuffer(bufferId) {
        const info = this.buffers.get(bufferId);
        if (info) {
            this.currentSize -= info.data.byteLength + info.indices.byteLength;
            info.data = new Float32Array(0);
            info.indices = new Uint16Array(0);
            info.count = 0;
        }
    }
    deleteBuffer(bufferId) {
        const info = this.buffers.get(bufferId);
        if (info) {
            this.currentSize -= info.data.byteLength + info.indices.byteLength;
            this.buffers.delete(bufferId);
        }
    }
    deleteAllBuffers() {
        this.buffers.forEach(info => {
            this.currentSize -= info.data.byteLength + info.indices.byteLength;
        });
        this.buffers.clear();
        this.currentSize = 0;
    }
    updateBuffer(bufferId, points) {
        const info = this.buffers.get(bufferId);
        if (!info) {
            this.createBuffer(points);
            return;
        }
        this.currentSize -= info.data.byteLength;
        const newPoints = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            newPoints[i * 2] = points[i].x;
            newPoints[i * 2 + 1] = points[i].y;
        }
        info.data = newPoints;
        info.count = points.length;
        info.indices = this.generateIndices(points.length);
        info.boundingBox = this.computeBoundingBox(points);
        this.currentSize += newPoints.byteLength + info.indices.byteLength;
    }
    getMemoryUsage() {
        return this.currentSize;
    }
    getBufferIDs() {
        return Array.from(this.buffers.keys());
    }
    generateIndices(count) {
        if (count < 3) {
            return new Uint16Array(Math.min(count, 0));
        }
        const indices = new Uint16Array((count - 2) * 3);
        let index = 0;
        for (let i = 1; i < count - 1; i++) {
            indices[index++] = 0;
            indices[index++] = i;
            indices[index++] = i + 1;
        }
        return indices;
    }
    computeBoundingBox(points) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (p.x < minX)
                minX = p.x;
            if (p.y < minY)
                minY = p.y;
            if (p.x > maxX)
                maxX = p.x;
            if (p.y > maxY)
                maxY = p.y;
        }
        return { minX, minY, maxX, maxY };
    }
    isOutOfBounds(bufferId) {
        const info = this.buffers.get(bufferId);
        if (!info) {
            return true;
        }
        const { minX, minY, maxX, maxY } = info.boundingBox;
        return minX > 1 || minY > 1 || maxX < 0 || maxY < 0;
    }
    getVisibleBuffers() {
        const visible = [];
        this.buffers.forEach((info, bufferId) => {
            if (!this.isOutOfBounds(bufferId)) {
                visible.push(bufferId);
            }
        });
        return visible;
    }
    updateMemoryUsage(bytes) {
        this.currentSize += bytes;
    }
}
//# sourceMappingURL=BufferManager.js.map