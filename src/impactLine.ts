/* ---------------------------------------------------------------------------
 * The environmental claim on the card.
 *
 * Two kinds of claim, and the distinction is the whole point:
 *
 *   Quantified — only where a published figure exists, shown with its source.
 *                Two categories today (Dell's monitor PCF, Apple's laptop PER).
 *
 *   Qualitative — everywhere else. Buying the one that already exists means
 *                one fewer gets manufactured. That is true of every product,
 *                requires no citation, and is the argument the whole project
 *                rests on.
 *
 * Before this existed, a card with no cited figure carried no environmental
 * content whatsoever — and since an unclassified product is now a normal
 * outcome, that was most cards. Verte had quietly become a price comparison
 * tool with a green colour scheme.
 * ------------------------------------------------------------------------- */

import { formatCo2, isSourced, milesDrivenEquivalent } from './carbon'
import type { VerteResult } from './types'

export type ImpactLine = {
  headline: string
  /** The citation, when the claim is numeric. Null for the qualitative one. */
  source: string | null
}

/** Null when there is genuinely nothing to claim. */
export function impactLine(result: VerteResult): ImpactLine | null {
  const { guidance, options, reason, co2AvoidedKg } = result

  /* Telling them to buy new is the one case with no environmental case to
   * make, and pretending otherwise would be dishonest. */
  if (guidance?.verdict === 'avoid') return null
  if (reason === 'nothing-arrives-in-time' || reason === 'nothing-in-budget') return null

  /* Nothing listed today. Still true, still the thesis, and this is now the
   * most common card — leaving it silent is how the product stopped looking
   * like a sustainability tool. */
  if (!options.length) {
    return {
      headline: 'The greenest one is the one that already exists — worth checking back',
      source: null,
    }
  }

  if (co2AvoidedKg && co2AvoidedKg > 0 && isSourced(guidance?.co2Source)) {
    return {
      /* A comparison, not an abstraction. "Avoids 322 kg of manufacturing"
       * invites "compared with what?"; this answers it. */
      headline: `${formatCo2(co2AvoidedKg)} less than buying this new — about ${milesDrivenEquivalent(
        co2AvoidedKg,
      )} miles driven`,
      source: guidance?.co2Source ?? null,
    }
  }

  /* True by construction, so it needs no source and never overstates. */
  return {
    headline: 'Buying this one means one fewer gets manufactured',
    source: null,
  }
}
