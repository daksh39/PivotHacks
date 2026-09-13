/* ---------------------------------------------------------------------------
 * Guards the two ways the knowledge base can quietly break.
 *
 * 1. COVERAGE. proxy/categories.ts classifies a title, then index.ts asks for
 *    guidance; no row means 404 and no card. A slug the classifier can emit
 *    with no guidance behind it is a product page that silently does nothing.
 *
 * 2. PARITY. SEED is authored and data/category-guidance.sql is generated
 *    from it. Drift means the demo shows one verdict and the warehouse holds
 *    another — so the checked-in file must match what the generator emits.
 *
 * Tip wording is allowed to differ (the SQL avoids apostrophes so it does not
 * have to escape them inside a JSON literal); everything that drives behaviour
 * is compared exactly.
 * ------------------------------------------------------------------------- */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { KNOWN_CATEGORIES } from '../src/categories'
import { getCategoryGuidance, __SEED } from './snowflake'
import { isSourced } from '../src/carbon'
import { generate } from './snowflake.gen'

type SqlRow = {
  verdict: string
  embodiedCo2Kg: number
  co2Source: string
  bulky: boolean
  tipCount: number
}

/** Parses the INSERT block of data/category-guidance.sql. */
function readSql(): Record<string, SqlRow> {
  const sql = readFileSync(resolve(process.cwd(), 'data/category-guidance.sql'), 'utf8')
  const rows: Record<string, SqlRow> = {}

  /* Each row starts at column 0 with ('slug', and runs until the next one. */
  const chunks = sql.split(/^\(/m).slice(1)
  for (const chunk of chunks) {
    const slug = chunk.match(/^'([a-z-]+)'/)?.[1]
    const verdict = chunk.match(/^'[a-z-]+','(safe|check|avoid)'/)?.[1]
    const tips = chunk.match(/'(\[.*?\])'/s)?.[1]
    /* The number and source sit immediately after the tips array. */
    const tail = chunk.match(/\]',\s*([\d.]+),'((?:[^']|'')*)'/s)
    /* Two booleans now: BULKY then USE_DOMINANT. Matching only the last one
     * silently read useDominant as bulky and every bulky category failed. */
    const flags = chunk.match(/,(TRUE|FALSE),(TRUE|FALSE)\)[,;]/)
    const bulky = flags?.[1]
    if (!slug || !verdict || !tail || !bulky || tips === undefined) continue

    rows[slug] = {
      verdict,
      embodiedCo2Kg: Number(tail[1]),
      co2Source: tail[2].replace(/''/g, "'"),
      bulky: bulky === 'TRUE',
      tipCount: (JSON.parse(tips) as string[]).length,
    }
  }
  return rows
}

const SQL = readSql()

describe('category coverage', () => {
  it('parses every row out of the SQL', () => {
    /* Derived, not hardcoded: the table grows, and a literal here just turns
     * into a failing test every time someone adds a category. The SQL is
     * generated from the seed, so the two must simply agree. */
    expect(Object.keys(SQL).length).toBe(Object.keys(__SEED).length)
  })

  it.each([...KNOWN_CATEGORIES])(
    '%s has guidance — otherwise the card never renders',
    async (slug: string) => {
      expect(await getCategoryGuidance(slug)).not.toBeNull()
    },
  )

  it('has no guidance the classifier can never reach', () => {
    expect(Object.keys(__SEED).filter((s) => !KNOWN_CATEGORIES.includes(s))).toEqual([])
  })

  it('returns null for an unknown slug rather than guessing', async () => {
    expect(await getCategoryGuidance('sourdough-starter')).toBeNull()
  })

  it('keys the seed by the same slug it reports as its category', () => {
    for (const [key, g] of Object.entries(__SEED)) expect(g.category).toBe(key)
  })
})

describe('seed matches data/category-guidance.sql', () => {
  it.each(Object.keys(__SEED))('%s', (slug) => {
    const seed = __SEED[slug]
    const row = SQL[slug]
    expect(row, `${slug} is missing from the SQL`).toBeDefined()
    expect(seed.verdict).toBe(row.verdict)
    expect(seed.bulky).toBe(row.bulky)
    expect(seed.embodiedCo2Kg).toBe(row.embodiedCo2Kg)
    expect(seed.co2Source).toBe(row.co2Source)
    expect(seed.checkTips.length).toBe(row.tipCount)
  })
})

describe('no citation, no claim (§09)', () => {
  it.each(Object.keys(__SEED))('%s never carries an uncited figure', (slug) => {
    const { embodiedCo2Kg, co2Source } = __SEED[slug]
    if (!isSourced(co2Source)) expect(embodiedCo2Kg).toBe(0)
    else expect(embodiedCo2Kg).toBeGreaterThan(0)
  })

  it('cites only categories with a real published source', () => {
    /* Asserts the property, not a literal list. The list grows whenever
     * someone finds a defensible figure, and a hardcoded array turns that
     * into a failing build instead of a win. What must stay true is that
     * every cited category names a real reference and carries a real number. */
    const cited = Object.keys(__SEED).filter((s) => isSourced(__SEED[s].co2Source))
    expect(cited.length).toBeGreaterThan(0)
    for (const slug of cited) {
      expect(__SEED[slug].co2Source).not.toMatch(/placeholder|todo|tbd/i)
      expect(__SEED[slug].embodiedCo2Kg).toBeGreaterThan(0)
    }
  })
})

describe('data/category-guidance.sql is generated, not hand-edited', () => {
  it('matches what proxy/snowflake.gen.ts emits', () => {
    const onDisk = readFileSync(resolve(process.cwd(), 'data/category-guidance.sql'), 'utf8')
    expect(onDisk, 'SEED changed without regenerating — run: npx tsx proxy/snowflake.gen.ts').toBe(
      generate(),
    )
  })
})
