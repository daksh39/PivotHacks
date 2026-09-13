/* ---------------------------------------------------------------------------
 * Where the card gets injected.
 *
 * The first version listed only Amazon IDs (#buybox, #rightCol, #apex_desktop)
 * and fell back to document.body. On Best Buy none of those exist, so the card
 * mounted at the very bottom of a very long page: rendered, shadow root and
 * all, and completely invisible. "Mounted" is not the same as "visible".
 *
 * Best Buy's own containers are hashed CSS modules
 * (productActionContainer_CEQ55) that change on every deploy, so the stable
 * anchor is the Add to Cart button's text.
 * ------------------------------------------------------------------------- */

import { beforeEach, describe, expect, test } from 'vitest'
import { findMountPoint, pickBuyButton } from './mount'

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('amazon', () => {
  test('mounts inside the buybox when it exists', () => {
    document.body.innerHTML = `<div id="rightCol"></div><div id="buybox"></div>`
    const spot = findMountPoint()
    expect((spot.el as HTMLElement).id).toBe('buybox')
    expect(spot.mode).toBe('prepend')
  })

  test('falls through the anchor list in order', () => {
    document.body.innerHTML = `<div id="rightCol"></div>`
    expect((findMountPoint().el as HTMLElement).id).toBe('rightCol')
  })
})

describe('a site with no known anchors', () => {
  test('mounts beside the add-to-cart button', () => {
    document.body.innerHTML = `
      <div class="productActionContainer_CEQ55">
        <form><button>Add to Cart</button></form>
      </div>`
    const spot = findMountPoint()
    expect(spot.mode).toBe('after')
    expect(spot.el.className).toContain('productActionContainer')
  })

  test('matches the button however it is worded', () => {
    document.body.innerHTML = `<div class="wrap"><button>ADD TO BAG</button></div>`
    expect(findMountPoint().mode).toBe('after')
  })

  test('ignores unrelated buttons', () => {
    document.body.innerHTML = `<div class="wrap"><button>Sign in</button></div><h1>A Product</h1>`
    const spot = findMountPoint()
    expect(spot.el.tagName).toBe('H1')
  })
})

describe('pickBuyButton', () => {
  /* Best Buy renders EIGHT "Add to Cart" buttons on one product page: the real
   * one, a sticky header copy, copies inside collapsed tabs, and hidden 0x0
   * ones. Taking the first in DOM order picked the one at 1430px, below the
   * fold, when the primary button sits at 490px. */
  test('takes the topmost visible button, not the first in the DOM', () => {
    const els = ['a', 'b', 'c'].map((id) => {
      const el = document.createElement('button')
      el.id = id
      return el
    })
    const boxes: Record<string, { top: number; visible: boolean }> = {
      a: { top: 1430, visible: true },
      b: { top: 490, visible: true },
      c: { top: 120, visible: false },
    }
    const picked = pickBuyButton(els, (el) => boxes[(el as HTMLElement).id])
    expect((picked as HTMLElement).id).toBe('b')
  })

  test('ignores buttons scrolled above the page', () => {
    const els = ['sticky', 'real'].map((id) => {
      const el = document.createElement('button')
      el.id = id
      return el
    })
    const boxes: Record<string, { top: number; visible: boolean }> = {
      sticky: { top: -122, visible: true },
      real: { top: 490, visible: true },
    }
    expect((pickBuyButton(els, (el) => boxes[(el as HTMLElement).id]) as HTMLElement).id).toBe('real')
  })

  test('falls back to the first candidate when nothing is measurable', () => {
    /* jsdom and any pre-layout context report every box as zero. */
    const els = [document.createElement('button'), document.createElement('button')]
    els[0].id = 'first'
    expect((pickBuyButton(els, () => ({ top: 0, visible: false })) as HTMLElement).id).toBe('first')
  })
})

describe('last resorts', () => {
  test('mounts after the heading when there is no buy button', () => {
    document.body.innerHTML = `<h1>Some Product</h1>`
    const spot = findMountPoint()
    expect(spot.el.tagName).toBe('H1')
    expect(spot.mode).toBe('after')
  })

  test('floats rather than hiding at the bottom of the page', () => {
    /* The old behaviour appended to document.body, which on a long retail page
     * means nobody ever sees it. Floating is visible by construction. */
    document.body.innerHTML = `<div>nothing useful here</div>`
    expect(findMountPoint().mode).toBe('floating')
  })
})
