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
};

/** The one object the UI renders. */
export type VerteResult = {
  product: ProductContext;
  guidance: CategoryGuidance;
  options: UsedOption[];
  savingsUsd: number | null;
  co2AvoidedKg: number | null;
};

/** Request body for POST /lookup. */
export type LookupRequest = {
  product: ProductContext;
};

/**
 * Response from POST /lookup.
 * `ok: false` is a normal outcome, not an exception. The card renders an
 * empty state from it rather than disappearing.
 */
export type LookupResponse =
  | { ok: true; result: VerteResult }
  | { ok: false; reason: "not-a-product" | "no-category" | "no-listings" | "error" };
