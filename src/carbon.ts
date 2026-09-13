/* ---------------------------------------------------------------------------
 * The miles-driven equivalence (verte-plan.md §09).
 *
 * "Cite the driving conversion too. The miles-driven equivalence needs a
 * per-mile figure with a source behind it."
 *
 * Owned by lane/demo. The figure below is a PLACEHOLDER and MUST be replaced
 * with a sourced value before anything ships. Do not invent a citation — a
 * defensible number beats an impressive one.
 * ------------------------------------------------------------------------- */

export const KG_CO2_PER_MILE_DRIVEN = 0.256
export const KG_CO2_PER_MILE_SOURCE = 'PLACEHOLDER — lane/demo to source'

/** Rounded to the nearest ten: we display "~180 miles", never "179.7". */
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
