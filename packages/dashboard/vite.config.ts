import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: '/vertex/',   // GitHub Pages subpath
  resolve: {
    alias: {
      '@vertex/shared': path.resolve(__dirname, '../shared/src/lib')
    }
  },
  build: {
    outDir: '../../dist/dashboard',
    emptyOutDir: true
  }
})
