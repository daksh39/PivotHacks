/* ---------------------------------------------------------------------------
 * The environmental claim on the card.
 *
 * Carbon figures only render where a real citation exists, which is two
 * categories — and now that an unknown category is a normal outcome, most
 * cards were carrying NO environmental content at all. The product had
 * quietly become a price comparison tool.
 *
 * The fix is not to invent numbers. It is that the central claim was never
 * numeric: buying the one that already exists means one fewer gets made. That
 * is true of every product, needs no citation, and is the actual thesis.
 * ------------------------------------------------------------------------- */

import { describe, expect, test } from 'vitest'
import { impactLine } from './impactLine'
import type { CategoryGuidance, UsedOption, VerteResult } from './types'

const option: UsedOption = {
  source: 'amazon',
  title: 'Renewed',
  price: 79,
  currency: 'CAD',
  url: 'u',
  imageUrl: null,
  condition: 'Renewed',
  daysToHand: 7,
}

const guidance = (over: Partial<CategoryGuidance> = {}): CategoryGuidance => ({
  category: 'monitor',
  verdict: 'safe',
  checkTips: [],
  embodiedCo2Kg: 0,
  co2Source: '',
  note: '',
  bulky: false,
  ...over,
})

const result = (over: Partial<VerteResult> = {}): VerteResult => ({
  product: {
    title: 'Thing',
    price: 129,
    currency: 'CAD',
    category: '',
    imageUrl: null,
    sourceUrl: 'https://example.test/dp/1',
  },
  guidance: null,
  options: [option],
  context: { needInDays: null, hasCar: false, budgetCap: null },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: 50,
  co2AvoidedKg: null,
  ...over,
})

describe('with a cited figure', () => {
  const cited = result({
    guidance: guidance({
      embodiedCo2Kg: 322,
      co2Source: 'Dell S2421HS PCF datasheet — 476 kg CO2e total, 67.7% manufacturing',
    }),
    co2AvoidedKg: 322,
  })

  test('leads with the number', () => {
    expect(impactLine(cited)?.headline).toContain('322 kg')
  })

  test('gives the driving equivalent people can picture', () => {
    expect(impactLine(cited)?.headline).toContain('810 miles')
  })

  test('carries the citation so the number can be checked', () => {
    expect(impactLine(cited)?.source).toContain('Dell')
  })
})

describe('with no cited figure', () => {
  test('still makes the environmental claim', () => {
    /* This is the case that had gone silent, and it is now the common one. */
    const line = impactLine(result())
    expect(line).not.toBeNull()
    expect(line!.headline.toLowerCase()).toContain('one fewer')
  })

  test('claims nothing numeric it cannot back up', () => {
    const line = impactLine(result())
    expect(line!.headline).not.toMatch(/\d+\s*kg/)
    expect(line!.source).toBeNull()
  })

  test('works even when the category is unknown', () => {
    expect(impactLine(result({ guidance: null }))).not.toBeNull()
  })
})

describe('when there is nothing to claim', () => {
  test('says nothing when we are telling them to buy new', () => {
    expect(impactLine(result({ guidance: guidance({ verdict: 'avoid' }), options: [] }))).toBeNull()
  })

  test('says nothing when there is no secondhand option', () => {
    expect(impactLine(result({ options: [] }))).toBeNull()
  })

  test('says nothing when nothing is actually usable', () => {
    expect(impactLine(result({ reason: 'nothing-in-budget' }))).toBeNull()
  })
})
