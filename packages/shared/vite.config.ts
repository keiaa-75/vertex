import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // No 'base' needed for lib pkg
  resolve: {
    alias: {
      '@vertex/shared': path.resolve(__dirname, './src/lib')
    }
  },
  build: {
    lib: {
      entry: 'src/lib/index.ts',
      name: 'vertex-shared',
      formats: ['es']
    },
    outDir: 'dist'
  }
})
