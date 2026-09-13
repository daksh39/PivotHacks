/* ---------------------------------------------------------------------------
 * Dev server for the card preview ONLY.
 *
 * Deliberately does NOT load the CRXJS plugin. That plugin rewrites dist/ into
 * a hot-reload build whose service worker imports from http://localhost:5173,
 * which cannot be loaded as a real extension. Running the preview used to
 * silently destroy the production build sitting in dist/ — twice.
 *
 * Now `npm run preview:card` cannot touch dist/ at all.
 * ------------------------------------------------------------------------- */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, open: '/src/dev/preview.html' },
  build: { outDir: 'dist-preview' },
})
