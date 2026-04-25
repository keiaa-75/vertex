import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/vertex/',
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
      '/vertex/navigator': {
        target: 'http://localhost:5176',
        changeOrigin: true,
        ws: true,
      },
      '/vertex/modules/parabola/anatomy': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
      },
      '/vertex/modules/parabola/sort': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        ws: true,
      },
      '/vertex/modules/parabola/cards': {
        target: 'http://localhost:5177',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})