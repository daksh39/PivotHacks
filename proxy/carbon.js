/* ---------------------------------------------------------------------------
 * Carbon presentation. BUILD_PLAN.md §09.
 *
 * A figure is shown ONLY when the knowledge base names a real source. An
 * uncited category renders no carbon claim at all rather than a number we
 * can't defend — that's the difference between rigor and getting taken apart
 * in Q&A.
 * ------------------------------------------------------------------------- */

// US EPA, "Greenhouse Gas Emissions from a Typical Passenger Vehicle":
// 400 g CO2e per mile for the average passenger vehicle.
const KG_CO2_PER_MILE = 0.4;
const MILES_SOURCE = 'US EPA, Greenhouse Gas Emissions from a Typical Passenger Vehicle';

/** A claim is only a claim if it carries a citation. */
function isSourced(guidance) {
  return Boolean(guidance && guidance.embodiedCo2Kg > 0 && guidance.co2Source);
}

/** "~46 kg CO₂e" — the tilde stays. Null when we can't cite it. */
function formatCo2(kg) {
  if (!kg || kg <= 0) return null;
  return `~${Math.round(kg)} kg CO₂e`;
}

/** "about 180 miles driven". Null when there's nothing to convert. */
function milesEquivalent(kg) {
  if (!kg || kg <= 0) return null;
  return `about ${Math.round(kg / KG_CO2_PER_MILE / 10) * 10} miles driven`;
}

module.exports = { isSourced, formatCo2, milesEquivalent, KG_CO2_PER_MILE, MILES_SOURCE };
