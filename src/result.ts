/* ---------------------------------------------------------------------------
 * Building a VerteResult. The ONE place it happens.
 *
 * This used to live inside proxy/index.ts, with a second copy in src/offline.ts
 * for when the proxy is not running. The copies lasted about ten minutes: main
 * added the budget rule, proxy/index.ts learned that `nothing-in-budget` must
 * suppress the saving and the carbon claim, and the offline copy did not — so
 * with the proxy down the card would have advertised a saving on something the
 * buyer had just said they could not afford.
 *
 * Two implementations of "what does the card get" is one too many. The proxy
 * and the extension now call this, and a rule added here reaches both.
 *
 * Lives in src/ rather than proxy/ because the extension bundles it and the
 * extension must never import express, dotenv, or a database client.
 * ------------------------------------------------------------------------- */

import type {
  BuyerContext,
  CategoryGuidance,
  ProductContext,
  UsedOption,
  VerteResult,
} from './types'
import { rank } from '../proxy/rank'
import { carbonPayoff } from './carbon'

/**
 * Reasons that mean "there is nothing here they can actually buy".
 *
 * A card reading "nothing arrives in time" beside "save $61" is a
 * contradiction a judge catches in the first ten seconds — and the same is
 * true of a saving on something over their budget.
 */
const NOTHING_USABLE: VerteResult['reason'][] = ['nothing-arrives-in-time', 'nothing-in-budget']

/**
 * Reasons where we must not claim avoided manufacturing.
 *
 * Everything in NOTHING_USABLE, plus the case where Verte is actively telling
 * them to buy new: banking the carbon from a purchase we just advised against
 * would be having it both ways. The SAVING still stands there, because the
 * card needs it to show how small it is — "you would save $2, not worth the
 * trip" is the argument.
 */
const NO_CARBON_CLAIM: VerteResult['reason'][] = [...NOTHING_USABLE, 'low-carbon-payoff']

/**
 * Below this share of the new price, a saving is not worth a stranger, a
 * pickup and a risk — so on a category that barely costs anything to make,
 * Verte stops selling.
 */
const SMALL_SAVING_SHARE = 0.15

/**
 * Carbon deciding the recommendation, not decorating it.
 *
 * Verte's claim is that buying used matters. On a paperback it does not much:
 * about 3 kg of manufacturing, against 122 for a laptop. Pretending those are
 * the same story is how the whole pitch stops being believed, so where the
 * carbon payoff is low AND the money saved is small, the recommendation flips
 * and we say buying new is fine.
 *
 * Only ever overrides the "we found you something" reasons. If nothing arrives
 * in time or nothing is affordable, that is already the more important answer.
 */
function carbonOverride(
  reason: VerteResult['reason'],
  guidance: CategoryGuidance,
  product: ProductContext,
  recommended: UsedOption | undefined,
): VerteResult['reason'] {
  if (NOTHING_USABLE.includes(reason)) return reason
  if (!recommended || carbonPayoff(guidance) !== 'low') return reason
  if (product.price == null) return reason

  const saved = product.price - recommended.price
  return saved < product.price * SMALL_SAVING_SHARE ? 'low-carbon-payoff' : reason
}

/**
 * Listings we can legitimately compare against this product.
 *
 * A CAD price minus a USD price is not a saving, it is a wrong number rendered
 * with total confidence. We would rather show fewer listings than invent
 * arithmetic.
 */
function sameCurrency(options: UsedOption[], currency: string): UsedOption[] {
  const kept = options.filter((option) => option.currency === currency)
  if (kept.length !== options.length) {
    console.warn(`[verte] dropped ${options.length - kept.length} listing(s) not in ${currency}`)
  }
  return kept
}

/**
 * Against the RECOMMENDED option, not the cheapest one. If context pushed us to
 * a pricier listing, the saving we advertise has to be the one they would
 * actually get. Quoting the cheap listing's saving would be a lie.
 */
function savingsFor(
  product: ProductContext,
  options: UsedOption[],
  reason: VerteResult['reason'],
): number | null {
  if (NOTHING_USABLE.includes(reason)) return null
  const recommended = options[0]?.price ?? null
  return product.price != null && recommended != null && product.price > recommended
    ? Math.round(product.price - recommended)
    : null
}

export function buildResult(
  product: ProductContext,
  guidance: CategoryGuidance,
  found: UsedOption[],
  context: BuyerContext,
): VerteResult {
  /* Show nothing secondhand when we are telling them to buy it new. */
  const usable = guidance.verdict === 'avoid' ? [] : found
  const ranked = rank(sameCurrency(usable, product.currency), context, guidance)
  const reason = carbonOverride(ranked.reason, guidance, product, ranked.options[0])

  return {
    product: { ...product, category: guidance.category },
    guidance,
    options: ranked.options,
    context,
    reason,
    passedOver: ranked.passedOver,
    savingsUsd: savingsFor(product, ranked.options, reason),
    /* Only claim avoided manufacturing if they have something they can
     * actually buy instead. Nothing viable, no claim. */
    co2AvoidedKg:
      ranked.options.length && !NO_CARBON_CLAIM.includes(reason)
        ? guidance.embodiedCo2Kg
        : null,
  }
}
