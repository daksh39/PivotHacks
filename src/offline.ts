/* ---------------------------------------------------------------------------
 * The answer, computed in the extension, when the proxy is not answering.
 *
 * WHY THIS EXISTS
 *
 * The proxy was introduced to hold a credential: §08 is emphatic that the eBay
 * secret cannot live in a content script. That reason is gone. Listings are now
 * read from the retailer's own page and frontend API by the content script
 * itself, same-origin, with no credential anywhere — so what /lookup does today
 * is classify a title, look up a category, rank some options and do arithmetic.
 * All of it pure, none of it secret.
 *
 * So when the proxy is unreachable the honest thing is not to disappear. It is
 * to do the same work here. Loading dist/ into Chrome now produces a working
 * extension on its own, with no second terminal — which is what "demo ready"
 * actually means.
 *
 * The proxy is still the source of truth whenever it answers, and it has to
 * stay that way: lane/snowflake is moving guidance into a real database, and
 * database credentials genuinely cannot live in here. This is the fallback,
 * not the plan.
 *
 * WHAT IS DUPLICATED, AND WHAT GUARDS IT
 *
 * `OFFLINE_GUIDANCE` mirrors the seed table in proxy/snowflake.ts, which is
 * lane/snowflake's file and not ours to import — it will grow a database
 * client that cannot be bundled into a service worker. offline.test.ts asserts
 * this table still agrees with the proxy's, so the copy cannot drift quietly.
 * ------------------------------------------------------------------------- */

import type {
  BuyerContext,
  CategoryGuidance,
  ProductContext,
  UsedOption,
  VerteResult,
} from './types'
import { classify } from '../proxy/categories'
import { rank } from '../proxy/rank'

/**
 * Mirrors the SEED in proxy/snowflake.ts. §09: a category carries a carbon
 * figure ONLY where co2Source names a real reference. Where none was found,
 * embodiedCo2Kg is 0 and co2Source is empty, and the card shows no claim at
 * all rather than a number nobody can defend.
 */
export const OFFLINE_GUIDANCE: Record<string, CategoryGuidance> = {
  'mini-fridge': {
    category: 'mini-fridge',
    verdict: 'safe',
    checkTips: [
      'Check the door seal for cracks or gaps.',
      'Confirm it cools within an hour of plugging in.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Compressor appliances last well. Buying used avoids nearly all of the footprint.',
    bulky: true,
  },
  mattress: {
    category: 'mattress',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Hygiene and pest risk, and compression is permanent. Buy this one new.',
    bulky: true,
  },
  monitor: {
    category: 'monitor',
    verdict: 'safe',
    checkTips: [
      'Show a white image and look for dead pixels.',
      'Check the corners for backlight bleed in a dark room.',
      'Confirm which cables are included.',
    ],
    embodiedCo2Kg: 322,
    co2Source: 'Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing',
    note: "Most of a display's footprint is in the making of it, so a used one avoids nearly all of it.",
    bulky: false,
  },
  laptop: {
    category: 'laptop',
    verdict: 'check',
    checkTips: [
      'Ask for the battery cycle count.',
      'Confirm it powers on and gets past the setup screen.',
      'Check it is not activation locked to the previous owner.',
    ],
    embodiedCo2Kg: 122,
    co2Source: 'Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production',
    note: "Production dominates a laptop's footprint. Activation lock is the one thing that makes a cheap one worthless.",
    bulky: false,
  },
  desk: {
    category: 'desk',
    verdict: 'safe',
    checkTips: [
      'Check the drawer runners slide cleanly.',
      "Make sure it isn't particleboard that has been wet.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Ideal used. Solid wood outlives several owners.',
    bulky: true,
  },
}

/** Same rule the proxy applies: never subtract one currency from another. */
function sameCurrency(options: UsedOption[], currency: string): UsedOption[] {
  return options.filter((option) => option.currency === currency)
}

/** Against the RECOMMENDED option, not the cheapest — and never when nothing works. */
function savingsFor(
  product: ProductContext,
  options: UsedOption[],
  reason: VerteResult['reason'],
): number | null {
  if (reason === 'nothing-arrives-in-time') return null
  const recommended = options[0]?.price ?? null
  return product.price != null && recommended != null && product.price > recommended
    ? Math.round(product.price - recommended)
    : null
}

/**
 * Null means the same thing it means at the proxy: we have nothing useful to
 * say about this product, so render no card. A wrong verdict is far worse than
 * no verdict.
 */
export function resolveLocally(
  product: ProductContext,
  context: BuyerContext,
  options: UsedOption[],
): VerteResult | null {
  const category = product.category || classify(product.title)
  if (!category) return null

  const guidance = OFFLINE_GUIDANCE[category]
  if (!guidance) return null

  /* Show nothing secondhand when we are telling them to buy it new. */
  const usable = guidance.verdict === 'avoid' ? [] : options
  const comparable = sameCurrency(usable, product.currency)
  const ranked = rank(comparable, context, guidance)

  return {
    product: { ...product, category: guidance.category },
    guidance,
    options: ranked.options,
    context,
    reason: ranked.reason,
    passedOver: ranked.passedOver,
    savingsUsd: savingsFor(product, ranked.options, ranked.reason),
    co2AvoidedKg:
      ranked.options.length && ranked.reason !== 'nothing-arrives-in-time'
        ? guidance.embodiedCo2Kg
        : null,
  }
}
