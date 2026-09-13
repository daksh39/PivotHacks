/* ---------------------------------------------------------------------------
 * Generates data/category-guidance.sql from SEED.  Owned by lane/snowflake.
 *
 *     npx tsx proxy/snowflake.gen.ts
 *
 * SEED is where the team actually edits this knowledge — twice now the SQL
 * has been left behind when someone improved a tip. So the TypeScript is the
 * authored source and the SQL is generated from it; snowflake.test.ts fails
 * if the checked-in file stops matching.
 * ------------------------------------------------------------------------- */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { __SEED } from './snowflake'

/** Single quotes double inside a SQL string literal. */
const q = (s: string) => `'${s.replace(/'/g, "''")}'`

const BY_VERDICT = { safe: 'SAFE', check: 'CHECK', avoid: 'BUY NEW' } as const

export function generate(): string {
  const order = (['safe', 'check', 'avoid'] as const).flatMap((v) =>
    Object.values(__SEED).filter((g) => g.verdict === v),
  )

  const rows = order.map((g, i) => {
    const last = i === order.length - 1
    const cited = g.co2Source ? `\n-- SOURCED: ${g.co2Source}` : ''
    return (
      `${cited}\n(${q(g.category)},${q(g.verdict)},${q(JSON.stringify(g.checkTips))},\n` +
      `  ${g.embodiedCo2Kg},${q(g.co2Source)},${q(g.note)},${g.bulky ? 'TRUE' : 'FALSE'},${g.useDominant ? 'TRUE' : 'FALSE'})${last ? ';' : ','}`
    )
  })

  /* Section headers, inserted where the verdict changes. */
  let prev = ''
  const body = order
    .map((g, i) => {
      const head = g.verdict !== prev ? `\n\n-- ${BY_VERDICT[g.verdict]} ${'-'.repeat(60 - BY_VERDICT[g.verdict].length)}` : ''
      prev = g.verdict
      return head + rows[i]
    })
    .join('')

  return `-- ---------------------------------------------------------------------------
-- Verte — category knowledge base.  verte-plan.md §07.  Owned by lane/snowflake.
--
-- GENERATED FROM proxy/snowflake.ts. Do not hand-edit: run
--     npx tsx proxy/snowflake.gen.ts
-- after changing SEED, and snowflake.test.ts will confirm the two agree.
--
-- CARBON: a category carries a figure ONLY when CO2_SOURCE names a real
-- reference. Everything else is 0 / '' and isSourced() in src/carbon.ts
-- suppresses the claim rather than printing a number nobody can defend (§09).
--
-- CATEGORY values match the slugs in proxy/categories.ts exactly.
-- Re-running is safe: CATEGORY_GUIDANCE is replaced wholesale, IMPACT_LOG is
-- left alone so its history survives.
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS VERTE;
USE DATABASE VERTE;
USE SCHEMA PUBLIC;

-- Pure reference data, no user rows: replacing it outright is what makes this
-- file idempotent. Snowflake does not enforce PRIMARY KEY, so a plain INSERT
-- on a re-run would silently duplicate every category.
CREATE OR REPLACE TABLE CATEGORY_GUIDANCE (
  CATEGORY         VARCHAR      NOT NULL PRIMARY KEY,
  VERDICT          VARCHAR      NOT NULL,   -- 'safe' | 'check' | 'avoid'
  CHECK_TIPS       ARRAY,
  EMBODIED_CO2_KG  NUMBER(10,1) NOT NULL,   -- 0 when uncited
  CO2_SOURCE       VARCHAR      NOT NULL,   -- '' when uncited
  NOTE             VARCHAR      NOT NULL,
  -- Needs a car to collect. Drives the no-car demotion in proxy/rank.ts.
  BULKY            BOOLEAN      NOT NULL,
  -- Lifetime emissions dominated by RUNNING it, not making it. Where this is
  -- true, a cheap old unit can be a carbon loss and the card says so.
  USE_DOMINANT     BOOLEAN      NOT NULL
);

-- Accumulates across runs — never replaced.
CREATE TABLE IF NOT EXISTS IMPACT_LOG (
  ID        VARCHAR DEFAULT UUID_STRING(),
  CATEGORY  VARCHAR,
  CO2_KG    NUMBER(10,1),
  SEEN_AT   TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- --- §07 starter set -------------------------------------------------------
-- ${order.length} categories, matching proxy/categories.ts one for one.

INSERT INTO CATEGORY_GUIDANCE
  (CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE, BULKY, USE_DOMINANT)
SELECT column1, column2, PARSE_JSON(column3), column4, column5, column6, column7, column8
FROM VALUES
${body}
`
}

if (process.env.NODE_ENV !== 'test') {
  const path = resolve(process.cwd(), 'data/category-guidance.sql')
  writeFileSync(path, generate())
  console.log(`wrote ${path} — ${Object.keys(__SEED).length} categories`)
}
