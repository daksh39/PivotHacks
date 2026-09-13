/* ---------------------------------------------------------------------------
 * Shared fixtures.  FROZEN alongside src/types.ts — see CLAUDE.md.
 *
 * These are the exact bytes the proxy serves in mock mode (VERTE_MOCK=1), the
 * exact bytes the dev preview page renders, and the exact bytes the extension
 * falls back to when the proxy is unreachable. One set of fixtures, so what
 * you build against is what you ship against.
 *
 * NOTE ON THE CARBON NUMBERS: every co2Source below is a deliberate
 * PLACEHOLDER. verte-plan.md §09 — we display a figure only with a citation
 * behind it. lane/demo replaces these with sourced values. Do not invent one.
 * ------------------------------------------------------------------------- */

import type { VerteResult } from './types'

/** The canonical demo product. Verdict: safe. */
export const MOCK_MINI_FRIDGE: VerteResult = {
  product: {
    title: 'Midea 3.1 Cu. Ft. Compact Mini Fridge with Freezer, Black',
    price: 89,
    currency: 'USD',
    category: 'mini-fridge',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/B07D5VQZ7Y',
  },
  guidance: {
    category: 'mini-fridge',
    verdict: 'safe',
    checkTips: [
      'Check the door seal for cracks or gaps.',
      'Confirm it cools within an hour of plugging in.',
    ],
    embodiedCo2Kg: 46,
    co2Source: 'PLACEHOLDER — lane/demo to source',
    note: 'Compressor appliances last well. Buying used avoids nearly all of the footprint.',
  },
  options: [
    {
      source: 'campus',
      title: 'Mini fridge, used one year, works perfectly',
      price: 34,
      url: 'https://example.edu/listings/1',
      imageUrl: null,
      condition: 'Used — good',
      distanceMi: 2,
    },
    {
      source: 'campus',
      title: 'Compact fridge — moving out, must go',
      price: 40,
      url: 'https://example.edu/listings/2',
      imageUrl: null,
      condition: 'Used — good',
      distanceMi: 0.8,
    },
    {
      source: 'ebay',
      title: 'Midea 3.1 Cu Ft Compact Refrigerator — Pre-owned',
      price: 52,
      url: 'https://www.ebay.com/itm/000000000001',
      imageUrl: null,
      condition: 'Pre-owned',
    },
    {
      source: 'ebay',
      title: 'Mini Fridge 3.2 Cu Ft with Freezer Compartment',
      price: 58,
      url: 'https://www.ebay.com/itm/000000000002',
      imageUrl: null,
      condition: 'Used',
    },
    {
      source: 'ebay',
      title: 'Compact Refrigerator, Black — Good Working Order',
      price: 61,
      url: 'https://www.ebay.com/itm/000000000003',
      imageUrl: null,
      condition: 'Pre-owned',
    },
  ],
  savingsUsd: 55,
  co2AvoidedKg: 46,
}

/**
 * The demo beat that wins the room (verte-plan.md §07): Verte argues against
 * itself. An app willing to say "buy this one new" is the one you trust.
 */
export const MOCK_MATTRESS: VerteResult = {
  product: {
    title: 'Zinus 8 Inch Green Tea Memory Foam Mattress, Twin XL',
    price: 159,
    currency: 'USD',
    category: 'mattress',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/B00A7Y7SLW',
  },
  guidance: {
    category: 'mattress',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: 'PLACEHOLDER — lane/demo to source',
    note: 'Hygiene and pest risk, and foam compression is permanent. Buy this one new.',
  },
  options: [],
  savingsUsd: null,
  co2AvoidedKg: null,
}

/** Category is fine to buy used, but nothing is listed right now. */
export const MOCK_EMPTY: VerteResult = {
  product: {
    title: 'Simple Houseware Freestanding Clothes Drying Rack',
    price: 32,
    currency: 'USD',
    category: 'drying-rack',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/B01MQZVWZP',
  },
  guidance: {
    category: 'drying-rack',
    verdict: 'safe',
    checkTips: ['No meaningful risk. Never buy these new.'],
    embodiedCo2Kg: 8,
    co2Source: 'PLACEHOLDER — lane/demo to source',
    note: 'Nothing to go wrong. Always worth checking used first.',
  },
  options: [],
  savingsUsd: null,
  co2AvoidedKg: null,
}

export const MOCKS = {
  'mini-fridge': MOCK_MINI_FRIDGE,
  mattress: MOCK_MATTRESS,
  'drying-rack': MOCK_EMPTY,
} as const

/** Best-effort fixture for any category, so no lane is ever blocked. */
export function mockFor(category: string): VerteResult {
  return (MOCKS as Record<string, VerteResult>)[category] ?? MOCK_MINI_FRIDGE
}
