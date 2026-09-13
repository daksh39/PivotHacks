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

  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Verte',
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

  /*
   * Storage only, and NO host permissions.
   *
   * There is no service worker and no external service. Everything the
   * extension does happens in the content script, on the page it is already
   * running on: the listings are same-origin reads, the category table is
   * bundled, and ranking is a pure function. Nothing to configure, nothing to
   * start, nothing to be running on the demo machine.
   */
  permissions: ['storage'],
})
