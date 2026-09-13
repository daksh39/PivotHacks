import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        /* The standalone card preview ships in the dev build only — it costs
         * nothing and keeps lane/ui unblocked. */
        preview: 'src/dev/preview.html',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
