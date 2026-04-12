import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'MapLib',
      fileName: (format) => `maplib.${format === 'es' ? 'js' : 'cjs'}`
    },
    rollupOptions: {
      external: ['gl-matrix', 'earcut', 'pbf'],
      output: {
        globals: {
          'gl-matrix': 'glMatrix',
          'earcut': 'earcut',
          'pbf': 'Pbf'
        }
      }
    }
  }
})