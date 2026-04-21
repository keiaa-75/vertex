import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve directory in ESM
const __dirname = dirname(fileURLToPath(import.meta.url))

// Read deployment path from package.json
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))
const base = pkg.vertex?.githubPagesPath || '/modules/unknown'

if (base === '/modules/unknown') {
  console.warn('vertex.githubPagesPath not set in package.json. Using fallback.')
}

export default defineConfig({
  base,
  plugins: [svelte()],
  resolve: {
    alias: {
      // Ensures workspace linking resolves correctly during build
      '@vertex/shared': join(__dirname, '../shared/src/lib')
    }
  },
  build: {
    // Prevents aggressive CSS/asset inlining that breaks iframe styling
    assetsInlineLimit: 0,
    cssCodeSplit: true
  }
})