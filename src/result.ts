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

/**
 * Reasons that mean "there is nothing here they can actually buy".
 *
 * A card reading "nothing arrives in time" beside "save $61" is a
 * contradiction a judge catches in the first ten seconds — and the same is
 * true of a saving on something over their budget.
 */
const NOTHING_USABLE: VerteResult['reason'][] = ['nothing-arrives-in-time', 'nothing-in-budget']

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

  return {
    product: { ...product, category: guidance.category },
    guidance,
    options: ranked.options,
    context,
    reason: ranked.reason,
    passedOver: ranked.passedOver,
    savingsUsd: savingsFor(product, ranked.options, ranked.reason),
    /* Only claim avoided manufacturing if they have something they can
     * actually buy instead. Nothing viable, no claim. */
    co2AvoidedKg:
      ranked.options.length && !NOTHING_USABLE.includes(ranked.reason)
        ? guidance.embodiedCo2Kg
        : null,
  }
}
