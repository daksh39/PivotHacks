/* ---------------------------------------------------------------------------
 * Carbon figures.  verte-plan.md §09.
 *
 * The rule: we display a figure only with a citation behind it. That used to
 * be a convention in a comment. `isSourced()` makes it executable — a category
 * whose co2Source is still a placeholder renders no carbon claim at all,
 * rather than a confident number nobody can defend.
 *
 * "The first question a good judge asks is where 46 kg came from, and having
 * an answer is worth more than having a bigger number."
 * ------------------------------------------------------------------------- */

import type { CarbonCase } from './types'

/**
 * US EPA: a typical passenger vehicle emits about 400 g CO2 per mile
 * (8,887 g per gallon at 22.2 mpg).
 *
 * The previous value here was 0.256, which understated it by about a third
 * and inflated every "miles driven" figure we put on screen.
 */
export const KG_CO2_PER_MILE_DRIVEN = 0.4
export const KG_CO2_PER_MILE_SOURCE =
  'US EPA, Greenhouse Gas Emissions from a Typical Passenger Vehicle'
export const KG_CO2_PER_MILE_URL =
  'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle'

/** Markers left in the data for figures nobody has sourced yet. */
const UNSOURCED = /^\s*$|placeholder|todo|tbd|to source/i

/**
 * Whether a co2Source is a real reference rather than a leftover marker.
 * Callers use this to decide whether to show the figure at all.
 */
export function isSourced(source: string | null | undefined): boolean {
  if (!source) return false
  return !UNSOURCED.test(source)
}

/** Rounded to the nearest ten: we display "~120 miles", never "115.3". */
export function milesDrivenEquivalent(kgCo2: number): number {
  return Math.round(kgCo2 / KG_CO2_PER_MILE_DRIVEN / 10) * 10
}

/** The tilde stays. "~46 kg CO₂e" is honest; "46.2 kg" is a claim we can't support. */
export function formatCo2(kgCo2: number): string {
  return `~${Math.round(kgCo2)} kg CO₂e`
}

export function formatUsd(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/* --- how much buying used here actually matters -------------------------- */

/**
 * How much carbon buying this category used actually avoids.
 *
 * The thesis is that buying secondhand matters. It does not matter equally:
 * a used laptop avoids about 122 kg of manufacturing, a used paperback under
 * three. Treating those as the same story is how a sustainability pitch stops
 * being believed — so this bands the cited figure, and the band decides
 * whether Verte pushes towards used at all (see assemble.ts).
 *
 * The bands are OUR banding of published figures, not an external standard,
 * and they are anchored to the one equivalence already cited above: EPA's
 * 0.4 kg CO2e per mile driven.
 *
 *   high      >= 100 kg   — 250+ miles of driving. Worth going out of your way.
 *   moderate   25-99 kg   —  60+ miles. Worth it if the price is right.
 *   low         < 25 kg   — under 60 miles. Saves money, not much carbon.
 *   unknown      no cited figure — we say nothing rather than guess (§09).
 */
export type CarbonPayoff = 'high' | 'moderate' | 'low' | 'unknown'

export const PAYOFF_HIGH_KG = 100
export const PAYOFF_MODERATE_KG = 25

/**
 * Where a category with no measured figure lands.
 *
 * This is a statement about WHERE the emissions sit, not how many there are,
 * so it needs no per-product citation — and the basis for the strongest claim
 * is the two documents we already cite: Dell puts 67.7% of that monitor's
 * lifetime emissions in manufacturing, Apple 76% of that laptop's. That
 * pattern is what "manufacturing" means here.
 */
const CASE_PAYOFF: Record<CarbonCase, CarbonPayoff> = {
  manufacturing: 'high',
  materials: 'moderate',
  minimal: 'low',
  /* Nothing to claim. A used sponge is not a sustainability story. */
  consumable: 'unknown',
}

export function carbonPayoff(
  guidance:
    | { embodiedCo2Kg: number; co2Source: string; carbonCase?: CarbonCase }
    | null
    | undefined,
): CarbonPayoff {
  if (!guidance) return 'unknown'

  /* A measured figure always wins. */
  if (isSourced(guidance.co2Source) && guidance.embodiedCo2Kg > 0) {
    if (guidance.embodiedCo2Kg >= PAYOFF_HIGH_KG) return 'high'
    if (guidance.embodiedCo2Kg >= PAYOFF_MODERATE_KG) return 'moderate'
    return 'low'
  }

  return guidance.carbonCase ? CASE_PAYOFF[guidance.carbonCase] : 'unknown'
}

/**
 * The qualitative claim, for the categories with no measured figure — which is
 * most of them, and always will be. True by construction, so it never
 * overstates and never needs a number to stand up.
 */
export function carbonCaseLine(c: CarbonCase): string | null {
  switch (c) {
    case 'manufacturing':
      return 'Almost all of the emissions happen before you switch it on. Buying one that already exists skips them.'
    case 'materials':
      return 'The footprint is the material and the making. Using it emits nothing, and it outlasts several owners.'
    case 'minimal':
      return 'Small and light, so the footprint is small either way. Buy it used to save money, not the planet.'
    case 'consumable':
      return null
  }
}

/**
 * What the qualitative claim rests on, shown where we make the strongest
 * version of it. Both documents are already cited elsewhere on their own
 * categories, so this is checkable rather than assertion.
 */
export const MANUFACTURING_BASIS =
  'Basis: manufacturer footprint reports put production at most of lifetime emissions — Dell S2421HS 67.7%, Apple MacBook Air 76%.'

/** The band across the top of the card. Null when we have nothing to claim. */
export function payoffHeadline(payoff: CarbonPayoff): string | null {
  switch (payoff) {
    case 'high':
      return 'High impact — worth buying used'
    case 'moderate':
      return 'Worth buying used'
    case 'low':
      return 'Low impact either way'
    case 'unknown':
      return null
  }
}

/**
 * What the number MEANS for the decision. §06 forbids a bare figure with no
 * framing, and this is the framing.
 */
export function payoffMeaning(payoff: CarbonPayoff): string | null {
  switch (payoff) {
    case 'high':
      return 'Making one of these is the expensive part. Buying it used skips nearly all of that.'
    case 'moderate':
      return 'A real saving in emissions, if the price and timing work for you.'
    case 'low':
      return 'Buying this used saves money more than it saves carbon. No pressure either way.'
    case 'unknown':
      return null
  }
}

/**
 * The honest catch, where lifetime emissions are mostly electricity rather
 * than manufacturing: an old, inefficient secondhand unit can burn more carbon
 * in a year of running than was ever saved by not building a new one. We would
 * rather say this than not, even though it undercuts the pitch.
 */
export const USE_DOMINANT_WARNING =
  'Most of a fridge\u2019s lifetime emissions come from running it, not making it. Check the energy rating — an old one can cost more to run than it saved to skip.'
