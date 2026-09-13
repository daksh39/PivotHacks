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
import { KNOWN_CATEGORIES } from './categories'
import { getCategoryGuidance, __SEED } from './snowflake'
import { isSourced } from '../src/carbon'
import { generate } from './snowflake.gen'

type SqlRow = {
  verdict: string
  embodiedCo2Kg: number
  co2Source: string
  bulky: boolean
  tipCount: number
  useDominant: boolean
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
    const flags = chunk.match(/,(TRUE|FALSE),(TRUE|FALSE)\)[,;]/)
    const bulky = flags?.[1]
    if (!slug || !verdict || !tail || !bulky || tips === undefined) continue

    rows[slug] = {
      verdict,
      embodiedCo2Kg: Number(tail[1]),
      co2Source: tail[2].replace(/''/g, "'"),
      bulky: bulky === 'TRUE',
      useDominant: flags?.[2] === 'TRUE',
      tipCount: (JSON.parse(tips) as string[]).length,
    }
  }
  return rows
}

const SQL = readSql()

describe('category coverage', () => {
  it('parses every row out of the SQL', () => {
    /* Derived from SEED, not hardcoded: the count grew from 24 to 58 the
     * first time someone widened the classifier, and a literal here just
     * means a red test that tells you nothing. */
    expect(Object.keys(SQL).length).toBe(Object.keys(__SEED).length)
  })

  it.each(KNOWN_CATEGORIES)('%s has guidance — otherwise the card never renders', async (slug) => {
    expect(await getCategoryGuidance(slug)).not.toBeNull()
  })

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

  it('pairs every figure with a citation, in both directions', () => {
    /* Was a hardcoded list of the two categories that had sources. That is a
     * list that goes stale every time someone does the research, and it tells
     * you nothing when it fails. The invariant is what we actually care about:
     * a number without a source is a claim we cannot defend, and a source
     * without a number is a citation that proves nothing. */
    for (const [slug, g] of Object.entries(__SEED)) {
      if (g.embodiedCo2Kg > 0) {
        expect(isSourced(g.co2Source), `${slug} carries a figure with no source`).toBe(true)
      }
      if (isSourced(g.co2Source)) {
        expect(g.embodiedCo2Kg, `${slug} cites a source but claims nothing`).toBeGreaterThan(0)
      }
    }
  })

  it('names the document behind each figure, not just a vibe', () => {
    /* "where did 322 kg come from" is the first question a good judge asks.
     * A source string has to be checkable — a report, datasheet, EPD or
     * paper — not the word "estimate". */
    const cited = Object.values(__SEED).filter((g) => isSourced(g.co2Source))
    expect(cited.length).toBeGreaterThan(0)
    for (const g of cited) {
      expect(g.co2Source.length, `${g.category}'s source is too thin to check`).toBeGreaterThan(25)
      expect(
        /report|datasheet|declaration|epd|study|journal|assessment/i.test(g.co2Source),
        `${g.category}'s source does not name a document: ${g.co2Source}`,
      ).toBe(true)
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
