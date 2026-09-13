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
  GreenerOption,
  ProductContext,
  UsedOption,
  VerteResult,
} from './types'
import { rank } from './rank'
import { carbonPayoff } from './carbon'

/** Guidance we can rank against even when the category is unknown. */
const NO_GUIDANCE: CategoryGuidance = {
  category: '',
  verdict: 'safe',
  checkTips: [],
  embodiedCo2Kg: 0,
  co2Source: '',
  note: '',
  bulky: false,
  useDominant: false,
}

/** Amounts only ever compare like with like. */
function sameCurrency(options: UsedOption[], currency: string): UsedOption[] {
  return options.filter((option) => option.currency === currency)
}

/**
 * Below this share of the new price, a saving is not worth a stranger, a
 * pickup and a risk — so on a category that barely costs anything to make,
 * Verte stops selling.
 */
const SMALL_SAVING_SHARE = 0.15

/**
 * Carbon deciding the recommendation, not decorating it.
 *
 * The thesis is that buying used matters. On a paperback it does not much —
 * about 3 kg of manufacturing against 122 for a laptop — and pretending those
 * are the same story is how the whole pitch stops being believed. So where the
 * carbon payoff is low AND the money saved is small, the recommendation flips
 * and Verte says buying new is fine.
 *
 * Only ever overrides the "we found you something" reasons. If nothing arrives
 * in time or nothing is affordable, that is already the more important answer.
 */
function carbonOverride(
  reason: VerteResult['reason'],
  guidance: CategoryGuidance | null,
  product: ProductContext,
  recommended: UsedOption | undefined,
): VerteResult['reason'] {
  if (reason === 'nothing-arrives-in-time' || reason === 'nothing-in-budget') return reason
  if (!recommended || carbonPayoff(guidance) !== 'low') return reason
  if (product.price == null) return reason

  const saved = product.price - recommended.price
  return saved < product.price * SMALL_SAVING_SHARE ? 'low-carbon-payoff' : reason
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
  greener: GreenerOption[] = [],
): VerteResult {
  const comparable = sameCurrency(options, product.currency)

  /* Nothing secondhand to offer when we are telling them to buy it new. */
  const usable = guidance?.verdict === 'avoid' ? [] : comparable

  const ranked = rank(usable, context, guidance ?? NO_GUIDANCE)
  const reason = carbonOverride(ranked.reason, guidance, product, ranked.options[0])

  return {
    product: { ...product, category: guidance?.category ?? product.category },
    guidance,
    options: ranked.options,
    context,
    reason,
    passedOver: ranked.passedOver,
    /* The saving stays even when we advise buying new — the card needs it to
     * show how small it is. "You would save $3" is the argument. */
    savingsUsd: savingsFor(product, ranked.options, reason),
    /* Only claim avoided manufacturing with a citation behind it, and only
     * when they have something they can actually buy instead. */
    /* No carbon claim for a purchase we just advised against, either. */
    co2AvoidedKg:
      guidance &&
      ranked.options.length &&
      reason !== 'nothing-arrives-in-time' &&
      reason !== 'nothing-in-budget' &&
      reason !== 'low-carbon-payoff'
        ? guidance.embodiedCo2Kg
        : null,
    /* The ladder. A newly manufactured product is offered ONLY when nothing
     * that already exists is available — buying new is always the weaker
     * answer, and presenting the two side by side would quietly undo that. */
    greener: ranked.options.length ? [] : greener,
  }
}
