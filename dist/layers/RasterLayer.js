import { Layer } from './Layer';
import { GeoUtils } from '../utils/GeoUtils';
import { TileCache } from '../tiles/TileCache';
export class RasterLayer extends Layer {
    tiles;
    minZoom;
    maxZoom;
    tileSize;
    tileCache;
    constructor(options) {
        super({ id: options.id, visible: options.visible, opacity: options.opacity });
        this.tiles = options.tiles;
        this.minZoom = options.minZoom ?? 0;
        this.maxZoom = options.maxZoom ?? 19;
        this.tileSize = options.tileSize ?? GeoUtils.TILE_SIZE;
        this.tileCache = new TileCache(64);
    }
    getType() {
        return 'raster';
    }
    getMinZoom() {
        return this.minZoom;
    }
    getMaxZoom() {
        return this.maxZoom;
    }
    getTileSize() {
        return this.tileSize;
    }
    getVisibleTiles(camera) {
        const zoom = Math.floor(camera.getZoom());
        if (zoom < this.minZoom || zoom > this.maxZoom)
            return [];
        const center = camera.getCenter();
        const width = camera.getWidth();
        const height = camera.getHeight();
        const nw = camera.toLngLat(0, 0);
        const se = camera.toLngLat(width, height);
        const minCoord = GeoUtils.lngLatToTileCoords(nw.lng, nw.lat, zoom);
        const maxCoord = GeoUtils.lngLatToTileCoords(se.lng, se.lat, zoom);
        const tiles = [];
        for (let x = minCoord.x; x <= maxCoord.x; x++) {
            for (let y = minCoord.y; y <= maxCoord.y; y++) {
                tiles.push({ x, y, z: zoom });
            }
        }
        return tiles;
    }
    async update(renderer, camera) {
        if (!this.visible || this.opacity === 0)
            return;
        const visibleTiles = this.getVisibleTiles(camera);
        const currentZoom = Math.floor(camera.getZoom());
        for (const coord of visibleTiles) {
            const urlTemplate = this.tiles[Math.floor(Math.random() * this.tiles.length)];
            await this.tileCache.loadTile(coord, urlTemplate);
        }
        this.tileCache.evictTilesOutsideZoom(currentZoom, 1);
    }
    render(renderer, camera) {
        if (!this.visible || this.opacity === 0)
            return;
        const gl = renderer.getWebGL();
        const zoom = Math.floor(camera.getZoom());
        if (zoom < this.minZoom || zoom > this.maxZoom)
            return;
        gl.viewport(0, 0, renderer.getWidth(), renderer.getHeight());
        gl.activeTexture(gl.TEXTURE0);
        const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
        const oldBlendEquation = gl.getParameter(gl.BLEND_EQUATION);
        const oldBlendFuncSrc = gl.getParameter(gl.BLEND_SRC);
        const oldBlendFuncDst = gl.getParameter(gl.BLEND_DST);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        const visibleTiles = this.getVisibleTiles(camera);
        const center = camera.getCenter();
        const zoomFactor = Math.pow(2, zoom);
        const tileWidth = renderer.getWidth() / zoomFactor;
        const tileHeight = renderer.getHeight() / zoomFactor;
        const viewportWidth = renderer.getWidth();
        const viewportHeight = renderer.getHeight();
        const tileKey = `${zoom}-${center.lng}-${center.lat}`;
        const tile = this.tileCache.getTileTileCoord({ x: 0, y: 0, z: zoom });
        for (const coord of visibleTiles) {
            const tile = this.tileCache.getTile(coord);
            if (!tile || !tile.getImage())
                continue;
            const img = tile.getImage();
            const x = (coord.x * this.tileSize) / zoomFactor;
            const y = (coord.y * this.tileSize) / zoomFactor;
            const drawX = x;
            const drawY = y;
            const drawWidth = Math.min(tileWidth, viewportWidth - x);
            const drawHeight = Math.min(tileHeight, viewportHeight - y);
            if (drawWidth <= 0 || drawHeight <= 0)
                continue;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            const quadVertices = new Float32Array([
                drawX, drawY,
                drawX + drawWidth, drawY,
                drawX, drawY + drawHeight,
                drawX + drawWidth, drawY + drawHeight,
            ]);
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            const indices = new Uint16Array([
                0, 1,
                2, 0,
                2, 3,
                1, 3,
            ]);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            gl.uniform1f(gl.getUniformLocation(gl, 'u_opacity'), this.opacity);
            gl.uniform1i(gl.getUniformLocation(gl, 'u_image'), 0);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            gl.deleteBuffer(gl.getBufferBinding(gl.ARRAY_BUFFER));
            gl.deleteBuffer(gl.getBufferBinding(gl.ELEMENT_ARRAY_BUFFER));
        }
    }
    async destroy() {
        await this.tileCache.destroy();
    }
}
//# sourceMappingURL=RasterLayer.js.map