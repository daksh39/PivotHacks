/* ---------------------------------------------------------------------------
 * Content script entry.  Lane A (verte-plan.md §04). Owned by lane/extension.
 *
 * Detect → extract → ask the service worker → render. The content script
 * never talks to the proxy directly and never holds a credential (§08).
 * ------------------------------------------------------------------------- */

import { StrictMode } from 'react'
import type { LookupRequest, LookupResponse, VerteResult } from '../types'
import { mockFor } from '../mocks'
import { loadContext } from '../context'
import { Card } from '../components/Card'
import { Skeleton } from '../components/Skeleton'
import { extractProduct, looksLikeProductPage } from './extract'
import { mountCard, unmountCard } from './mount'

/** Dismissed stays dismissed for that product (§06). */
const dismissKey = (url: string) => `verte:dismissed:${url}`

async function isDismissed(url: string): Promise<boolean> {
  const key = dismissKey(url)
  const stored = await chrome.storage.local.get(key)
  return Boolean(stored[key])
}

async function run(): Promise<void> {
  if (!looksLikeProductPage()) return

  const product = extractProduct()
  if (!product) return

  if (await isDismissed(product.sourceUrl)) return

  const root = mountCard()
  root.render(
    <StrictMode>
      <Skeleton />
    </StrictMode>,
  )

  const result = await lookup(product)
  if (!result) {
    unmountCard()
    return
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

  try {
    const response: LookupResponse = await chrome.runtime.sendMessage({
      type: 'VERTE_LOOKUP',
      product,
      context,
    } satisfies LookupRequest)

    if (response?.ok) return response.result
    console.warn('[verte] lookup failed:', response?.error)
  } catch (error) {
    console.warn('[verte] service worker unreachable:', error)
  }

  /* The proxy is down or not built yet. Render mock data so lane/ui and
   * lane/extension are never blocked on lane/proxy. Flip VITE_ALLOW_MOCK off
   * for anything you would demo. */
  if (import.meta.env.VITE_ALLOW_MOCK !== 'false') {
    console.info('[verte] falling back to src/mocks.ts')
    return mockFor(product.category || 'mini-fridge')
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
