/* ---------------------------------------------------------------------------
 * Generates src/offline-guidance.ts from SEED.
 *
 *     npx tsx proxy/offline.gen.ts
 *
 * Same arrangement as snowflake.gen.ts and for the same reason: SEED is where
 * the team authors this knowledge, and anything that needs a second copy of it
 * gets that copy generated rather than retyped.
 *
 * The extension needs the table because it answers locally when the proxy is
 * not running, and it cannot import proxy/snowflake.ts to get it — that module
 * reaches for snowflake-sdk, which has no business in a service worker. So the
 * data is copied; the copy is just never copied BY HAND. offline.test.ts fails
 * if the checked-in file stops matching.
 * ------------------------------------------------------------------------- */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { __SEED } from './snowflake'

const HEADER = `/* ---------------------------------------------------------------------------
 * GENERATED FILE — DO NOT EDIT.
 *
 *     npx tsx proxy/offline.gen.ts
 *
 * The category table, copied out of SEED in proxy/snowflake.ts so the
 * extension can answer when the proxy is not running. Edit it THERE; this
 * file is regenerated from it and src/offline.test.ts fails if the two drift.
 * ------------------------------------------------------------------------- */

import type { CategoryGuidance } from './types'

export const OFFLINE_GUIDANCE: Record<string, CategoryGuidance> = `

export function generate(): string {
  /* Stable key order so regenerating produces no spurious diff. */
  const ordered = Object.fromEntries(
    Object.keys(__SEED)
      .sort()
      .map((slug) => [slug, __SEED[slug]]),
  )
  return `${HEADER}${JSON.stringify(ordered, null, 2)}\n`
}

const OUT = 'src/offline-guidance.ts'

if (process.argv[1]?.endsWith('offline.gen.ts')) {
  const path = resolve(process.cwd(), OUT)
  writeFileSync(path, generate())
  console.log(`wrote ${OUT} — ${Object.keys(__SEED).length} categories`)
}
