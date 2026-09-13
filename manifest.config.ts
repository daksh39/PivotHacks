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
   * paths are build-output paths, not source paths. Without them Chrome shows
   * the grey puzzle piece for the whole demo. */
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

  content_scripts: [
    {
      /* "*.amazon.com" also matches bare "amazon.com", which "www.amazon.com"
       * does not — and a link that skips the www was a page where nothing
       * happened at all, with no console line to explain it. */
      matches: [
        'https://*.amazon.com/*',
        'https://*.amazon.ca/*',
        'https://*.amazon.co.uk/*',
        'https://*.bestbuy.com/*',
        'https://*.bestbuy.ca/*',
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
