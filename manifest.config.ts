/* ---------------------------------------------------------------------------
 * Manifest V3.  verte-plan.md §08: MV2 is dead — Chrome has disabled it, so
 * MV2 boilerplate will not load in a current browser. This is a fresh MV3
 * scaffold.
 *
 * Adding a retailer is a match pattern here plus an adapter in
 * src/contentScript/extract.ts. Both hosts below were verified live: neither
 * publishes JSON-LD or og: tags, so both need an adapter.
 * ------------------------------------------------------------------------- */

import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Verte',
  version: '0.1.0',
  description: 'The greenest product is the one that already exists.',

  /* Files live in public/, which Vite copies to the root of dist/ — so these
   * paths are what they look like at build output, not source paths. Without
   * them Chrome renders the default grey puzzle piece in the toolbar. */
  icons: {
    16: 'icons/16.png',
    32: 'icons/32.png',
    48: 'icons/48.png',
    128: 'icons/128.png',
  },

  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Verte',
    default_icon: {
      16: 'icons/16.png',
      32: 'icons/32.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: [
        'https://www.amazon.com/*',
        'https://www.amazon.ca/*',
        'https://www.amazon.co.uk/*',
        'https://www.bestbuy.com/*',
        'https://www.bestbuy.ca/*',
      ],
      js: ['src/contentScript/index.tsx'],
      run_at: 'document_idle',
    },
  ],

  /* activeTab lets the popup ask the tab in front of the user what Verte is
   * doing there. It is granted only on click, and only for that tab — no
   * standing access to browsing history. */
  permissions: ['storage', 'activeTab'],

  /* The service worker is the only thing that talks to the proxy. Add the
   * deployed origin here when lane/proxy ships it. */
  host_permissions: ['http://localhost:8787/*'],
})
