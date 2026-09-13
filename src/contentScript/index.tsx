/* ---------------------------------------------------------------------------
 * Content script entry.  Lane A (verte-plan.md §04). Owned by lane/extension.
 *
 * Detect → extract → ask the service worker → render. The content script
 * never talks to the proxy directly and never holds a credential (§08).
 * ------------------------------------------------------------------------- */

import { StrictMode } from 'react'
import { buildResult } from '../assemble'
import { classify } from '../categories'
import { guidanceFor } from '../guidance'
import type { ProductContext } from '../types'
import { loadContext } from '../context'
import { Card } from '../components/Card'
import { extractProduct, looksLikeProductPage, readBreadcrumbs } from './extract'
import { trace } from './trace'
import { findUsedListings } from './listings'
import { findGreener } from './greener'
import { mountCard, unmountCard } from './mount'
import { waitFor } from './wait'

/**
 * Dismissal lasts for this page view, not forever.
 *
 * It used to be written to chrome.storage.local keyed by URL, which meant one
 * accidental click on the × hid the card on that product permanently — no
 * reload, revisit, or reinstall brought it back, and nothing told the user
 * why. In-memory is the behaviour people expect from a close button: gone
 * now, back on reload.
 */
const dismissed = new Set<string>()

async function run(): Promise<void> {
  trace('injected', { url: location.pathname })

  if (!looksLikeProductPage()) {
    trace('not-a-product-page')
    return
  }
  trace('waiting-for-product')

  /* Wait for the product to actually render. Calling extractProduct() once at
   * document_idle and returning on null is what made the card appear only
   * after repeated refreshes: these pages fill in their title well after the
   * content script runs, and nothing ever looked a second time. */
  const product = await waitFor(() => extractProduct())
  if (!product) {
    trace('no-product-found')
    return
  }
  if (dismissed.has(product.sourceUrl)) {
    trace('dismissed', { title: product.title })
    return
  }
  trace('reading-listings', { title: product.title })

  const result = await buildCard(product)
  if (!result) {
    trace('nothing-to-show')
    return
  }

  trace('mounted', {
    category: result.guidance?.category ?? null,
    listings: result.options.length,
    reason: result.reason,
  })

  const root = mountCard()

  root.render(
    <StrictMode>
      <Card
        result={result}
        onDismiss={() => {
          dismissed.add(product.sourceUrl)
          unmountCard()
        }}
      />
    </StrictMode>,
  )
}

async function buildCard(product: ProductContext) {
  /* Everything below is local. The category table is static, ranking is a pure
   * function, and the listings were read out of this very page. Routing any of
   * it through a localhost service meant the extension showed nothing whenever
   * that service was not running — which is most of the time, on most
   * machines, including every machine we would demo on. */
  const context = await loadContext()

  /* Listings must never take the card down with them. A retailer changing its
   * markup, or a slow response, is not a reason to show the user nothing. */
  const options = await findUsedListings(product.title, product.sourceUrl).catch((error) => {
    trace('failed', { error: String(error).slice(0, 120) })
    return []
  })
  /* The retailer's own breadcrumb first, the title only as a fallback. */
  const category = product.category || classify(product.title, readBreadcrumbs())
  const guidance = guidanceFor(category)

  /* Rung 2, and only then. Skipping the request when a used option exists
   * also avoids opening product pages whose result we would discard. */
  const greener = options.length
    ? []
    : await findGreener(product.title, product.sourceUrl).catch(() => [])

  return buildResult(product, guidance, options, context, greener)
}

void run()

/* Retailers render product pages client-side, so the DOM we need may not
 * exist at document_idle. Re-check on SPA navigation. */
let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    unmountCard()
    void run()
  }
}).observe(document, { subtree: true, childList: true })
