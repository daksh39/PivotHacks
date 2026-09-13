/* The landing page is a separate Vite build with its own root, so it shares
 * src/tokens.ts with the extension but can never collide with the extension
 * bundle. Owned by lane/site.
 *
 *     npm run site          # dev
 *     npm run site:build    # → dist-site/
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  server: { port: 5174, strictPort: true },
  build: {
    outDir: fileURLToPath(new URL('../dist-site', import.meta.url)),
    emptyOutDir: true,
  },
})
