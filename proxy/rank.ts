/* ---------------------------------------------------------------------------
 * Context-aware ranking.  Pivot 03.  Owned by lane/proxy.
 *
 * This is the file that makes the buyer's situation change the ANSWER rather
 * than decorate it. The brief is explicit that displaying context, rewording
 * copy, or filtering a list does not count. So nothing here filters: every
 * option stays in the list. What changes is which one is first, and why.
 *
 * Without context we recommend the cheapest option.
 * With context we recommend the cheapest option they can actually use.
 * Those are frequently different listings.
 *
 * Two constraints move the decision:
 *
 *   Deadline  — a $28 listing arriving in six days is worth nothing to
 *               someone moving in on Saturday. A pricier campus pickup wins.
 *
 *   Transport — a mini-fridge two miles away cannot be collected without a
 *               car. For bulky categories, no car demotes local pickup below
 *               shipping even when it is cheaper.
 *
 * When neither bites, cheapest wins and `reason` says so plainly.
 * ------------------------------------------------------------------------- */

import type {
  BuyerContext,
  CategoryGuidance,
  RecommendationReason,
  UsedOption,
} from '../src/types'

/* The wording lives in src/reason.ts so the card can render it without
 * importing from the proxy. Re-exported here for the smoke test. */
export { explainReason } from '../src/reason'

export type RankOutcome = {
  /** Ranked, never filtered. options[0] is the recommendation. */
  options: UsedOption[]
  reason: RecommendationReason
  passedOver: { option: UsedOption; why: string } | null
}

/** The default when we know nothing: no deadline, no car. */
export const DEFAULT_CONTEXT: BuyerContext = { needInDays: null, hasCar: false }

/** Can they physically collect it? Only bulky local pickups are ever a problem. */
function reachable(o: UsedOption, ctx: BuyerContext, g: CategoryGuidance): boolean {
  if (o.source !== 'campus') return true
  if (!g.bulky) return true
  return ctx.hasCar
}

/** Will it be in their hands by the deadline? */
function inTime(o: UsedOption, ctx: BuyerContext): boolean {
  if (ctx.needInDays === null) return true
  return o.daysToHand <= ctx.needInDays
}

export function rank(
  all: UsedOption[],
  ctx: BuyerContext,
  guidance: CategoryGuidance,
): RankOutcome {
  const byPrice = [...all].sort((a, b) => a.price - b.price)

  if (byPrice.length === 0) {
    return { options: [], reason: 'cheapest', passedOver: null }
  }

  const cheapest = byPrice[0]
  const viable = byPrice.filter((o) => reachable(o, ctx, guidance) && inTime(o, ctx))

  /* Nothing works for them. Hand back the full list untouched and let the card
   * say so — §07, an app willing to argue against itself is the one you trust.
   * "Buy it new" is the honest answer here even on a safe-to-buy-used item. */
  if (viable.length === 0) {
    return { options: byPrice, reason: 'nothing-arrives-in-time', passedOver: null }
  }

  const winner = viable[0]
  const options = [winner, ...byPrice.filter((o) => o !== winner)]

  /* Context didn't bite: the cheapest was usable all along. */
  if (winner === cheapest) {
    return { options, reason: 'cheapest', passedOver: null }
  }

  /* Context demoted something cheaper. Name the constraint that did it — a
   * recommendation the buyer can't interrogate is one they won't trust. */
  const blockedByCar = !reachable(cheapest, ctx, guidance)

  const why = blockedByCar
    ? `the $${cheapest.price} listing is a ${cheapest.distanceMi} mile pickup, and this is too big to carry`
    : `the $${cheapest.price} listing takes ${cheapest.daysToHand} days and you need it in ${ctx.needInDays}`

  const reason: RecommendationReason = blockedByCar
    ? 'cheaper-option-needs-car'
    : viable.length === 1
      ? 'only-option-in-time'
      : 'cheapest-in-time'

  return { options, reason, passedOver: { option: cheapest, why } }
}
