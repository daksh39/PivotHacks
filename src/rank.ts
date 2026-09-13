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
} from './types'

/* The wording lives in src/reason.ts so the card can render it without
 * importing from the proxy. Re-exported here for the smoke test. */
export { explainReason } from './reason'

export type RankOutcome = {
  /** Ranked, never filtered. options[0] is the recommendation. */
  options: UsedOption[]
  reason: RecommendationReason
  passedOver: { option: UsedOption; why: string } | null
}

/** The default when we know nothing: no deadline, no car. */
export const DEFAULT_CONTEXT: BuyerContext = {
  needInDays: null,
  hasCar: false,
  budgetCap: null,
}

/** Can they physically collect it? Only bulky local pickups are ever a problem. */
function reachable(o: UsedOption, ctx: BuyerContext, g: CategoryGuidance): boolean {
  /* Only collection-in-person can be blocked by not having a car. `pickup` is
   * set only when a source actually says so, never inferred — so today this
   * returns true for everything and the rule sits dormant rather than firing
   * on a guess. */
  if (!o.pickup) return true
  if (!g.bulky) return true
  return ctx.hasCar
}

/** Amounts in copy carry their currency. "24 over your budget" is ambiguous. */
function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount}`
  }
}

/** Can they actually pay for it? A ceiling is inclusive — $174 fits a $174 cap. */
function affordable(o: UsedOption, ctx: BuyerContext): boolean {
  if (ctx.budgetCap === null) return true
  return o.price <= ctx.budgetCap
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

  /* Budget is checked first and separately. Being unable to pay for something
   * is a different answer from it arriving late: "nothing you can afford" is
   * actionable, "nothing arrives in time" is not the same advice. */
  const withinBudget = byPrice.filter((o) => affordable(o, ctx))

  if (!withinBudget.length) {
    const over = money(Math.ceil(cheapest.price - (ctx.budgetCap ?? 0)), cheapest.currency)
    return {
      /* Every listing stays on the card. Hiding them would conceal that a
       * secondhand market exists at all — they are shown, marked over budget. */
      options: byPrice,
      reason: 'nothing-in-budget',
      passedOver: {
        option: cheapest,
        why: `the cheapest one is ${over} over your budget`,
      },
    }
  }

  const viable = withinBudget.filter((o) => reachable(o, ctx, guidance) && inTime(o, ctx))

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

  /* The card already prints the price right before this clause, so don't
   * repeat it — "Skipped $28 on eBay — $28 option takes 6 days" reads badly. */
  const why = blockedByCar
    ? `it's a ${cheapest.distanceMi} mile pickup and this is too big to carry`
    : `it takes ${cheapest.daysToHand} days to arrive and you need it in ${ctx.needInDays}`
  /* Deliberately no price in this string: the card prints the figure itself,
   * in the listing's own currency, immediately before this clause. */

  const reason: RecommendationReason = blockedByCar
    ? 'cheaper-option-needs-car'
    : viable.length === 1
      ? 'only-option-in-time'
      : 'cheapest-in-time'

  return { options, reason, passedOver: { option: cheapest, why } }
}
