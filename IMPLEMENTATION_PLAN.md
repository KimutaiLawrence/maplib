# MapLib Implementation Plan

## Overview
Fast-track implementation of a high-performance mapping library using JavaScript/Node.js with WebGL rendering.

## Technology Stack

### Core
- **TypeScript 5.0+** - Type safety with fast compilation
- **WebGL 2.0** - Direct GPU rendering for maximum performance
- **Node.js 20+** - Build tooling and development server

### Build Tooling
- **Vite** - Lightning-fast dev server and bundler
- **ESBuild** - Ultra-fast bundling/compilation
- **Rollup** - Production builds with tree-shaking

### Testing
- **Jest** - Unit testing with TypeScript support
- **Playwright** - E2E and visual regression
- **Vitest** - Fast TypeScript-native testing (optional)

### Key Libraries (Minimal Dependencies)
- `gl-matrix` - Fast matrix/vector math
- `earcut` - Polygon triangulation
- `pbf` - Protobuf encoding/decoding for vector tiles
- `topojson` - Topology-based GeoJSON

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Core rendering engine working

1.1. **Project Setup**
- Initialize npm project with ESBuild/Vite
- Configure module structure
- Set up hot-reload dev server
- Add basic CSS reset

1.2. **WebGL Context Manager**
- `src/core/Renderer.ts` - WebGL context creation
- `src/core/Framebuffer.ts` - Offscreen rendering
- `src/utils/Matrices.ts` - Matrix utilities (projection, view, model)
- Handle resize events
- Error handling for WebGL initialization

1.3. **Basic Tile System**
- `src/tiles/Tile.js` - Individual tile class
- `src/tiles/TileCache.js` - LRU caching (max 64 tiles)
- `src/tiles/QuadKey.js` - Slippy map tiling algorithm (XYZ)
- Zoom level: 0-19 support
- Precompute tile boundaries

1.4. **Raster Tile Rendering**
- `src/renderers/RasterRenderer.js`
- Load tiles as textures
- Simple bilinear filtering
- Fade-in animations

### Phase 2: Vector Tiles (Week 3-4)
**Goal**: Native vector tile support

2.1. **Vector Tile Parsing**
- `src/tiles/VectorTile.js` - Parse .pbf format
- `src/tiles/MVT.js` - Mapbox Vector Tiles spec
- GeoJSON parsing and normalization
- Coordinate transformation (Web Mercator)

2.2. **GPU Buffer Management**
- `src/core/BufferManager.js`
- Vertex Buffer Objects (VBO)
- Index Buffer Objects (IBO)
- Geometry batching for draw call reduction

2.3. **Vector Rendering**
- `src/renderers/VectorRenderer.js`
- Line rendering with cap/join
- Polygon filling with winding
- Point markers
- Shader: `src/shaders/vector.vert` / `src/shaders/vector.frag`

### Phase 3: Layer System (Week 5-6)
**Goal**: Full layer management

3.1. **Layer Architecture**
- `src/layers/Layer.js` - Base layer class
- `src/layers/RasterLayer.js`
- `src/layers/VectorLayer.js`
- `src/layers/GeoJSONLayer.js`
- `src/core/LayerCollection.js` - Layer ordering and visibility

3.2. **Style System**
- `src/styles/Style.js` - Layer styling (color, width, opacity)
- `src/styles/Expression.js` - Data-driven styling
- `src/styles/StyleParser.js` - JSON-style parsing (Mapbox GL Style subset)

3.3. **Clipping and Culling**
- Frustum culling
- Viewport clipping
- Occlusion culling

### Phase 4: Interactions (Week 7-8)
**Goal**: Full user interaction

4.1. **Input System**
- `src/input/Pointer.js` - Mouse/touch handling
- `src/input/Keyboard.js` - Keyboard shortcuts
- `src/input/DeviceOrientation.js` - Gyroscope support

4.2. **Camera**
- `src/core/Camera.js` - Position, target, orientation
- Smooth transitions
- Animation API

4.3. **Controls**
- `src/controls/Navigation.js` - Pan/zoom/rotate
- `src/controls/Scale.js` - Scale bar
- `src/controls/Attribution.js` - Copyright info
- `src/controls/Fullscreen.js`
- `src/controls/Geolocate.js` - User position

### Phase 5: Coordinate System (Week 9-10)
**Goal**: Multiple projections and CRS

5.1. **Web Mercator (EPSG:3857)**
- `src/projections/Mercator.js`
- Lat/lng to tile coordinate conversion
- High-precision calculations

5.2. **WGS84 (EPSG:4326)**
- `src/projections/WGS84.js`
- Geographic coordinate system
- Ellipsoid calculations

5.3. **Custom Projections**
- Projection registration API
- Equirectangular support

### Phase 6: Performance Optimizations (Week 11-12)
**Goal**: 60fps on complex maps

6.1. **Render Optimization**
- LOD (Level of Detail) based on zoom
- Geometry simplification (Douglas-Peucker)
- Texture atlasing
- Instance rendering for markers

6.2. **Memory Management**
- Object pooling
- Garbage collection hints
- Texture compression (WebP, BasisU)

6.3. **Worker Threads**
- Off-main-thread tile decoding
- Worker pool management
- Transferable objects for zero-copy

## Architecture

```
maplib/
├── index.js              # Main entry point
├── src/
│   ├── core/
│   │   ├── Map.js        # Main Map class
│   │   ├── Renderer.js   # WebGL renderer
│   │   ├── Camera.js     # Camera/viewport
│   │   ├── LayerCollection.js
│   │   └── BufferManager.js
│   ├── tiles/
│   │   ├── Tile.js       # Base tile
│   │   ├── RasterTile.js
│   │   ├── VectorTile.js
│   │   ├── TileCache.js
│   │   └── MVT.js        # Vector tile parser
│   ├── layers/
│   │   ├── Layer.js
│   │   ├── RasterLayer.js
│   │   ├── VectorLayer.js
│   │   └── GeoJSONLayer.js
│   ├── renderers/
│   │   ├── RasterRenderer.js
│   │   └── VectorRenderer.js
│   ├── shaders/
│   │   ├── raster.vert
│   │   ├── raster.frag
│   │   ├── vector.vert
│   │   └── vector.frag
│   ├── styles/
│   │   ├── Style.js
│   │   ├── Expression.js
│   │   └── StyleParser.js
│   ├── projections/
│   │   ├── Mercator.js
│   │   ├── WGS84.js
│   │   └── Projection.js
│   ├── input/
│   │   ├── Pointer.js
│   │   ├── Keyboard.js
│   │   └── DeviceOrientation.js
│   ├── controls/
│   │   ├── Navigation.js
│   │   ├── Scale.js
│   │   ├── Attribution.js
│   │   └── Geolocate.js
│   ├── utils/
│   │   ├── Matrices.js
│   │   ├── MathUtils.js
│   │   └── GeoUtils.js
│   └── workers/
│       ├── tileDecoder.js
│       └── workerPool.js
├── examples/
│   ├── basic.html
│   ├── vector-tiles.html
│   └── geojson.html
├── test/
│   ├── unit/
│   └── e2e/
├── package.json
├── vite.config.js
└── README.md
```

## Quick Start Implementation (Day 1-3)

### Day 1: Project Setup + Basic Map
1. Initialize project with Vite
2. Create basic HTML page
3. Set up WebGL context
4. Render a colored rectangle (proof of concept)

### Day 2: Tile Loading
1. Implement XY zoom tiling
2. Fetch and display raster tiles
3. Add tile caching

### Day 3: Interactions
1. Implement pan/zoom
2. Add basic camera
3. Touch support

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial load | < 500ms |
| Tile render | < 16ms (60fps) |
| Memory usage | < 200MB (typical map) |
| Max tiles | 256 on-screen |
| Zoom smooth | 16ms/step |

## API Design

```javascript
import Map from 'maplib';

const map = new Map({
  container: 'map',
  center: [-74.006, 40.7128], // lng, lat
  zoom: 12,
  style: {
    tileSize: 512,
    maxZoom: 19,
    minZoom: 0
  }
});

// Add raster layer
map.addLayer({
  type: 'raster',
  source: {
    tiles: [
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    scheme: 'xyz'
  },
  paint: { opacity: 1.0 }
});

// Add vector layer
map.addLayer({
  type: 'vector',
  source: {
    tiles: [
      'https://vector.example.com/{z}/{x}/{y}.pbf'
    ]
  },
  paint: {
    fill: { color: '#3366cc' },
    line: { width: 2, color: '#ffffff' }
  }
});

// Interactions
map.on('click', (e) => {
  const { lng, lat } = e.lngLat;
  console.log(`Clicked at ${lng}, ${lat}`);
});

map.fitBounds([[lng1, lat1], [lng2, lat2]]);
```

## Milestones

- ✅ **M1**: Project setup complete
- ⬜ **M2**: Raster tiles rendering
- ⬜ **M3**: Pan/zoom working
- ⬜ **M4**: Vector tiles support
- ⬜ **M5**: GeoJSON layer support
- ⬜ **M6**: Style system
- ⬜ **M7**: API documentation
- ⬜ **M8**: Performance benchmarks
- ⬜ **M9**: Beta release

## Next Steps

1. Initialize npm project
2. Set up build configuration
3. Implement Renderer core
4. Start with Phase 1, Step 1

Let's start building!
