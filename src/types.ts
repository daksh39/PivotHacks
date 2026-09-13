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

/** Where a secondhand listing came from. Both are read from the retailer's
 * own page or its own frontend API, same-origin, with no credential. */
export type ListingSource = 'amazon' | 'bestbuy'

/** One secondhand option, from any source. */
export type UsedOption = {
  source: ListingSource
  title: string
  price: number
  /**
   * ISO code for `price`. Carried explicitly because a browser in Canada gets
   * CAD off amazon.ca while eBay may quote USD — subtracting one from the
   * other produces a confidently wrong "saving".
   */
  currency: string
  url: string
  imageUrl: string | null
  condition: string
  /** Collected in person rather than shipped. Set only when the source says
   * so — never inferred. Drives the bulky/no-car demotion in proxy/rank.ts. */
  pickup?: boolean
  /** Distance to a pickup location, when the source reports one. */
  distanceMi?: number
  /**
   * Days until it is physically in their hands. Campus pickup is 0–1, eBay is
   * the shipping estimate. This is what lets a deadline outrank price.
   */
  daysToHand: number
}

/* --- pivot 03: the buyer's situation changes the answer ------------------- */

/**
 * The situational context. This does not filter the list or relabel it — it
 * decides WHICH option we recommend. See proxy/rank.ts.
 */
export type BuyerContext = {
  /** Days from now they actually need it. null = no deadline. */
  needInDays: number | null
  /** Without a car, a bulky item four miles away is not really available. */
  hasCar: boolean
  /**
   * The most they can spend, in the product's own currency. null = no ceiling.
   * The one context rule backed by data we actually measure today.
   */
  budgetCap: number | null
}

/** Why options[0] won. The card says this in words. */
export type RecommendationReason =
  | 'cheapest'
  | 'cheapest-in-time'
  | 'only-option-in-time'
  | 'cheaper-option-needs-car'
  | 'nothing-arrives-in-time'
  | 'nothing-in-budget'
  /**
   * The category barely costs anything to make and the saving is small, so
   * buying used here is not worth the effort. Verte says that plainly rather
   * than manufacturing a reason to care.
   */
  | 'low-carbon-payoff'

/** What we know about buying this category used. */
export type CategoryGuidance = {
  category: string
  verdict: 'safe' | 'check' | 'avoid'
  checkTips: string[]
  /**
   * Manufacturing emissions avoided by not buying this new, in kg CO2e.
   *
   * This is the number the whole product now turns on, not a footnote under
   * the price: it decides whether Verte pushes towards used at all. 0 means
   * nobody has sourced a figure, and an unsourced category makes no claim and
   * no push — see carbonPayoff() in src/carbon.ts.
   */
  embodiedCo2Kg: number
  co2Source: string
  note: string
  /** Needs a car to collect. Drives the no-car demotion in proxy/rank.ts. */
  bulky: boolean
  /**
   * True where LIFETIME emissions are dominated by running the thing, not by
   * making it — a fridge is the clear case. Buying those used can be a carbon
   * LOSS if the secondhand one is old and inefficient, so Verte says so
   * instead of cheering. Set only where a source supports it.
   */
  useDominant: boolean
}

/** The one object the UI renders. Nothing else reaches a component. */
export type VerteResult = {
  product: ProductContext
  guidance: CategoryGuidance
  /** RANKED. options[0] is the recommendation, not merely the cheapest. */
  options: UsedOption[]
  /** The context that produced this ranking. */
  context: BuyerContext
  /** Why options[0] won. */
  reason: RecommendationReason
  /**
   * Set only when context demoted something cheaper, so the card can show
   * what was given up and why. Null when the cheapest option simply won.
   */
  passedOver: { option: UsedOption; why: string } | null
  savingsUsd: number | null
  co2AvoidedKg: number | null
}

/* --- message passing: content script <-> service worker ------------------ */

export type LookupRequest = {
  type: 'VERTE_LOOKUP'
  product: ProductContext
  context: BuyerContext
  /**
   * Listings the content script read off the retailer's own page or frontend
   * API. They travel with the request because both sources are same-origin
   * reads that only the content script can perform — the proxy could not
   * fetch them if it wanted to.
   */
  options: UsedOption[]
}

export type LookupResponse =
  | { ok: true; result: VerteResult }
  | { ok: false; error: string }
