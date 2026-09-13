/* ---------------------------------------------------------------------------
 * Building a VerteResult. The ONLY place one is constructed.
 *
 * Extracted from the request handler because an unknown category used to be a
 * 404, which made lookup() return null, which made run() unmount a card it had
 * already mounted. That is the "shows up once and then disappears" bug, and it
 * fired on 5 of 12 real product titles.
 *
 * The category supplies the verdict and the carbon figure. It does NOT supply
 * the price saving, which is the actual product — so not knowing the category
 * degrades the card, it does not destroy it.
 * ------------------------------------------------------------------------- */

import type {
  BuyerContext,
  CategoryGuidance,
  ProductContext,
  UsedOption,
  VerteResult,
} from './types'
import { rank } from './rank'

/** Guidance we can rank against even when the category is unknown. */
const NO_GUIDANCE: CategoryGuidance = {
  category: '',
  verdict: 'safe',
  checkTips: [],
  embodiedCo2Kg: 0,
  co2Source: '',
  note: '',
  bulky: false,
}

/** Amounts only ever compare like with like. */
function sameCurrency(options: UsedOption[], currency: string): UsedOption[] {
  return options.filter((option) => option.currency === currency)
}

function savingsFor(
  product: ProductContext,
  options: UsedOption[],
  reason: VerteResult['reason'],
): number | null {
  /* Nothing usable means nothing saved. A card reading "nothing is within your
   * budget" beside "save $61" is a contradiction a judge catches instantly. */
  if (reason === 'nothing-arrives-in-time' || reason === 'nothing-in-budget') return null

  const recommended = options[0]?.price ?? null
  return product.price != null && recommended != null && product.price > recommended
    ? Math.round(product.price - recommended)
    : null
}

/**
 * Always returns a result for a real product.
 *
 * It used to return null when there were no listings and no category, which
 * made the extension silently absent on a large share of pages — and silence
 * is indistinguishable from broken. "Nothing secondhand for this one" is
 * information; showing nothing is not. The card is the product's presence, so
 * it appears on every supported page without anyone clicking a toolbar icon.
 */
export function buildResult(
  product: ProductContext,
  guidance: CategoryGuidance | null,
  options: UsedOption[],
  context: BuyerContext,
): VerteResult {
  const comparable = sameCurrency(options, product.currency)

  /* Nothing secondhand to offer when we are telling them to buy it new. */
  const usable = guidance?.verdict === 'avoid' ? [] : comparable

  const ranked = rank(usable, context, guidance ?? NO_GUIDANCE)

  return {
    product: { ...product, category: guidance?.category ?? product.category },
    guidance,
    options: ranked.options,
    context,
    reason: ranked.reason,
    passedOver: ranked.passedOver,
    savingsUsd: savingsFor(product, ranked.options, ranked.reason),
    /* Only claim avoided manufacturing with a citation behind it, and only
     * when they have something they can actually buy instead. */
    co2AvoidedKg:
      guidance &&
      ranked.options.length &&
      ranked.reason !== 'nothing-arrives-in-time' &&
      ranked.reason !== 'nothing-in-budget'
        ? guidance.embodiedCo2Kg
        : null,
  }
}
