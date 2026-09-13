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
 * embodiedCo2Kg / co2Source are PLACEHOLDERS. §09: we display a figure only
 * with a citation behind it. lane/demo replaces them. Do not invent one.
 * ----------------------------------------------------------------------- */

const SEED: Record<string, CategoryGuidance> = {
  'mini-fridge': {
    category: 'mini-fridge',
    verdict: 'safe',
    checkTips: [
      'Check the door seal for cracks or gaps.',
      'Confirm it cools within an hour of plugging in.',
    ],
    embodiedCo2Kg: 46,
    co2Source: 'PLACEHOLDER — lane/demo to source',
    note: 'Compressor appliances last well. Buying used avoids nearly all of the footprint.',
    bulky: true,
  },
  mattress: {
    category: 'mattress',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: 'PLACEHOLDER — lane/demo to source',
    note: 'Hygiene and pest risk, and compression is permanent. Buy this one new.',
    bulky: true,
  },
  desk: {
    category: 'desk',
    verdict: 'safe',
    checkTips: [
      'Check the drawer runners slide cleanly.',
      "Make sure it isn't particleboard that has been wet.",
    ],
    embodiedCo2Kg: 32,
    co2Source: 'PLACEHOLDER — lane/demo to source',
    note: 'Ideal used. Solid wood outlives several owners.',
    bulky: true,
  },
}

/** Layer 3 — the category knowledge base. §07 is the full starter table. */
export async function getCategoryGuidance(slug: string): Promise<CategoryGuidance | null> {
  // TODO lane/snowflake: SELECT * FROM CATEGORY_GUIDANCE WHERE CATEGORY = :1
  return SEED[slug] ?? null
}

/**
 * Layer 2 — campus listings.
 *
 * SEEDED, and we say so plainly if asked (§09). The groups students actually
 * use are Facebook and GroupMe, which have no API to read. Seeded data
 * described accurately costs us nothing; seeded data implied to be live does.
 */
export async function getCampusListings(slug: string): Promise<UsedOption[]> {
  // TODO lane/snowflake: SELECT * FROM CAMPUS_LISTINGS WHERE CATEGORY = :1
  if (slug !== 'mini-fridge') return []
  return [
    {
      source: 'campus',
      title: 'Mini fridge, used one year, works perfectly',
      price: 34,
      url: 'https://example.edu/listings/1',
      imageUrl: null,
      condition: 'Used — good',
      distanceMi: 2,
      /* Local pickup: arrange it today, collect tomorrow. */
      daysToHand: 1,
    },
  ]
}

/** Optional: the running total behind the popup. Safe to leave unimplemented. */
export async function logImpact(_slug: string, _co2Kg: number): Promise<void> {
  // TODO lane/snowflake: INSERT INTO IMPACT_LOG ...
}
