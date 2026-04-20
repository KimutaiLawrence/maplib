# MapLib - Agent Guide

## Project Overview

MapLib is a high-performance WebGL-based mapping library written in TypeScript, built from scratch for modern geospatial applications.

**Status**: Active development (v0.1.0)
**Author**: Kimutai Lawrence (@KimutaiLawrence)
**License**: MIT

---

## Architecture

### Core Components

```
maplib/src/
├── core/          # Core map functionality
│   ├── Map.ts           # Main Map class - orchestrates layers, camera, renderer
│   ├── Camera.ts        # Viewport management (pan, zoom, rotate, tilt)
│   ├── Renderer.ts      # WebGL context wrapper
│   ├── LayerCollection.ts # Layer management
│   └── BufferManager.ts # WebGL buffer handling
│
├── layers/        # Layer implementations
│   ├── Layer.ts           # Abstract base class
│   ├── RasterLayer.ts     # Tile imagery layers
│   └── VectorLayer.ts     # Vector tile layers (incomplete)
│
├── tiles/         # Tile handling
│   ├── Tile.ts            # Base tile class
│   ├── TileCache.ts       # Tile caching system
│   ├── VectorTile.ts      # Vector tile container
│   └── MVT.ts             # Mapbox Vector Tile parser
│
├── renderers/     # Rendering engines
│   └── VectorRenderer.ts  # Vector graphics renderer (incomplete)
│
├── utils/         # Utility functions
│   ├── GeoUtils.ts        # Geographic calculations
│   └── Matrices.ts        # Matrix math helpers
│
├── projections/   # Map projections
│   └── Mercator.ts        # Web Mercator projection
│
└── types.ts       # TypeScript type definitions
```

---

## Current Progress

### ✅ Completed

1. **Core Engine**
   - Map initialization with container management
   - Camera system (pan, zoom, coordinate transformations)
   - WebGL renderer setup
   - Layer collection system
   - Basic mouse interactions (drag pan, wheel zoom)

2. **Raster Tiles**
   - RasterLayer class with tile loading
   - Quad-key tile coordinate system
   - Quad-tree LOD structure
   - Tile caching with LRU eviction
   - GLSL shader-based texture rendering with blending

3. **Utilities**
   - Mercator projection helper
   - Matrix utilities
   - GeoUtils for coordinate conversions

4. **Build System**
   - TypeScript configuration
   - Vite bundler
   - Development server

---

## 🚧 In Progress / Needs Work

### 1. Vector Tiles (CRITICAL)

**Files**: `VectorLayer.ts`, `VectorRenderer.ts`, `MVT.ts`, `VectorTile.ts`

**Current State**:
- MVT parser implemented (decodes PBF, keys, values, geometries)
- VectorLayer skeleton exists but incomplete
- VectorRenderer has shader setup but missing:
  - Geometry batching logic
  - WebGL buffer drawing calls
  - Line/point rendering paths

**Missing Implementation**:
- `render()` method in VectorLayer to process visible tiles and pass to renderer
- `addTriangleBatch()`, `addLineBatch()`, `addPointBatch()` completion in VectorRenderer
- `draw()` method calls to actually render the geometry batches
- Geometry clipping to tile/viewport bounds
- Style application (fillColor, strokeColor, etc.)

**Key Functions to Complete**:
```typescript
// In VectorLayer.ts:
- render() needs to iterate visible tiles
- loadTiles() needs proper async handling  
- renderGeometry() needs actual rendering calls

// In VectorRenderer.ts:
- addTriangleBatch() - create buffers, bind shader, draw
- addLineBatch() - same for lines
- addPointBatch() - same for points
- initPrograms() - compile shaders (partially done)
```

### 2. TypeScript Errors (77 errors)

Must fix before pushing:
- Missing module declarations (`pbf` type definitions)
- Unused variables warnings
- Type mismatches (Point[] vs Point[][] in geometry types)
- Null type handling in tile loading
- Invalid WebGL2 property names (BLEND_SRC, etc.)

**Quick Fixes Needed**:
1. Install `@types/pbf`: `npm install --save-dev @types/pbf`
2. Fix geometry types in MVT.ts return types
3. Add null checks in tile loading code
4. Remove unused variables (or use them)
5. Use correct WebGL2 constants

### 3. Style System

- Paint properties defined but not applied during rendering
- Need to extract paint values in render loop and pass to shaders

### 4. Performance Optimizations

- Geometry batching not implemented
- Buffer pooling not utilized
- No culling of off-screen geometries

---

## Key Concepts

### Tile System

- **Quad-key system**: Tiles identified by `{ x, y, z }` coordinates
- **LOD (Level of Detail)**: Pyramid structure from z=0 to z=22
- **Tile size**: 512x512 pixels (MVT standard)
- **Caching**: LRU cache with configurable max size

### Camera

- **Projection**: Web Mercator (EPSG:3857)
- **Viewport**: Orthographic projection with camera frustum
- **Transformations**: Supports pan, zoom, rotate, tilt

### Vector Tiles (MVT)

- **Format**: Protocol Buffers (PBF) binary format
- **Layers**: Multiple feature layers per tile
- **Geometries**: LineString, Polygon, MultiPolygon (encoded as deltas with ZigZag)
- **Properties**: Key-value pairs with type tags

---

## Immediate Next Steps

1. **Fix TypeScript compilation errors**
   - Install missing type definitions
   - Fix null/undefined handling
   - Remove unused variables

2. **Complete VectorRenderer**
   - Finish `addTriangleBatch()` implementation
   - Add WebGL `drawArrays()` calls
   - Handle geometry buffers correctly

3. **Implement VectorLayer.render()**
   - Process each visible tile
   - Extract geometries from VectorTile
   - Create VectorGeometry objects
   - Pass to VectorRenderer

4. **Test with real MVT tiles**
   - Load sample MBTiles or PBF tiles
   - Verify coordinate transformations
   - Check style application

5. **Add GeoJSON support**
   - Parse GeoJSON features
   - Convert to VectorGeometry
   - Render on top of tiles

---

## Testing Strategy

### Unit Tests (vitest)
- Coordinate transformations
- Tile coordinate calculations
- MVT parsing logic
- Geometry decoding

### Integration Tests
- Full tile loading pipeline
- Layer rendering
- Camera interactions

### Manual Testing
- Load example MBTiles
- Verify pan/zoom performance
- Check renderer output

---

## File-by-File Action Items

### `/src/renderers/VectorRenderer.ts`
- ✅ Shaders defined (triangle, line, point, polygon)
- ❌ Missing: Buffer creation in batch methods
- ❌ Missing: `gl.drawArrays()` calls
- ❌ Missing: Attribute binding code

### `/src/layers/VectorLayer.ts`
- ✅ Constructor and options parsed
- ✅ Paint properties defined
- ❌ Missing: `render()` method implementation  
- ❌ Missing: Geometry extraction from tiles
- ❌ Missing: Visible tile iteration

### `/src/tiles/MVT.ts`
- ✅ PBF parsing logic mostly complete
- ⚠️ Has type errors (Point[][] return types)
- ⚠️ Missing error handling for corrupt tiles

### `/src/types.ts`
- ✅ Core types defined
- ⚠️ Add VectorGeometry type export

---

## Notes for Agents

1. **Do not delete existing code** - The architecture is intentional
2. **Maintain TypeScript strict mode** - No `any` types where possible
3. **Keep WebGL2 compatibility** - Use proper WebGL2 constants
4. **Follow existing patterns** - Look at RasterLayer for layer implementation patterns
5. **Performance first** - Batch geometry, minimize draw calls

### Common Pitfalls
- Forgetting to enable `gl.depthTest` or `gl.blend`
- Not accounting for WebGL coordinate system (y-down)
- Missing `gl.bindBuffer()` calls before drawing
- Not normalizing texture coordinates

### Resources
- [Mapbox Vector Tile Spec](https://docs.mapbox.com/formats/vector-tiles/)
- [WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [gl-matrix](https://glmatrix.net/) for matrix math

---

## Goal

Create a performant, extensible mapping library that:
1. Renders vector tiles smoothly at 60fps
2. Supports custom styling via paint properties
3. Has a clean API similar to Mapbox GL JS
4. Can be extended with custom renderers/layers
5. Works in modern browsers without heavy dependencies

**Target**: Have vector tiles rendering by end of this sprint.

---

*Last updated: After initial architecture review and refactoring*