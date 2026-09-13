/* ---------------------------------------------------------------------------
 * Shadow root injection.  verte-plan.md §08.
 *
 * "Amazon's stylesheet will obliterate an ordinary injected div." Attach a
 * shadow root, put the styles inside it, and the card renders identically
 * everywhere. Skipping this means lane/ui spends the back half of the event
 * fighting specificity wars. Owned by lane/extension.
 * ------------------------------------------------------------------------- */

import { createRoot, type Root } from 'react-dom/client'
import { cardStyles } from '../components/styles'

const HOST_ID = 'verte-root'

/**
 * Where the card goes: near the buy button, not in a popup nobody clicks.
 *
 * Per site, because the two storefronts share no markup. Only Amazon used to
 * be listed here, so on Best Buy every anchor missed and the card fell through
 * to document.body — appended below the footer, past the reviews, off the
 * first three screens. A card nobody scrolls to is the same as no card.
 *
 * Best Buy ships hashed CSS-module classnames that change every deploy, so
 * these match on stable test ids and class prefixes rather than exact names,
 * the same way the price lookup in extract.ts does.
 */
const ANCHORS: Record<string, string[]> = {
  amazon: ['#buybox', '#desktop_buybox', '#rightCol', '#addToCart_feature_div', '#apex_desktop'],
  bestbuy: [
    '[data-testid="add-to-cart-button"]',
    '[class*="addToCartButton"]',
    '.x-productBuyingOptions',
    '.fulfillment-add-to-cart-button',
    '.shop-add-to-cart',
    '.priceView-hero-price',
    '[class*="priceBlock"]',
  ],
}

function anchorsFor(url: string = location.href): string[] {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return []
  }
  if (/(^|\.)amazon\./i.test(host)) return ANCHORS.amazon
  if (/(^|\.)bestbuy\./i.test(host)) return ANCHORS.bestbuy
  return []
}

function queryAnchor(): Element | null {
  for (const sel of anchorsFor()) {
    /* The buy button itself is a poor parent — prepending into a <button>
     * renders nothing. Hang the card off its container instead. */
    const el = document.querySelector(sel)
    if (el) return el.tagName === 'BUTTON' ? (el.parentElement ?? el) : el
  }
  return null
}

/**
 * Both storefronts render the buy box client-side, so at document_idle the
 * anchor frequently does not exist yet. Wait briefly for it before settling
 * for document.body — a card in the right place two seconds late beats one
 * stranded at the bottom of the page immediately.
 */
function waitForAnchor(timeoutMs = 4000): Promise<Element> {
  const immediate = queryAnchor()
  if (immediate) return Promise.resolve(immediate)

  return new Promise((resolve) => {
    const settle = (el: Element) => {
      clearTimeout(timer)
      observer.disconnect()
      resolve(el)
    }
    const observer = new MutationObserver(() => {
      const found = queryAnchor()
      if (found) settle(found)
    })
    const timer = setTimeout(() => settle(document.body), timeoutMs)
    observer.observe(document.documentElement, { subtree: true, childList: true })
  })
}

export async function mountCard(): Promise<Root> {
  document.getElementById(HOST_ID)?.remove()

  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.cssText = 'all: initial; display: block; margin: 16px 0;'

  const anchor = await waitForAnchor()
  if (anchor === document.body) anchor.appendChild(host)
  else anchor.prepend(host)

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = cardStyles
  shadow.appendChild(style)

  const container = document.createElement('div')
  shadow.appendChild(container)

  return createRoot(container)
}

export function unmountCard(): void {
  document.getElementById(HOST_ID)?.remove()
}
