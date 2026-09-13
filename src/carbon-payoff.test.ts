/* ---------------------------------------------------------------------------
 * Carbon deciding the recommendation, not decorating it.
 *
 * The claim Verte makes is that buying used matters. It does not matter
 * equally: a used laptop avoids ~122 kg of manufacturing, a used paperback
 * under 3. These tests pin the consequence of that difference — that on a
 * low-payoff category with a small saving, Verte stops selling.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest'
import { carbonPayoff, payoffHeadline, payoffMeaning } from './carbon'
import { buildResult } from './result'
import { OFFLINE_GUIDANCE } from './offline-guidance'
import type { BuyerContext, CategoryGuidance, ProductContext, UsedOption } from './types'

const NO_CONTEXT: BuyerContext = { needInDays: null, hasCar: false, budgetCap: null }

const guidance = (over: Partial<CategoryGuidance> = {}): CategoryGuidance => ({
  category: 'thing',
  verdict: 'safe',
  checkTips: [],
  embodiedCo2Kg: 0,
  co2Source: '',
  note: '',
  bulky: false,
  useDominant: false,
  ...over,
})

const product = (price: number): ProductContext => ({
  title: 'A thing',
  price,
  currency: 'USD',
  category: 'thing',
  imageUrl: null,
  sourceUrl: 'https://www.amazon.com/dp/T',
})

const option = (price: number): UsedOption => ({
  source: 'amazon',
  title: 'Used - Very Good',
  price,
  currency: 'USD',
  url: 'https://example.test/a',
  imageUrl: null,
  condition: 'Used - Very Good',
  daysToHand: 7,
})

describe('carbonPayoff', () => {
  it('bands a cited figure', () => {
    const cited = (kg: number) => guidance({ embodiedCo2Kg: kg, co2Source: 'A real LCA study' })
    expect(carbonPayoff(cited(322))).toBe('high')
    expect(carbonPayoff(cited(100))).toBe('high')
    expect(carbonPayoff(cited(99))).toBe('moderate')
    expect(carbonPayoff(cited(25))).toBe('moderate')
    expect(carbonPayoff(cited(24))).toBe('low')
    expect(carbonPayoff(cited(3))).toBe('low')
  })

  it('claims nothing without a citation, however big the number', () => {
    /* §09 — the number is worth less than the answer to "where did it come
     * from". An uncited 300 kg is not a high-impact category, it is a guess. */
    expect(carbonPayoff(guidance({ embodiedCo2Kg: 300, co2Source: '' }))).toBe('unknown')
    expect(carbonPayoff(guidance({ embodiedCo2Kg: 300, co2Source: 'PLACEHOLDER' }))).toBe('unknown')
    expect(payoffHeadline('unknown')).toBeNull()
    expect(payoffMeaning('unknown')).toBeNull()
  })
})

describe('the recommendation itself changes with the payoff', () => {
  const CITED_LOW = guidance({ embodiedCo2Kg: 3, co2Source: 'Wells et al. 2012, Journal of Industrial Ecology' })
  const CITED_HIGH = guidance({ embodiedCo2Kg: 122, co2Source: 'Apple Product Environmental Report' })

  it('tells them to buy new when the carbon barely moves and nor does the price', () => {
    const result = buildResult(product(20), CITED_LOW, [option(18)], NO_CONTEXT)
    expect(result.reason).toBe('low-carbon-payoff')
    /* The saving stays — the card needs it to show how small it is. */
    expect(result.savingsUsd).toBe(2)
    /* But we do not bank carbon from a purchase we just advised against. */
    expect(result.co2AvoidedKg).toBeNull()
  })

  it('still recommends used on a low-carbon category when the money is real', () => {
    /* Pivot 02: the user is a student with limited budget. Half off is worth
     * having even when the carbon case is weak — we just stop pretending the
     * carbon is the reason. */
    const result = buildResult(product(60), CITED_LOW, [option(25)], NO_CONTEXT)
    expect(result.reason).toBe('cheapest')
    expect(result.savingsUsd).toBe(35)
  })

  it('recommends used on a high-carbon category even for a small saving', () => {
    const result = buildResult(product(999), CITED_HIGH, [option(960)], NO_CONTEXT)
    expect(result.reason).toBe('cheapest')
    expect(result.co2AvoidedKg).toBe(122)
  })

  it('never overrides an answer that matters more', () => {
    /* "You cannot afford any of these" outranks "this one barely matters". */
    const broke = buildResult(product(20), CITED_LOW, [option(18)], {
      ...NO_CONTEXT,
      budgetCap: 5,
    })
    expect(broke.reason).toBe('nothing-in-budget')

    const late = buildResult(product(20), CITED_LOW, [option(18)], {
      ...NO_CONTEXT,
      needInDays: 1,
    })
    expect(late.reason).toBe('nothing-arrives-in-time')
  })

  it('says nothing either way on a category with no cited figure', () => {
    const result = buildResult(product(20), guidance(), [option(18)], NO_CONTEXT)
    expect(result.reason).toBe('cheapest')
  })
})

describe('the real table', () => {
  it('marks the appliance where running it outweighs making it', () => {
    /* A fridge is the honest counter-example to Verte's whole pitch, and the
     * card says so rather than cheering. */
    expect(OFFLINE_GUIDANCE['mini-fridge'].useDominant).toBe(true)
  })

  it('spans a real range, so the banding actually discriminates', () => {
    const bands = new Set(Object.values(OFFLINE_GUIDANCE).map((g) => carbonPayoff(g)))
    expect(bands.has('high')).toBe(true)
    expect(bands.has('low')).toBe(true)
  })
})
