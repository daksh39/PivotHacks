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

/** Where the card goes: near the buy button, not in a popup nobody clicks. */
const ANCHORS = [
  '#buybox',
  '#desktop_buybox',
  '#rightCol',
  '#addToCart_feature_div',
  '#apex_desktop',
]

function findAnchor(): Element {
  for (const sel of ANCHORS) {
    const el = document.querySelector(sel)
    if (el) return el
  }
  return document.body
}

export function mountCard(): Root {
  document.getElementById(HOST_ID)?.remove()

  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.cssText = 'all: initial; display: block; margin: 16px 0;'

  const anchor = findAnchor()
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
