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
import { GUIDANCE } from '../src/guidance'

/*
 * The seed IS the table the extension ships.
 *
 * These used to be two copies of the same knowledge — one here, one bundled
 * into the extension — which is exactly how a tip gets improved in one place
 * and silently goes stale in the other. src/guidance.ts is the authored
 * source; the warehouse and the generated SQL are both downstream of it.
 */
const SEED: Record<string, CategoryGuidance> = GUIDANCE


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
