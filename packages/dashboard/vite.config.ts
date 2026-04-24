import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  plugins: [svelte()],
  envDir: '../../',
  resolve: {
    alias: {
      '@vertex/shared': join(__dirname, '../shared/src/lib')
    }
  },
  build: {
    assetsInlineLimit: 0
  },
  server: {
    proxy: {
      '/modules/parabola/anatomy': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
      },
      '/modules/parabola/sort': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        ws: true,
      },
    }
  }
})