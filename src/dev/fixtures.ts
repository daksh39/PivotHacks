/* ---------------------------------------------------------------------------
 * UI fixtures. DEV TOOL ONLY.
 *
 * These exist so src/dev/preview.html can render every card state without a
 * browser extension, a retailer page, or a network call. They are imported by
 * nothing else.
 *
 * They are NOT served to the extension and NOT served by the proxy. The old
 * src/mocks.ts was wired into both, which meant invented listings reached the
 * product and were presented as real. That path is gone: the extension now
 * shows the retailer's own listings or an honest empty state.
 *
 * The numbers below are copied from pages actually observed, so the preview
 * looks like the real thing:
 *   - Stewart Calculus on amazon.com: new CAD243.63, used CAD69.26
 *   - Sony WH-CH720N on bestbuy.ca: new $249.99, open box $180 and $174
 * ------------------------------------------------------------------------- */

import type { VerteResult } from '../types'

/** Amazon, one used buybox offer. What that source actually returns. */
export const FIXTURE_TEXTBOOK: VerteResult = {
  product: {
    title: 'Calculus (MindTap Course List)',
    price: 243.63,
    currency: 'CAD',
    category: 'textbook',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/1285740629',
  },
  guidance: {
    category: 'textbook',
    verdict: 'safe',
    checkTips: [
      'Confirm the edition matches the syllabus.',
      'Ask whether an access code is required and still unused.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'A previous edition is often fine, and usually a fraction of the price.',
    bulky: false,
  },
  options: [
    {
      source: 'amazon',
      title: 'Used - Very Good',
      price: 69.26,
      currency: 'CAD',
      url: 'https://www.amazon.com/gp/offer-listing/1285740629/?condition=used',
      imageUrl: null,
      condition: 'Used - Very Good',
      daysToHand: 7,
    },
  ],
  context: { needInDays: null, hasCar: false, budgetCap: null },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: 174,
  co2AvoidedKg: null,
}

/** Best Buy, several open-box variants — what that source actually returns. */
export const FIXTURE_HEADPHONES: VerteResult = {
  product: {
    title: 'Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - Black',
    price: 249.99,
    currency: 'CAD',
    category: 'headphones',
    imageUrl: null,
    sourceUrl: 'https://www.bestbuy.ca/en-ca/product/sony-wh-ch720n-black/16703135',
  },
  guidance: {
    category: 'headphones',
    verdict: 'check',
    checkTips: ['Budget for replacement ear pads.', 'Test both channels before paying.'],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Hygiene is the reason for the caveat, not whether they work.',
    bulky: false,
  },
  options: [
    {
      source: 'bestbuy',
      title: 'Open Box - Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - White',
      price: 180,
      currency: 'CAD',
      url: 'https://www.bestbuy.ca/en-ca/product/open-box-sony-wh-ch720n-white/17718782',
      imageUrl: null,
      condition: 'Open box',
      daysToHand: 7,
    },
    {
      source: 'bestbuy',
      title: 'Open Box - Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - Blue',
      price: 174,
      currency: 'CAD',
      url: 'https://www.bestbuy.ca/en-ca/product/open-box-sony-wh-ch720n-blue/19512746',
      imageUrl: null,
      condition: 'Open box',
      daysToHand: 7,
    },
  ],
  context: { needInDays: null, hasCar: false, budgetCap: null },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: 70,
  co2AvoidedKg: null,
}

/** A monitor, the one category whose carbon figure is fully cited. */
export const FIXTURE_MONITOR: VerteResult = {
  product: {
    title: 'Dell 24 Monitor - S2421HS, 1920 x 1080, IPS',
    price: 189,
    currency: 'CAD',
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
      source: 'amazon',
      title: 'Used - Good',
      price: 92,
      currency: 'CAD',
      url: 'https://www.amazon.com/gp/offer-listing/B08DHXG6TQ/?condition=used',
      imageUrl: null,
      condition: 'Used - Good',
      daysToHand: 7,
    },
  ],
  context: { needInDays: null, hasCar: false, budgetCap: null },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: 97,
  co2AvoidedKg: 322,
}

/** Verdict "avoid": Verte argues against itself. */
export const FIXTURE_MATTRESS: VerteResult = {
  product: {
    title: 'Zinus 8 Inch Green Tea Memory Foam Mattress, Twin XL',
    price: 159,
    currency: 'CAD',
    category: 'mattress',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/B00A7Y7SLW',
  },
  guidance: {
    category: 'mattress',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Hygiene and pest risk, and foam compression is permanent. Buy this one new.',
    bulky: true,
  },
  options: [],
  context: { needInDays: null, hasCar: false, budgetCap: null },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: null,
  co2AvoidedKg: null,
}

/** Safe to buy used, but this retailer has nothing secondhand right now. */
export const FIXTURE_EMPTY: VerteResult = {
  ...FIXTURE_TEXTBOOK,
  options: [],
  savingsUsd: null,
  co2AvoidedKg: null,
}

/**
 * The budget rule firing. Same Best Buy listings, a $150 ceiling, and the
 * recommendation changes from "buy this open-box one" to "nothing here fits".
 * This is the pivot-03 state that runs on real prices.
 */
export const FIXTURE_OVER_BUDGET: VerteResult = {
  ...FIXTURE_HEADPHONES,
  context: { needInDays: null, hasCar: false, budgetCap: 150 },
  reason: 'nothing-in-budget',
  passedOver: {
    option: FIXTURE_HEADPHONES.options[1],
    why: 'the cheapest one is CA$24 over your budget',
  },
  savingsUsd: null,
  co2AvoidedKg: null,
}

/**
 * The common case now: a product we could not classify. No verdict, no cited
 * carbon figure — and the card still has to carry the argument. This is the
 * state that used to render nothing at all.
 */
export const FIXTURE_UNKNOWN: VerteResult = {
  product: {
    title: 'Logitech MX Master 3S Wireless Mouse',
    price: 129,
    currency: 'CAD',
    category: '',
    imageUrl: null,
    sourceUrl: 'https://www.amazon.com/dp/B09HM94VDS',
  },
  guidance: null,
  options: [
    {
      source: 'amazon',
      title: 'Logitech MX Master 3S (Renewed)',
      price: 79,
      currency: 'CAD',
      url: 'https://www.amazon.com/dp/B09HM94VDS',
      imageUrl: null,
      condition: 'Renewed',
      daysToHand: 7,
    },
  ],
  context: { needInDays: null, hasCar: false, budgetCap: null },
  reason: 'cheapest',
  passedOver: null,
  savingsUsd: 50,
  co2AvoidedKg: null,
}
