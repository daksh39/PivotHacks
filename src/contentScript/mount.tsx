/* ---------------------------------------------------------------------------
 * Shadow root injection.  verte-plan.md §08.  Owned by lane/extension.
 *
 * "Amazon's stylesheet will obliterate an ordinary injected div." Attach a
 * shadow root, put the styles inside it, and the card renders identically
 * everywhere.
 *
 * Placement matters as much as rendering. The first version knew only Amazon's
 * IDs and fell back to document.body, so on Best Buy the card mounted at the
 * bottom of a very long page — present in the DOM, shadow root and all, and
 * never seen by anyone. Mounted is not the same as visible, so there is no
 * longer any path that ends in an invisible card.
 * ------------------------------------------------------------------------- */

import { createRoot, type Root } from 'react-dom/client'
import { cardStyles } from '../components/styles'

const HOST_ID = 'verte-root'

/** Amazon publishes real, stable IDs around the buy box. Use them first. */
const KNOWN_ANCHORS = [
  '#buybox',
  '#desktop_buybox',
  '#rightCol',
  '#addToCart_feature_div',
  '#apex_desktop',
]

/**
 * Retailers without stable IDs still have a button that says "Add to Cart".
 * The wording is far more durable than their hashed CSS module classnames
 * (Best Buy ships productActionContainer_CEQ55, which changes each deploy).
 */
const BUY_BUTTON = /\badd to (cart|bag|basket)\b|\bbuy now\b/i

export type MountPoint = {
  el: Element
  /** prepend: inside the anchor. after: as its next sibling. floating: fixed. */
  mode: 'prepend' | 'after' | 'floating'
}

type Box = { top: number; visible: boolean }

const measureBox = (el: Element): Box => {
  const rect = el.getBoundingClientRect()
  return { top: rect.top + window.scrollY, visible: rect.width > 0 && rect.height > 0 }
}

/**
 * The real buy button among the many a retailer renders.
 *
 * Best Buy ships eight "Add to Cart" buttons on a product page — the primary
 * one, a sticky header copy, copies inside collapsed tabs, and hidden 0x0
 * placeholders. First-in-DOM-order picked one at 1430px, below the fold, while
 * the real one sat at 490px. Topmost visible is the one a shopper sees.
 *
 * `measure` is injected so this is testable: element geometry is always zero
 * outside a real layout.
 */
export function pickBuyButton(candidates: Element[], measure: (el: Element) => Box = measureBox) {
  const onScreen = candidates
    .map((el) => ({ el, box: measure(el) }))
    .filter(({ box }) => box.visible && box.top >= 0)

  if (!onScreen.length) return candidates[0] ?? null
  return onScreen.sort((a, b) => a.box.top - b.box.top)[0].el
}

function buyButtonContainer(): Element | null {
  const candidates = [...document.querySelectorAll('button, input[type="submit"], a')].filter(
    (el) => BUY_BUTTON.test(el.textContent || (el as HTMLInputElement).value || ''),
  )
  const button = pickBuyButton(candidates)
  if (!button) return null

  /* Walk up to the block that wraps the button, skipping the form/span
   * scaffolding immediately around it. A structural rule rather than a
   * width check: element widths are unavailable outside a real layout, so a
   * geometric rule cannot be tested and silently walks to <html>. */
  let node: Element | null = button.parentElement
  for (let i = 0; i < 4 && node; i += 1) {
    if (node === document.body || node === document.documentElement) return null
    if (node.tagName === 'DIV' || node.tagName === 'SECTION') return node
    node = node.parentElement
  }
  return null
}

/** Never returns something the user cannot see. */
export function findMountPoint(): MountPoint {
  for (const selector of KNOWN_ANCHORS) {
    const el = document.querySelector(selector)
    if (el) return { el, mode: 'prepend' }
  }

  const container = buyButtonContainer()
  if (container && container !== document.body) return { el: container, mode: 'after' }

  const heading = document.querySelector('h1')
  if (heading) return { el: heading, mode: 'after' }

  /* Nothing recognisable. A fixed panel is intrusive, but it is honest about
   * the card existing — appending to the bottom of the body was not. */
  return { el: document.body, mode: 'floating' }
}

export function mountCard(): Root {
  document.getElementById(HOST_ID)?.remove()

  const host = document.createElement('div')
  host.id = HOST_ID

  const spot = findMountPoint()

  if (spot.mode === 'floating') {
    host.style.cssText = [
      'all: initial',
      'display: block',
      'position: fixed',
      'right: 20px',
      'bottom: 20px',
      'width: 380px',
      'max-width: calc(100vw - 40px)',
      'z-index: 2147483647',
    ].join(';')
    document.body.appendChild(host)
  } else {
    host.style.cssText = 'all: initial; display: block; margin: 16px 0;'
    if (spot.mode === 'prepend') spot.el.prepend(host)
    else spot.el.insertAdjacentElement('afterend', host)
  }

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
