/* ---------------------------------------------------------------------------
 * THE CONTRACT.  verte-plan.md §02.
 *
 * FROZEN. Do not edit on a lane branch. Changing anything in this file is a
 * whole-team decision, committed straight to `main`, after which every lane
 * rebases. See CLAUDE.md.
 *
 * Every lane codes against these types and mocks them locally, so nobody
 * waits on anybody. Pivots change whatever PRODUCES a VerteResult, never
 * what consumes it.
 * ------------------------------------------------------------------------- */

/** What the content script scrapes off the page. */
export type ProductContext = {
  title: string
  price: number | null
  currency: string
  /** normalized slug: "mini-fridge" */
  category: string
  imageUrl: string | null
  sourceUrl: string
}

/** One secondhand option, from any source. */
export type UsedOption = {
  source: 'ebay' | 'campus'
  title: string
  price: number
  url: string
  imageUrl: string | null
  condition: string
  /** campus listings only */
  distanceMi?: number
}

/** What we know about buying this category used. */
export type CategoryGuidance = {
  category: string
  verdict: 'safe' | 'check' | 'avoid'
  checkTips: string[]
  /** estimate — carries a source */
  embodiedCo2Kg: number
  co2Source: string
  note: string
}

/** The one object the UI renders. Nothing else reaches a component. */
export type VerteResult = {
  product: ProductContext
  guidance: CategoryGuidance
  options: UsedOption[]
  savingsUsd: number | null
  co2AvoidedKg: number | null
}

/* --- message passing: content script <-> service worker ------------------ */

export type LookupRequest = { type: 'VERTE_LOOKUP'; product: ProductContext }

export type LookupResponse =
  | { ok: true; result: VerteResult }
  | { ok: false; error: string }
