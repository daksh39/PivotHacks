/* ---------------------------------------------------------------------------
 * Ranking: the file where the buyer's situation changes the answer.
 *
 * Pivot 03 requires context to change a recommendation, not decorate one. Two
 * rules were written for constraints we cannot yet measure — delivery dates
 * (every listing reports the same placeholder) and local pickup (no source
 * reports it). Both are correct and both are dormant.
 *
 * Budget is different: the prices are real, so a ceiling genuinely changes
 * what Verte tells someone to do — including telling them to buy new on a
 * category it would otherwise say buy used.
 * ------------------------------------------------------------------------- */

import { describe, expect, test } from 'vitest'
import type { BuyerContext, CategoryGuidance, UsedOption } from './types'
import { rank } from './rank'

const guidance = (over: Partial<CategoryGuidance> = {}): CategoryGuidance => ({
  category: 'headphones',
  verdict: 'safe',
  checkTips: [],
  embodiedCo2Kg: 0,
  co2Source: '',
  note: '',
  bulky: false,
  useDominant: false,
  ...over,
})

const option = (price: number, over: Partial<UsedOption> = {}): UsedOption => ({
  source: 'bestbuy',
  title: `Open Box - ${price}`,
  price,
  currency: 'CAD',
  url: `https://example.test/${price}`,
  imageUrl: null,
  condition: 'Open box',
  daysToHand: 7,
  ...over,
})

const ctx = (over: Partial<BuyerContext> = {}): BuyerContext => ({
  needInDays: null,
  hasCar: false,
  budgetCap: null,
  ...over,
})

/* --- no constraints ------------------------------------------------------ */

describe('with no context', () => {
  test('recommends the cheapest listing', () => {
    const out = rank([option(180), option(174), option(200)], ctx(), guidance())
    expect(out.options[0].price).toBe(174)
    expect(out.reason).toBe('cheapest')
    expect(out.passedOver).toBeNull()
  })

  test('handles having nothing to rank', () => {
    const out = rank([], ctx(), guidance())
    expect(out.options).toEqual([])
  })
})

/* --- budget: real prices, so this one actually fires --------------------- */

describe('with a budget', () => {
  const listings = [option(174), option(180), option(200)]

  test('recommends the cheapest thing that actually fits', () => {
    const out = rank(listings, ctx({ budgetCap: 190 }), guidance())
    expect(out.options[0].price).toBe(174)
    expect(out.reason).toBe('cheapest')
  })

  test('says nothing fits rather than recommending something unaffordable', () => {
    const out = rank(listings, ctx({ budgetCap: 150 }), guidance())
    expect(out.reason).toBe('nothing-in-budget')
  })

  test('keeps every listing on the card even when none fit', () => {
    /* Filtering them away would hide the fact that secondhand exists at all.
     * They stay visible, marked as over budget. */
    const out = rank(listings, ctx({ budgetCap: 150 }), guidance())
    expect(out.options).toHaveLength(3)
  })

  test('tells them how far over the nearest one is, with the currency', () => {
    /* "24 over your budget" is ambiguous on a page priced in CAD. */
    const out = rank(listings, ctx({ budgetCap: 150 }), guidance())
    expect(out.passedOver?.option.price).toBe(174)
    expect(out.passedOver?.why).toContain('CA$24')
  })

  test('a budget equal to the price still counts as affordable', () => {
    const out = rank(listings, ctx({ budgetCap: 174 }), guidance())
    expect(out.reason).toBe('cheapest')
    expect(out.options[0].price).toBe(174)
  })
})

/* --- budget combined with the dormant rules ------------------------------ */

describe('budget together with a deadline', () => {
  test('an affordable listing that arrives too late is still not the answer', () => {
    const out = rank(
      [option(174, { daysToHand: 9 }), option(180, { daysToHand: 2 })],
      ctx({ budgetCap: 190, needInDays: 3 }),
      guidance(),
    )
    expect(out.options[0].price).toBe(180)
    expect(out.reason).toBe('only-option-in-time')
  })

  test('an unaffordable fast option does not rescue an affordable slow one', () => {
    /* $174 fits the budget but arrives in 9 days; $300 arrives tomorrow but is
     * unaffordable. The honest report is scoped to what they can pay for:
     * among affordable listings, nothing arrives in time. Saying "nothing is
     * within budget" would be false, since $174 is. */
    const out = rank(
      [option(174, { daysToHand: 9 }), option(300, { daysToHand: 1 })],
      ctx({ budgetCap: 200, needInDays: 3 }),
      guidance(),
    )
    expect(out.reason).toBe('nothing-arrives-in-time')
  })
})
