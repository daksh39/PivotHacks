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
