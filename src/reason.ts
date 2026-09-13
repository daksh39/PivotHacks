/* ---------------------------------------------------------------------------
 * The words for each recommendation reason.  Pivot 03.
 *
 * Lives in src/ rather than proxy/ because the card renders it and the card
 * must never import from the proxy. proxy/rank.ts imports it from here, so
 * the logic and its explanation cannot drift apart.
 *
 * §06: never render a bare number with no explanation. After pivot 03 the
 * recommended listing is frequently not the cheapest one on the card, so the
 * sentence explaining why is load-bearing, not decoration.
 * ------------------------------------------------------------------------- */

import type { BuyerContext, RecommendationReason } from './types'

export function explainReason(reason: RecommendationReason, ctx: BuyerContext): string {
  switch (reason) {
    case 'cheapest':
      return 'Cheapest option available'
    case 'cheapest-in-time':
      return `Cheapest one that arrives within ${ctx.needInDays} days`
    case 'only-option-in-time':
      return 'The only one that arrives in time'
    case 'cheaper-option-needs-car':
      return 'A cheaper one is nearby, but it needs a car to collect'
    case 'nothing-arrives-in-time':
      /* Scope the claim. With a budget set, the honest sentence is about what
       * they can afford — there may well be something faster they cannot pay
       * for, and saying "nothing reaches you in time" would overclaim. */
      return ctx.budgetCap !== null
        ? 'Nothing you can afford arrives in time'
        : 'Nothing secondhand reaches you in time'
    case 'nothing-in-budget':
      return 'Nothing secondhand is within your budget'
  }
}
