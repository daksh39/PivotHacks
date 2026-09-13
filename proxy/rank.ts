/**
 * Context-aware ranking.
 *
 * This is the part that makes the buyer's situation change the answer rather
 * than decorate it. Without context we recommend the cheapest option. With
 * context we recommend the cheapest option they can actually use, which is
 * frequently not the same listing.
 *
 * Two things move the decision:
 *
 *   Deadline. A $34 listing that arrives in six days is worthless to someone
 *   moving in on Saturday. A pricier campus pickup wins.
 *
 *   Transport. A mini-fridge four miles away cannot be collected without a
 *   car. For bulky categories, no car demotes local pickup below shipping.
 *
 * When neither applies, cheapest wins and `reason` says so honestly.
 */

import type {
  BuyerContext,
  CategoryGuidance,
  RecommendationReason,
  UsedOption,
} from "../src/types";

export type RankOutcome = {
  options: UsedOption[];
  reason: RecommendationReason;
  passedOver: { option: UsedOption; why: string } | null;
};

const byPrice = (a: UsedOption, b: UsedOption) => a.price - b.price;

/** Can they physically collect this one? */
function reachable(o: UsedOption, ctx: BuyerContext, g: CategoryGuidance): boolean {
  if (o.source !== "campus") return true;
  if (!g.bulky) return true;
  return ctx.hasCar;
}

/** Will it be in their hands by the deadline? */
function inTime(o: UsedOption, ctx: BuyerContext): boolean {
  if (ctx.needInDays === null) return true;
  return o.daysToHand <= ctx.needInDays;
}

export function rank(
  all: UsedOption[],
  ctx: BuyerContext,
  guidance: CategoryGuidance
): RankOutcome {
  const sorted = [...all].sort(byPrice);

  if (sorted.length === 0) {
    return { options: [], reason: "cheapest", passedOver: null };
  }

  const cheapest = sorted[0];
  const viable = sorted.filter((o) => reachable(o, ctx, guidance) && inTime(o, ctx));

  // Nothing works. Return the list untouched so the card can say so plainly
  // and fall back to recommending a new purchase.
  if (viable.length === 0) {
    return { options: sorted, reason: "nothing-arrives-in-time", passedOver: null };
  }

  const winner = viable[0];
  const rest = sorted.filter((o) => o !== winner);
  const options = [winner, ...rest];

  // The cheapest option was also viable, so context changed nothing.
  if (winner === cheapest) {
    return { options, reason: "cheapest", passedOver: null };
  }

  // Context demoted something cheaper. Say which constraint did it.
  const blockedByCar = !reachable(cheapest, ctx, guidance);
  const saved = cheapest.price - winner.price; // negative, they pay more

  const why = blockedByCar
    ? `$${cheapest.price} option is a ${cheapest.distanceMi ?? "?"} mile pickup and this category needs a car`
    : `$${cheapest.price} option takes ${cheapest.daysToHand} days and you need it in ${ctx.needInDays}`;

  const reason: RecommendationReason = blockedByCar
    ? "cheaper-option-needs-car"
    : viable.length === 1
      ? "only-option-in-time"
      : "cheapest-in-time";

  void saved;

  return { options, reason, passedOver: { option: cheapest, why } };
}

/** Card copy for each outcome. Kept next to the logic so they cannot drift. */
export function explain(reason: RecommendationReason, ctx: BuyerContext): string {
  switch (reason) {
    case "cheapest":
      return "Cheapest option available";
    case "cheapest-in-time":
      return `Cheapest option that arrives within ${ctx.needInDays} days`;
    case "only-option-in-time":
      return "The only option that arrives in time";
    case "cheaper-option-needs-car":
      return "A cheaper one exists nearby, but it needs a car to collect";
    case "nothing-arrives-in-time":
      return "Nothing secondhand arrives in time, so buying new is the honest answer here";
  }
}
