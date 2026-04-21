import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  plugins: [svelte()],
  resolve: {
    alias: {
      '@vertex/shared': join(__dirname, '../shared/src/lib')
    }
  },
  build: {
    assetsInlineLimit: 0
  }
})