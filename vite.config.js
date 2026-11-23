import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function offlineShell() {
  return {
    name: 'secondyouth-offline-shell',
    apply: 'build',
    writeBundle: {
      order: 'post',
      async handler({ dir }, bundle) {
        const output = resolve(dir)
        const workerPath = resolve(output, 'sw.js')
        const [template, html, icon, manifest] = await Promise.all(
          ['sw.js', 'index.html', 'icon.svg', 'manifest.webmanifest'].map((file) => readFile(resolve(output, file), 'utf8')),
        )
        const assets = Object.keys(bundle).filter((file) => file.startsWith('assets/')).sort().map((file) => '/' + file)
        const buildId = createHash('sha256').update(JSON.stringify([template, html, icon, manifest, assets])).digest('hex').slice(0, 20)
        await writeFile(workerPath, template
          .replace('__BUILD_ID__', buildId)
          .replace('/* __BUILD_ASSETS__ */', assets.map((asset) => JSON.stringify(asset)).join(', ')))
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), offlineShell()],
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
})
