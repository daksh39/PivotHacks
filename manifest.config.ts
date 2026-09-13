/* ---------------------------------------------------------------------------
 * Manifest V3.  verte-plan.md §08: MV2 is dead — Chrome has disabled it, and
 * the 2022 GreenBeans build cannot load in a current browser. This is a fresh
 * MV3 scaffold, not a port.
 *
 * Amazon only until it works (§04, §11). Adding a retailer = one match
 * pattern here plus selectors in src/contentScript/extract.ts.
 * ------------------------------------------------------------------------- */

import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Verte',
  version: '0.1.0',
  description: 'The greenest product is the one that already exists.',

  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Verte',
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['https://www.amazon.com/*', 'https://www.amazon.co.uk/*'],
      js: ['src/contentScript/index.tsx'],
      run_at: 'document_idle',
    },
  ],

  permissions: ['storage'],

  /* The service worker is the only thing that talks to the proxy. Add the
   * deployed origin here when lane/proxy ships it. */
  host_permissions: ['http://localhost:8787/*'],
})
