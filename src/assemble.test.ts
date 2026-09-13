/* Phase 1: an unknown category must not destroy the card.
 *
 * Root cause: classify() missed 5 of 12 real product titles. Each miss
 * returned 404, lookup() returned null, and run() called unmountCard() on a
 * card it had just mounted — "shows up once and then disappears".
 *
 * The category only supplies the verdict and the carbon figure. The price
 * saving, which is the actual product, needs none of it.
 */
import { describe, expect, test } from 'vitest'
import { buildResult } from './assemble'
import type { BuyerContext, GreenerOption, UsedOption } from './types'

const ctx: BuyerContext = { needInDays: null, hasCar: false, budgetCap: null }
const product = {
  title: 'Logitech MX Master 3S Wireless Mouse',
  price: 129,
  currency: 'CAD',
  category: '',
  imageUrl: null,
  sourceUrl: 'https://www.amazon.com/dp/B0000000AA',
}
const option: UsedOption = {
  source: 'amazon',
  title: 'Renewed',
  price: 79,
  currency: 'CAD',
  url: 'https://www.amazon.com/dp/B0000000BB',
  imageUrl: null,
  condition: 'Renewed',
  daysToHand: 7,
}

describe('unknown category', () => {
  test('still returns a result instead of failing', () => {
    const out = buildResult(product, null, [option], ctx)
    expect(out).not.toBeNull()
  })

  test('still reports the saving, which is the whole point', () => {
    const out = buildResult(product, null, [option], ctx)
    expect(out!.savingsUsd).toBe(50)
    expect(out!.options[0].price).toBe(79)
  })

  test('carries no verdict and no carbon claim', () => {
    const out = buildResult(product, null, [option], ctx)
    expect(out!.guidance).toBeNull()
    expect(out!.co2AvoidedKg).toBeNull()
  })
})

describe('always present on a product page', () => {
  /* Requirement change: the card must appear on every supported product page,
   * without the user clicking the toolbar icon. Returning null for "no
   * listings and no category" meant the extension was silently absent on a
   * large share of pages, which is indistinguishable from being broken. An
   * honest "nothing secondhand for this one" is information; silence is not. */
  test('still returns a result with neither listings nor guidance', () => {
    const out = buildResult(product, null, [], ctx)
    expect(out).not.toBeNull()
    expect(out!.options).toEqual([])
    expect(out!.guidance).toBeNull()
  })

  test('claims no saving when there is nothing to buy', () => {
    const out = buildResult(product, null, [], ctx)
    expect(out!.savingsUsd).toBeNull()
    expect(out!.co2AvoidedKg).toBeNull()
  })

  test('still returns a result with guidance but no listings, so we can say buy new', () => {
    const guidance = {
      category: 'mouse',
      verdict: 'avoid' as const,
      checkTips: [],
      embodiedCo2Kg: 0,
      co2Source: '',
      note: 'x',
      bulky: false,
    }
    expect(buildResult(product, guidance, [], ctx)).not.toBeNull()
  })
})

/* --- the ladder rule ----------------------------------------------------- */

const greenerOption: GreenerOption = {
  source: 'amazon',
  title: 'BEICHEN Mini Fridge 4 Liter',
  price: 61,
  currency: 'CAD',
  url: 'https://www.amazon.com/dp/B0FN44NCTQ',
  imageUrl: null,
  certification: 'Contains at least 50% recycled material. Global Recycled Standard',
}

describe('the ladder', () => {
  test('offers a greener new product when nothing secondhand exists', () => {
    const out = buildResult(product, null, [], ctx, [greenerOption])
    expect(out.greener).toHaveLength(1)
  })

  test('NEVER offers a new product when a used one exists', () => {
    /* The rule the whole thesis rests on: something newly manufactured must
     * never compete with something that already exists. */
    const out = buildResult(product, null, [option], ctx, [greenerOption])
    expect(out.greener).toEqual([])
  })

  test('defaults to none when no alternatives were passed', () => {
    expect(buildResult(product, null, [], ctx).greener).toEqual([])
  })
})
