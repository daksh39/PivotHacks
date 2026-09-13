/* ---------------------------------------------------------------------------
 * The category knowledge base.  Layer 3 (verte-plan.md §03).  Owned by
 * lane/snowflake.
 *
 * ┌─ THE SEAM ────────────────────────────────────────────────────────────┐
 * │ This exported signature is FROZEN. lane/snowflake owns the body of    │
 * │ this file and data/*.sql. lane/proxy only ever CALLS it and never     │
 * │ opens this file. That is the whole reason neither branch conflicts.   │
 * │                                                                       │
 * │   getCategoryGuidance(slug) : Promise<CategoryGuidance | null>        │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Returning null means "no card at all" — proxy/index.ts answers 404 and the
 * extension renders nothing. A wrong verdict is far worse than no verdict, so
 * every slug proxy/categories.ts can emit MUST have a row here. The test
 * beside this file fails if one goes missing.
 *
 * SEED below mirrors data/category-guidance.sql, which is the source of truth.
 * It exists so the proxy runs green with no Snowflake account; replace the
 * body of getCategoryGuidance with a real query, do not change the signature.
 *
 * Queries go through this proxy, never from the extension (§03).
 * ------------------------------------------------------------------------- */

import type { CategoryGuidance } from '../src/types'

/* --- seed: mirrors data/category-guidance.sql ----------------------------
 * §07 is the source of truth for verdicts and tips.
 *
 * A category carries a carbon figure ONLY when co2Source names a real
 * reference. Where no defensible source was found, embodiedCo2Kg is 0 and
 * co2Source is empty — isSourced() then suppresses the claim entirely rather
 * than printing a number we cannot stand behind (§09).
 *
 * `bulky` means "needs a car to collect" and drives the no-car demotion in
 * proxy/rank.ts. A bike is not bulky: you ride it home.
 * ----------------------------------------------------------------------- */

const SEED: Record<string, CategoryGuidance> = {
  /* --- safe -------------------------------------------------------------- */
  desk: {
    category: 'desk',
    verdict: 'safe',
    checkTips: [
      'Check the drawer runners slide cleanly.',
      "Make sure it isn't particleboard that has been wet.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Ideal used. Solid wood outlives several owners.',
    bulky: true,
  },
  bookshelf: {
    category: 'bookshelf',
    verdict: 'safe',
    checkTips: [
      'Check the shelves have not bowed.',
      "Make sure it isn't particleboard that has been wet.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Ideal used.',
    bulky: true,
  },
  dresser: {
    category: 'dresser',
    verdict: 'safe',
    checkTips: [
      'Check the drawer runners slide cleanly.',
      'Look underneath for water damage.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Ideal used.',
    bulky: true,
  },
  'mini-fridge': {
    category: 'mini-fridge',
    verdict: 'safe',
    checkTips: [
      'Check the door seal for cracks or gaps.',
      'Confirm it cools within an hour of plugging in.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Compressor appliances last well. Buying used avoids nearly all of the footprint.',
    bulky: true,
  },
  microwave: {
    category: 'microwave',
    verdict: 'safe',
    checkTips: [
      'Check the door latch closes firmly.',
      'Make sure the interior is not scorched or rusted.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Simple machines. Little to go wrong.',
    bulky: true,
  },
  /* SOURCED. Dell publishes a per-product carbon footprint datasheet for the
   * S2421HS 24" monitor: 476 kg CO2e over the full life cycle, of which
   * manufacturing is 67.7% -> ~322 kg. Displays are the strongest case Verte
   * has: the footprint is overwhelmingly in the making, not the using. */
  monitor: {
    category: 'monitor',
    verdict: 'safe',
    checkTips: [
      'Show a white image and look for dead pixels.',
      'Check the corners for backlight bleed in a dark room.',
      'Confirm which cables are included.',
    ],
    embodiedCo2Kg: 322,
    co2Source: 'Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing',
    note: "Most of a display's footprint is in the making of it, so a used one avoids nearly all of it.",
    bulky: false,
  },
  textbook: {
    category: 'textbook',
    verdict: 'safe',
    checkTips: [
      'Confirm the edition matches the syllabus.',
      'The previous edition is often fine — ask first.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Always buy used. Always.',
    bulky: false,
  },
  cookware: {
    category: 'cookware',
    verdict: 'safe',
    checkTips: [
      'Effectively indestructible.',
      'Rust on cast iron is cosmetic and scrubs off.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Cast iron and stainless outlive their owners.',
    bulky: false,
  },
  bike: {
    category: 'bike',
    verdict: 'safe',
    checkTips: [
      'Check the frame for cracks near the welds.',
      'Chain, brakes and tyres are cheap to replace.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Frame is what matters. Everything else is a consumable.',
    bulky: false,
  },
  'storage-bin': {
    category: 'storage-bin',
    verdict: 'safe',
    checkTips: ['No meaningful risk.'],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Never buy these new.',
    bulky: false,
  },
  'drying-rack': {
    category: 'drying-rack',
    verdict: 'safe',
    checkTips: ['No meaningful risk.'],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Nothing to go wrong. Always worth checking used first.',
    bulky: true,
  },
  fan: {
    category: 'fan',
    verdict: 'safe',
    checkTips: [
      'No meaningful risk.',
      'Check it spins freely and is not noisy.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Never buy these new.',
    bulky: false,
  },

  /* --- check ------------------------------------------------------------- */
  /* SOURCED. Apple's Product Environmental Report for the 13-inch MacBook Air
   * puts life-cycle emissions at ~161 kg CO2e with 76% from production. */
  laptop: {
    category: 'laptop',
    verdict: 'check',
    checkTips: [
      'Ask for the battery cycle count.',
      'Confirm it powers on and gets past the setup screen.',
      'Check it is not activation locked to the previous owner.',
    ],
    embodiedCo2Kg: 122,
    co2Source: 'Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production',
    note: "Production dominates a laptop's footprint. Activation lock is the one thing that makes a cheap one worthless.",
    bulky: false,
  },
  'desk-chair': {
    category: 'desk-chair',
    verdict: 'check',
    checkTips: [
      'Test the gas cylinder — if it sinks under your weight that is a real repair.',
      'Check the casters roll.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'A good used chair beats a cheap new one, if the cylinder holds.',
    bulky: true,
  },
  blender: {
    category: 'blender',
    verdict: 'check',
    checkTips: [
      'Inspect the seals and gaskets.',
      'Limescale is fine; cracked plastic is not.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Check the jug, not the motor.',
    bulky: false,
  },
  kettle: {
    category: 'kettle',
    verdict: 'check',
    checkTips: [
      'Inspect the seals and the base contacts.',
      'Limescale is fine; cracked plastic is not.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Cheap to replace, so only buy used if it is nearby.',
    bulky: false,
  },
  headphones: {
    category: 'headphones',
    verdict: 'check',
    checkTips: [
      'Budget for replacement ear pads.',
      'Check both drivers work before you pay.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Hygiene is the only real issue, and pads are replaceable.',
    bulky: false,
  },
  'winter-coat': {
    category: 'winter-coat',
    verdict: 'check',
    checkTips: [
      'Check the zips run cleanly.',
      'Check the insulation still lofts after a shake.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Great value used. Clothing has a heavier footprint than people expect.',
    bulky: false,
  },

  /* --- buy new ----------------------------------------------------------- */
  mattress: {
    category: 'mattress',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Hygiene and pest risk, and compression is permanent. Buy this one new.',
    bulky: true,
  },
  pillow: {
    category: 'pillow',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Same reasoning as a mattress, and cheap enough that it does not sting.',
    bulky: false,
  },
  'bike-helmet': {
    category: 'bike-helmet',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Single-impact protection. You cannot see whether it has already been used.',
    bulky: false,
  },
  'non-stick-pan': {
    category: 'non-stick-pan',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'The coating degrades and scratches. Buy stainless or cast iron used instead.',
    bulky: false,
  },
  'smoke-detector': {
    category: 'smoke-detector',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Sensors expire. Do not gamble on this one.',
    bulky: false,
  },
  'surge-protector': {
    category: 'surge-protector',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Protection components wear out invisibly with every surge absorbed.',
    bulky: false,
  },
}

/** Layer 3 — the category knowledge base. §07 is the full starter table. */
export async function getCategoryGuidance(slug: string): Promise<CategoryGuidance | null> {
  // TODO lane/snowflake: SELECT * FROM CATEGORY_GUIDANCE WHERE CATEGORY = :1
  return SEED[slug] ?? null
}

/** Optional: the running total behind the popup. Safe to leave unimplemented. */
export async function logImpact(_slug: string, _co2Kg: number): Promise<void> {
  // TODO lane/snowflake: INSERT INTO IMPACT_LOG ...
}

/** Exported for the parity test only. Not part of the seam. */
export const __SEED = SEED
