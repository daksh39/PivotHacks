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
    co2Source: 'PLACEHOLDER — no defensible source found; see note',
    /* Deliberately still unsourced, and the card therefore shows no carbon
     * figure for it. Published LCAs consistently find that for refrigerators
     * the USE phase dominates, not manufacturing — so "avoids nearly all of
     * the footprint" is not a claim we can make here. Demo the monitor. */
    note: 'Compressor appliances last well, and a used one is the cheap option.',
    bulky: true,
  },
  options: [
    /* Cheapest is also the slowest. That tension is the whole point of
     * pivot 03 — with a deadline, this $28 listing loses to the $45 one. */
    {
      source: 'ebay',
      title: 'Midea 3.1 Cu Ft Compact Refrigerator — Pre-owned',
      price: 28,
      currency: 'USD',
      url: 'https://www.ebay.com/itm/000000000001',
      imageUrl: null,
      condition: 'Pre-owned',
      daysToHand: 6,
    },
    {
      source: 'ebay',
      title: 'Mini Fridge 3.2 Cu Ft with Freezer Compartment',
      price: 33,
      currency: 'USD',
      url: 'https://www.ebay.com/itm/000000000002',
      imageUrl: null,
      condition: 'Used',
      daysToHand: 4,
    },
    {
      source: 'campus',
      title: 'Mini fridge, used one year, works perfectly',
      price: 45,
      currency: 'USD',
      url: 'https://example.edu/listings/1',
      imageUrl: null,
      condition: 'Used — good',
      distanceMi: 2,
      daysToHand: 1,
    },
    {
      source: 'campus',
      title: 'Compact fridge — moving out, must go',
      price: 49,
      currency: 'USD',
      url: 'https://example.edu/listings/2',
      imageUrl: null,
      condition: 'Used — good',
      distanceMi: 0.8,
      daysToHand: 1,
    },
  ],
  context: { needInDays: null, hasCar: true },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: 61,
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
    bulky: true,
  },
  options: [],
  context: { needInDays: null, hasCar: true },
  reason: 'cheapest',
  passedOver: null,
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
    bulky: false,
  },
  options: [],
  context: { needInDays: null, hasCar: true },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: null,
  co2AvoidedKg: null,
}

/**
 * THE DEMO PRODUCT. Every figure on this card is citable.
 *
 * Dell publishes a carbon footprint datasheet for the S2421HS: 476 kg CO2e
 * across the life cycle, 67.7% of it manufacturing. So a used monitor really
 * does avoid nearly all of its footprint — the thesis at full strength, which
 * is not true of appliances that run around the clock.
 */
export const MOCK_MONITOR: VerteResult = {
  product: {
    title: 'Dell 24 Monitor - S2421HS, 1920 x 1080, IPS, HDMI',
    price: 189,
    currency: 'USD',
    category: 'monitor',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/B08DHXG6TQ',
  },
  guidance: {
    category: 'monitor',
    verdict: 'safe',
    checkTips: [
      'Show a white image and look for dead pixels.',
      'Check the corners for backlight bleed in a dark room.',
    ],
    embodiedCo2Kg: 322,
    co2Source: 'Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing',
    note: "Most of a display's footprint is in the making of it, so a used one avoids nearly all of it.",
    bulky: false,
  },
  options: [
    {
      source: 'ebay',
      title: 'Dell S2421HS 24" IPS Monitor - Tested, Working',
      price: 72,
      currency: 'USD',
      url: 'https://www.ebay.com/itm/000000000101',
      imageUrl: null,
      condition: 'Used',
      daysToHand: 5,
    },
    {
      source: 'campus',
      title: 'Dell 24" monitor, graduating, must sell',
      price: 85,
      currency: 'USD',
      url: 'https://example.edu/listings/11',
      imageUrl: null,
      condition: 'Used — good',
      distanceMi: 1.1,
      daysToHand: 1,
    },
  ],
  context: { needInDays: null, hasCar: false },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: 117,
  co2AvoidedKg: 322,
}

export const MOCKS = {
  monitor: MOCK_MONITOR,
  'mini-fridge': MOCK_MINI_FRIDGE,
  mattress: MOCK_MATTRESS,
  'drying-rack': MOCK_EMPTY,
} as const

/** Best-effort fixture for any category, so no lane is ever blocked. */
export function mockFor(category: string): VerteResult {
  return (MOCKS as Record<string, VerteResult>)[category] ?? MOCK_MINI_FRIDGE
}

/**
 * The same fridge, same listings, with a deadline. This is the pivot 03 demo:
 * context demotes the $28 option because it cannot arrive in time, and the
 * $45 campus pickup becomes the recommendation. Nothing was filtered out —
 * the cheap listing is still in the list, just no longer first.
 */
export const MOCK_MINI_FRIDGE_DEADLINE: VerteResult = {
  ...MOCK_MINI_FRIDGE,
  options: [
    MOCK_MINI_FRIDGE.options[2],
    MOCK_MINI_FRIDGE.options[0],
    MOCK_MINI_FRIDGE.options[1],
    MOCK_MINI_FRIDGE.options[3],
  ],
  context: { needInDays: 2, hasCar: true },
  reason: 'only-option-in-time',
  passedOver: {
    option: MOCK_MINI_FRIDGE.options[0],
    why: 'it takes 6 days to arrive and you need it in 2',
  },
  savingsUsd: 44,
}

/**
 * Deadline plus no car, on a bulky category. Every listing is unreachable:
 * the eBay ones can't arrive in time, the campus ones can't be collected.
 * Verte stops selling and says buy new — the same honesty as the mattress
 * case, but reached through context rather than the category.
 */
export const MOCK_MINI_FRIDGE_BLOCKED: VerteResult = {
  ...MOCK_MINI_FRIDGE,
  context: { needInDays: 2, hasCar: false },
  reason: 'nothing-arrives-in-time',
  passedOver: null,
  savingsUsd: null,
  co2AvoidedKg: null,
}

