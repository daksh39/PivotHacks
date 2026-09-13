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
 * ┌─ SNOWFLAKE IS AN UPGRADE, NEVER A DEPENDENCY ─────────────────────────┐
 * │ Reads come from VERTE.PUBLIC.CATEGORY_GUIDANCE when .env carries      │
 * │ credentials, and from the SEED below when it does not. Every failure  │
 * │ path — no credentials, connect refused, query error, a malformed row  │
 * │ — falls back to SEED and logs. The card must never depend on a        │
 * │ warehouse being reachable from a conference wifi network.             │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * The table is 24 rows, so the first call fetches all of it and everything
 * after is served from memory. Load it with:
 *
 *     npx tsx proxy/snowflake.load.ts     # data/category-guidance.sql
 *     npx tsx proxy/snowflake.check.ts    # diagnose a connection
 *
 * Queries go through this proxy, never from the extension (§03).
 * ------------------------------------------------------------------------- */

import type { CategoryGuidance } from '../src/types'

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

/* --- the warehouse ------------------------------------------------------- */

/** Null until the first call decides; false means "use SEED and stop asking". */
let pool: Promise<Record<string, CategoryGuidance> | null> | null = null

function configured(): boolean {
  return Boolean(
    process.env.SNOWFLAKE_ACCOUNT &&
      process.env.SNOWFLAKE_USER &&
      (process.env.SNOWFLAKE_PASSWORD || process.env.SNOWFLAKE_PRIVATE_KEY_PATH),
  )
}

/**
 * One row -> CategoryGuidance, or null if it does not survive validation.
 *
 * The table is ours, but a row that has drifted is exactly the case where we
 * would rather show the seed than a verdict we cannot trust. CHECK_TIPS is an
 * ARRAY, which the driver hands back as either a JSON string or an array
 * depending on version.
 */
function toGuidance(row: Record<string, unknown>): CategoryGuidance | null {
  const category = String(row.CATEGORY ?? '')
  const verdict = String(row.VERDICT ?? '')
  if (!category) return null
  if (verdict !== 'safe' && verdict !== 'check' && verdict !== 'avoid') return null

  let checkTips: string[] = []
  try {
    const raw = row.CHECK_TIPS
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(parsed)) checkTips = parsed.map(String)
  } catch {
    return null
  }

  const co2Source = String(row.CO2_SOURCE ?? '')
  const embodiedCo2Kg = Number(row.EMBODIED_CO2_KG ?? 0)
  if (!Number.isFinite(embodiedCo2Kg)) return null

  return {
    category,
    verdict,
    checkTips,
    embodiedCo2Kg,
    co2Source,
    note: String(row.NOTE ?? ''),
    bulky: Boolean(row.BULKY),
  }
}

/**
 * Fetches all 24 rows once. Resolves to null on any failure, which is the
 * signal to serve SEED — a warehouse we cannot reach must not cost us a card.
 */
async function load(): Promise<Record<string, CategoryGuidance> | null> {
  if (!configured()) return null

  try {
    const { readFileSync } = await import('node:fs')
    const snowflake = (await import('snowflake-sdk')).default
    snowflake.configure({ logLevel: 'OFF' })

    const keyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH
    const opts: import('snowflake-sdk').ConnectionOptions = {
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USER!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE ?? 'COMPUTE_WH',
      role: process.env.SNOWFLAKE_ROLE ?? 'ACCOUNTADMIN',
      database: process.env.SNOWFLAKE_DATABASE ?? 'VERTE',
      schema: process.env.SNOWFLAKE_SCHEMA ?? 'PUBLIC',
    }
    if (keyPath) {
      opts.privateKey = readFileSync(keyPath.replace(/^~/, process.env.HOME ?? '~'), 'utf8')
      opts.authenticator = 'SNOWFLAKE_JWT'
    } else {
      opts.password = process.env.SNOWFLAKE_PASSWORD
    }

    conn = snowflake.createConnection(opts)
    await new Promise<void>((res, rej) => conn!.connect((e) => (e ? rej(e) : res())))

    const rows = await new Promise<Record<string, unknown>[]>((res, rej) =>
      conn!.execute({
        sqlText:
          'SELECT CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE, BULKY FROM CATEGORY_GUIDANCE',
        complete: (e, _s, r) => (e ? rej(e) : res((r ?? []) as Record<string, unknown>[])),
      }),
    )

    const table: Record<string, CategoryGuidance> = {}
    let rejected = 0
    for (const row of rows) {
      const g = toGuidance(row)
      if (g) table[g.category] = g
      else rejected++
    }
    if (rejected) console.warn(`[verte] ${rejected} guidance row(s) failed validation, using seed for those`)

    const missing = Object.keys(SEED).filter((s) => !(s in table))
    if (missing.length) console.warn(`[verte] not in the warehouse, using seed: ${missing.join(", ")}`)

    console.log(`[verte] category guidance from Snowflake — ${Object.keys(table).length} rows`)
    return table
  } catch (error) {
    console.warn(
      `[verte] Snowflake unavailable, serving the built-in table: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return null
  }
}

let conn: import('snowflake-sdk').Connection | null = null

/** Layer 3 — the category knowledge base. §07 is the full starter table. */
export async function getCategoryGuidance(slug: string): Promise<CategoryGuidance | null> {
  pool ??= load()
  const table = await pool
  /* SEED is the floor, not merely the fallback: a slug missing from the
   * warehouse still answers rather than 404-ing on a page we recognised. */
  return table?.[slug] ?? SEED[slug] ?? null
}

/**
 * The running total behind the popup. Fire and forget — a failed insert must
 * never reach the caller, and proxy/index.ts deliberately does not await it.
 */
export async function logImpact(slug: string, co2Kg: number): Promise<void> {
  if (!conn || !(await pool)) return
  try {
    await new Promise<void>((res, rej) =>
      conn!.execute({
        sqlText: 'INSERT INTO IMPACT_LOG (CATEGORY, CO2_KG) VALUES (?, ?)',
        binds: [slug, co2Kg],
        complete: (e) => (e ? rej(e) : res()),
      }),
    )
  } catch (error) {
    console.warn(`[verte] impact log write failed: ${error instanceof Error ? error.message : error}`)
  }
}

/** Exported for the parity test only. Not part of the seam. */
export const __SEED = SEED
