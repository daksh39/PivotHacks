/* ---------------------------------------------------------------------------
 * Greener NEW alternatives, rung 2 of the ladder.
 *
 * Source is Amazon's own Climate Pledge Friendly programme, verified live on
 * 2026-09-13: three products drawn from the CPF-filtered search all carried
 * #climatePledgeFriendly, and three from the plain search carried none.
 *
 * Two traps this file exists to prevent:
 *
 *   A looser selector such as [id*="climatePledge" i] matches a hidden
 *   container present on EVERY product page and reports 100% certified.
 *
 *   A green claim with no named certifier is indistinguishable from
 *   greenwashing, so a product whose certification we cannot read is dropped
 *   rather than shown.
 * ------------------------------------------------------------------------- */

import { describe, expect, test } from 'vitest'
import { findGreener, readCertification } from './greener'

/* Copied from a live certified product page. */
const CERTIFIED = `
  <div id="climatePledgeFriendly">
    Sustainability features This product has sustainability features recognized by
    trusted certifications. Recycled materials Contains at least 50% recycled
    material. <a>Global Recycled Standard</a>
  </div>`

const UNCERTIFIED = '<div id="productTitle">An ordinary product</div>'

describe('readCertification', () => {
  test('names the certifier verbatim', () => {
    const doc = new DOMParser().parseFromString(CERTIFIED, 'text/html')
    expect(readCertification(doc)).toContain('Global Recycled Standard')
  })

  test('returns null when the product carries no certification', () => {
    const doc = new DOMParser().parseFromString(UNCERTIFIED, 'text/html')
    expect(readCertification(doc)).toBeNull()
  })

  test('ignores an empty certification container', () => {
    const doc = new DOMParser().parseFromString('<div id="climatePledgeFriendly"></div>', 'text/html')
    expect(readCertification(doc)).toBeNull()
  })
})

describe('findGreener', () => {
  const searchPage = (cards: { asin: string; title: string; price: string }[]) =>
    `<div>${cards
      .map(
        (c) =>
          `<div data-asin="${c.asin}"><h2>${c.title}</h2>` +
          `<span class="a-price"><span class="a-offscreen">${c.price}</span></span></div>`,
      )
      .join('')}</div>`

  const serve = (searchHtml: string, productHtml: string) =>
    (async (input: unknown) =>
      ({
        ok: true,
        status: 200,
        text: async () => (String(input).includes('/s?k=') ? searchHtml : productHtml),
      }) as unknown as Response) as unknown as typeof fetch

  const ONE = searchPage([
    { asin: 'B0FN44NCTQ', title: 'BEICHEN Mini Fridge 4 Liter', price: 'CAD61.00' },
  ])

  test('returns a certified alternative with its certification', async () => {
    const out = await findGreener('Cooluli Mini Fridge 4L', 'https://www.amazon.com/dp/B0771S9XT8', {
      fetchImpl: serve(ONE, CERTIFIED),
    })
    expect(out).toHaveLength(1)
    expect(out[0].price).toBe(61)
    expect(out[0].currency).toBe('CAD')
    expect(out[0].source).toBe('amazon')
    expect(out[0].certification).toContain('Global Recycled Standard')
  })

  test('drops a product whose certification cannot be named', async () => {
    const out = await findGreener('Cooluli Mini Fridge 4L', 'https://www.amazon.com/dp/B0771S9XT8', {
      fetchImpl: serve(ONE, UNCERTIFIED),
    })
    expect(out).toEqual([])
  })

  test('links to the product it actually checked', async () => {
    const out = await findGreener('Cooluli Mini Fridge 4L', 'https://www.amazon.com/dp/B0771S9XT8', {
      fetchImpl: serve(ONE, CERTIFIED),
    })
    expect(out[0].url).toContain('B0FN44NCTQ')
  })

  test('never throws when the network fails', async () => {
    const out = await findGreener('anything', 'https://www.amazon.com/dp/B0', {
      fetchImpl: (async () => {
        throw new Error('offline')
      }) as unknown as typeof fetch,
    })
    expect(out).toEqual([])
  })

  test('returns nothing when the search itself fails', async () => {
    const out = await findGreener('anything', 'https://www.amazon.com/dp/B0', {
      fetchImpl: (async () => ({ ok: false, status: 503 }) as unknown as Response) as unknown as typeof fetch,
    })
    expect(out).toEqual([])
  })
})
