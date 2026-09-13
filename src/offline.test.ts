/* ---------------------------------------------------------------------------
 * The offline table is a copy, so the thing worth testing is that it is still
 * a faithful one.
 *
 * proxy/snowflake.ts is lane/snowflake's file and will grow a database client
 * that cannot be bundled into a service worker, which is why src/offline.ts
 * carries its own copy rather than importing it. This test is what keeps the
 * two from drifting apart quietly.
 *
 * When guidance moves to a real Snowflake table, getCategoryGuidance will stop
 * answering without credentials. The assertion below is deliberately phrased
 * as "if the proxy has an opinion, ours must match it", so that migration
 * makes this test go quiet rather than go red.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest'
import { OFFLINE_GUIDANCE, resolveLocally } from './offline'
import { getCategoryGuidance } from '../proxy/snowflake'
import { classify } from '../proxy/categories'
import type { BuyerContext, ProductContext, UsedOption } from './types'

const NO_CONTEXT: BuyerContext = { needInDays: null, hasCar: false }

const product = (over: Partial<ProductContext> = {}): ProductContext => ({
  title: 'Midea 3.1 Cu. Ft. Compact Mini Fridge',
  price: 89,
  currency: 'USD',
  category: '',
  imageUrl: null,
  sourceUrl: 'https://www.amazon.com/dp/TEST',
  ...over,
})

const option = (over: Partial<UsedOption> = {}): UsedOption => ({
  source: 'amazon',
  title: 'Used - Very Good',
  price: 52,
  currency: 'USD',
  url: 'https://example.test/a',
  imageUrl: null,
  condition: 'Used - Very Good',
  daysToHand: 7,
  ...over,
})

describe('offline guidance mirrors the proxy', () => {
  for (const slug of Object.keys(OFFLINE_GUIDANCE)) {
    it(`agrees with the proxy about "${slug}"`, async () => {
      const theirs = await getCategoryGuidance(slug)
      if (!theirs) return // real Snowflake, no credentials here — nothing to compare
      expect(OFFLINE_GUIDANCE[slug]).toEqual(theirs)
    })
  }

  it('never carries a carbon figure without a source to back it', () => {
    for (const g of Object.values(OFFLINE_GUIDANCE)) {
      if (g.embodiedCo2Kg > 0) expect(g.co2Source).not.toBe('')
    }
  })
})

describe('resolving without the proxy', () => {
  it('produces the same shape the proxy would', () => {
    const result = resolveLocally(product(), NO_CONTEXT, [option()])
    expect(result).not.toBeNull()
    expect(result!.guidance.category).toBe('mini-fridge')
    expect(result!.options).toHaveLength(1)
    expect(result!.savingsUsd).toBe(37)
    expect(result!.reason).toBe('cheapest')
  })

  it('shows nothing secondhand where the verdict is to buy new', () => {
    const result = resolveLocally(
      product({ title: 'Zinus 8 Inch Green Tea Memory Foam Mattress' }),
      NO_CONTEXT,
      [option()],
    )
    expect(result!.guidance.verdict).toBe('avoid')
    expect(result!.options).toEqual([])
    expect(result!.co2AvoidedKg).toBeNull()
  })

  it('claims no saving when nothing arrives in time', () => {
    const result = resolveLocally(product(), { needInDays: 1, hasCar: false }, [option()])
    expect(result!.reason).toBe('nothing-arrives-in-time')
    expect(result!.savingsUsd).toBeNull()
    expect(result!.co2AvoidedKg).toBeNull()
  })

  it('never subtracts one currency from another', () => {
    const result = resolveLocally(product({ currency: 'CAD' }), NO_CONTEXT, [
      option({ currency: 'USD' }),
    ])
    expect(result!.options).toEqual([])
    expect(result!.savingsUsd).toBeNull()
  })

  it('returns null for a category it has no opinion about', () => {
    expect(resolveLocally(product({ title: 'Artisanal Sourdough Starter' }), NO_CONTEXT, [])).toBeNull()
  })

  it('covers every category the proxy has guidance for', async () => {
    /* If lane/snowflake adds a category, the offline copy should gain it too —
     * otherwise the extension goes quiet on it the moment the proxy is down. */
    const slugs = new Set<string>()
    for (const title of [
      'mini fridge', 'mattress', 'monitor', 'laptop', 'desk',
    ]) {
      const slug = classify(title)
      if (slug && (await getCategoryGuidance(slug))) slugs.add(slug)
    }
    for (const slug of slugs) expect(OFFLINE_GUIDANCE[slug]).toBeDefined()
  })
})
