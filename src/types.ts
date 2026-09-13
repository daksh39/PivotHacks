/**
 * Shared types. Everything is built against these.
 *
 * The UI renders from a single VerteResult and nothing else. If a pivot
 * lands, change what produces a VerteResult, not what consumes it.
 */

/** What the content script scrapes off the page. */
export type ProductContext = {
  title: string;
  price: number | null;
  currency: string;
  /** Normalized slug, e.g. "mini-fridge". See proxy/categories.ts */
  category: string;
  imageUrl: string | null;
  sourceUrl: string;
};

export type UsedOptionSource = "ebay" | "campus";

/** One secondhand option, from any source. */
export type UsedOption = {
  source: UsedOptionSource;
  title: string;
  price: number;
  url: string;
  imageUrl: string | null;
  condition: string;
  /** Campus listings only. */
  distanceMi?: number;
  /**
   * Days until the buyer can physically have it.
   * Campus pickup is 0 or 1. eBay is the shipping estimate.
   * This is what makes urgency able to change the ranking.
   */
  daysToHand: number;
};

/**
 * The buyer's situation. This changes which option we recommend, not just
 * how the list is labelled.
 */
export type BuyerContext = {
  /** Days from now the item is actually needed. null means no deadline. */
  needInDays: number | null;
  /** Without a car, bulky items cannot realistically be collected. */
  hasCar: boolean;
};

/** safe: buy it used. check: buy used but inspect first. avoid: buy new. */
export type Verdict = "safe" | "check" | "avoid";

/** What we know about buying this category secondhand. */
export type CategoryGuidance = {
  category: string;
  verdict: Verdict;
  checkTips: string[];
  /** Estimate only. Always displayed with a tilde and paired with co2Source. */
  embodiedCo2Kg: number;
  co2Source: string;
  note: string;
  /** Needs a car to collect. Drives the no-car penalty on local pickup. */
  bulky: boolean;
};

/** Why this option was recommended over the cheaper one. */
export type RecommendationReason =
  | "cheapest"
  | "cheapest-in-time"
  | "only-option-in-time"
  | "cheaper-option-needs-car"
  | "nothing-arrives-in-time";

/** The one object the UI renders. */
export type VerteResult = {
  product: ProductContext;
  guidance: CategoryGuidance;
  /** Ranked. options[0] is the recommendation. */
  options: UsedOption[];
  /** The context that produced this ranking. */
  context: BuyerContext;
  /** Why options[0] won. The card states this in words. */
  reason: RecommendationReason;
  /**
   * Set when context demoted a cheaper option, so the card can show what
   * was given up and why. Null when the cheapest option simply won.
   */
  passedOver: { option: UsedOption; why: string } | null;
  savingsUsd: number | null;
  co2AvoidedKg: number | null;
};

/** Request body for POST /lookup. */
export type LookupRequest = {
  product: ProductContext;
  context: BuyerContext;
};

/**
 * Response from POST /lookup.
 * `ok: false` is a normal outcome, not an exception. The card renders an
 * empty state from it rather than disappearing.
 */
export type LookupResponse =
  | { ok: true; result: VerteResult }
  | { ok: false; reason: "not-a-product" | "no-category" | "no-listings" | "error" };
