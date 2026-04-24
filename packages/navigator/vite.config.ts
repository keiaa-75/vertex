import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))
const base = pkg.vertex?.githubPagesPath || '/navigator/'

export default defineConfig({
  base,
  plugins: [svelte()],
  envDir: '../../',
  resolve: {
    alias: {
      '@vertex/shared': join(__dirname, '../shared/src/lib')
    }
  },
  build: {
    assetsInlineLimit: 0,
    cssCodeSplit: true
  }
} as UserConfig)