/* ---------------------------------------------------------------------------
 * Content script entry.  Lane A (verte-plan.md §04). Owned by lane/extension.
 *
 * Detect → extract → ask the service worker → render. The content script
 * never talks to the proxy directly and never holds a credential (§08).
 * ------------------------------------------------------------------------- */

import { StrictMode } from 'react'
import type { LookupRequest, LookupResponse, VerteResult } from '../types'
import type { StatusRequest, VerteStatus } from '../status'
import { statusForLookupError } from '../status'
import { loadContext } from '../context'
import { Card } from '../components/Card'
import { Skeleton } from '../components/Skeleton'
import { extractProduct, looksLikeProductPage } from './extract'
import { findUsedListings } from './listings'
import { mountCard, unmountCard } from './mount'

/**
 * What this tab is currently showing, for the popup to report.
 *
 * The card lives on the page, so clicking the toolbar icon legitimately does
 * not summon it. But when no card appeared at all, the icon was the only thing
 * the buyer could click and it told them nothing. This is what it tells them
 * now.
 */
let status: VerteStatus = { state: 'looking' }

chrome.runtime.onMessage.addListener((message: StatusRequest, _sender, sendResponse) => {
  if (message?.type === 'VERTE_STATUS') {
    sendResponse(status)
    return false
  }
  if (message?.type === 'VERTE_RESHOW') {
    void (async () => {
      const url = location.href
      await chrome.storage.local.remove(dismissKey(url))
      await run()
      sendResponse(status)
    })()
    return true
  }
  return false
})

/** Dismissed stays dismissed for that product (§06). */
const dismissKey = (url: string) => `verte:dismissed:${url}`

async function isDismissed(url: string): Promise<boolean> {
  const key = dismissKey(url)
  const stored = await chrome.storage.local.get(key)
  return Boolean(stored[key])
}

/**
 * Which page load this is. Mounting now waits for the buy box to exist and the
 * lookup is a network round trip, so a fast SPA navigation can leave an older
 * run still in flight. It must not draw its answer over the newer page's card.
 */
let generation = 0

async function run(): Promise<void> {
  const mine = ++generation
  const current = () => mine === generation

  if (!looksLikeProductPage()) {
    status = { state: 'not-a-product' }
    return
  }

  const product = extractProduct()
  if (!product) {
    status = { state: 'not-a-product' }
    return
  }

  if (await isDismissed(product.sourceUrl)) {
    status = { state: 'dismissed' }
    return
  }
  if (!current()) return
  status = { state: 'looking' }

  /* Mount and lookup are started together, not in sequence. Mounting now waits
   * for the retailer to render its buy box, and there is no reason to hold the
   * network request behind that — doing so would add the two together and the
   * skeleton would sit there for the sum of both. */
  const mounting = mountCard()
  const looking = lookup(product)

  const root = await mounting
  if (!current()) return
  root.render(
    <StrictMode>
      <Skeleton />
    </StrictMode>,
  )

  const result = await looking
  if (!current()) return
  if (!result) {
    /* `lookup` has already recorded WHY in `status`. Take the card down rather
     * than leaving a skeleton spinning forever on someone else's page. */
    unmountCard()
    return
  }

  status =
    result.guidance.verdict === 'avoid'
      ? { state: 'buy-new', title: result.product.title }
      : result.options.length === 0
        ? { state: 'no-listings', title: result.product.title }
        : {
            state: 'showing',
            count: result.options.length,
            savings: result.savingsUsd,
            currency: result.product.currency,
          }

  root.render(
    <StrictMode>
      <Card
        result={result}
        onDismiss={() => {
          void chrome.storage.local.set({ [dismissKey(product.sourceUrl)]: true })
          unmountCard()
        }}
      />
    </StrictMode>,
  )
}

async function lookup(product: LookupRequest['product']): Promise<VerteResult | null> {
  /* Pivot 03: the buyer's situation travels with the request, because it
   * decides which option comes back first. */
  const context = await loadContext()

  /* Read the retailer's own secondhand listings here, in the page. Both
   * sources are same-origin — Amazon's used buybox is in this DOM, and Best
   * Buy's search API only answers requests from its own origin. The service
   * worker could not fetch either. */
  const options = await findUsedListings(product.title, product.sourceUrl)

  try {
    const response: LookupResponse = await chrome.runtime.sendMessage({
      type: 'VERTE_LOOKUP',
      product,
      context,
      options,
    } satisfies LookupRequest)

    if (response?.ok) return response.result
    status = statusForLookupError(response?.error ?? '', product.title)
    console.warn('[verte] lookup failed:', response?.error)
  } catch (error) {
    status = { state: 'proxy-unreachable' }
    console.warn('[verte] service worker unreachable:', error)
  }

  return null
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
