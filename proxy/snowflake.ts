/* ---------------------------------------------------------------------------
 * Snowflake access.  Layers 2 and 3 (verte-plan.md §03).  Owned by lane/snowflake.
 *
 * ┌─ THE SEAM ────────────────────────────────────────────────────────────┐
 * │ These two exported signatures are FROZEN. lane/snowflake owns the     │
 * │ inside of this file and data/*.sql. lane/proxy only ever CALLS these  │
 * │ two functions and never opens this file. That is the whole reason     │
 * │ neither branch conflicts with the other.                              │
 * │                                                                       │
 * │   getCategoryGuidance(slug) : Promise<CategoryGuidance | null>        │
 * │   getCampusListings(slug)   : Promise<UsedOption[]>                   │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Both currently read from the in-file seed below so the proxy runs green
 * with no Snowflake account. Replace the bodies with real queries; do not
 * change the signatures.
 *
 * Queries go through this proxy, never from the extension (§03).
 * ------------------------------------------------------------------------- */

import type { CategoryGuidance, UsedOption } from '../src/types'

/* --- seed: mirrors data/category-guidance.sql ----------------------------
 * Keep these two in sync until the real table is live. §07 is the source of
 * truth for verdicts and tips.
 *
 * A category carries a carbon figure ONLY when co2Source names a real
 * reference. Where no defensible source was found, embodiedCo2Kg is 0 and
 * co2Source is empty — isSourced() then suppresses the claim entirely rather
 * than printing a number we cannot stand behind (§09).
 * ----------------------------------------------------------------------- */

const SEED: Record<string, CategoryGuidance> = {
  /* Every slug proxy/categories.ts can produce needs an entry here, or the
   * lookup 404s and no card ever appears. Verdicts and tips are real advice;
   * carbon stays 0/'' unless a citation exists (§09). */
  'bike-helmet': {
    category: 'bike-helmet',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Single-impact protection, and a helmet that has already been dropped looks identical to one that has not.",
    bulky: false,
  },
  'desk-chair': {
    category: 'desk-chair',
    verdict: 'check',
    checkTips: [
      "Sit on it and check the gas cylinder does not sink.",
      "Test that the recline lock holds.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A failed gas cylinder is a real repair, not a quirk.",
    bulky: true,
  },
  'non-stick-pan': {
    category: 'non-stick-pan',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The coating degrades and scratches. Buy cast iron or stainless used instead.",
    bulky: false,
  },
  'smoke-detector': {
    category: 'smoke-detector',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Sensors expire on a fixed schedule from manufacture.",
    bulky: false,
  },
  'surge-protector': {
    category: 'surge-protector',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Protection components wear out invisibly with every surge absorbed.",
    bulky: false,
  },
  'drying-rack': {
    category: 'drying-rack',
    verdict: 'safe',
    checkTips: [
      "Confirm the hinges lock open.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Nothing to go wrong. Always worth checking used first.",
    bulky: false,
  },
  'storage-bin': {
    category: 'storage-bin',
    verdict: 'safe',
    checkTips: [
      "Check for cracks along the base.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "No meaningful risk. Never buy these new.",
    bulky: false,
  },
  pillow: {
    category: 'pillow',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Hygiene, and they are cheap enough new that it does not sting.",
    bulky: false,
  },
  bookshelf: {
    category: 'bookshelf',
    verdict: 'safe',
    checkTips: [
      "Check the shelves are not sagging.",
      "Confirm the wall anchor hardware is included.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Very little that can go wrong.",
    bulky: true,
  },
  dresser: {
    category: 'dresser',
    verdict: 'safe',
    checkTips: [
      "Open every drawer.",
      "Check the back panel is still attached.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Heavy, so favour local pickup over shipping.",
    bulky: true,
  },
  microwave: {
    category: 'microwave',
    verdict: 'safe',
    checkTips: [
      "Check the door latch closes firmly.",
      "The interior should not be scorched or rusted.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A damaged door seal is the one real safety concern.",
    bulky: false,
  },
  textbook: {
    category: 'textbook',
    verdict: 'safe',
    checkTips: [
      "Confirm the edition matches the syllabus.",
      "Ask whether an access code is required and still unused.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A previous edition is often fine, and usually a fraction of the price.",
    bulky: false,
  },
  cookware: {
    category: 'cookware',
    verdict: 'safe',
    checkTips: [
      "Surface rust on cast iron is cosmetic and scrubs off.",
      "Check stainless pans sit flat on a counter.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Cast iron and stainless are effectively indestructible.",
    bulky: false,
  },
  bike: {
    category: 'bike',
    verdict: 'safe',
    checkTips: [
      "Inspect the frame for cracks near the welds.",
      "Spin both wheels and check they run true.",
      "Chain, brakes and tyres are cheap to replace.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Frame condition is the only thing that really matters.",
    bulky: false,
  },
  fan: {
    category: 'fan',
    verdict: 'safe',
    checkTips: [
      "Run it on every speed setting.",
      "Check the cage is not bent into the blades.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "No meaningful risk.",
    bulky: false,
  },
  blender: {
    category: 'blender',
    verdict: 'check',
    checkTips: [
      "Inspect the seal and gasket around the blade assembly.",
      "Cracked plastic near the base means leaks.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Seals perish long before motors do.",
    bulky: false,
  },
  kettle: {
    category: 'kettle',
    verdict: 'check',
    checkTips: [
      "Limescale is cosmetic and descales off.",
      "Check the flex and plug for fraying.",
      "Confirm the auto shut-off works.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A failed auto shut-off is the one thing to avoid.",
    bulky: false,
  },
  headphones: {
    category: 'headphones',
    verdict: 'check',
    checkTips: [
      "Budget for replacement ear pads.",
      "Test both channels before paying.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Hygiene is the reason for the caveat, not whether they work.",
    bulky: false,
  },
  'winter-coat': {
    category: 'winter-coat',
    verdict: 'check',
    checkTips: [
      "Run every zip fully up and down.",
      "Check the insulation still lofts rather than sitting flat.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Excellent value used. Flattened insulation cannot be restored.",
    bulky: false,
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
  mattress: {
    category: 'mattress',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Hygiene and pest risk, and compression is permanent. Buy this one new.',
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
    note: 'Most of a display\'s footprint is in the making of it, so a used one avoids nearly all of it.',
    bulky: false,
  },

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
    note: 'Production dominates a laptop\'s footprint. Activation lock is the one thing that makes a cheap one worthless.',
    bulky: false,
  },

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
