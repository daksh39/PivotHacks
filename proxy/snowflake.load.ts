/* ---------------------------------------------------------------------------
 * Loads data/category-guidance.sql into the warehouse.  Owned by lane/snowflake.
 *
 *     npx tsx proxy/snowflake.load.ts
 *
 * Safe to re-run: the file replaces CATEGORY_GUIDANCE wholesale and leaves
 * IMPACT_LOG alone.
 * ------------------------------------------------------------------------- */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import snowflake from 'snowflake-sdk'

/**
 * Splits the file into statements.
 *
 * A naive split on ';' corrupts the data: two of the notes read "Limescale is
 * fine; cracked plastic is not." So track string literals (with '' as the
 * escape) and line comments, and only break on a semicolon outside both.
 */
export function splitStatements(sql: string): string[] {
  const out: string[] = []
  let buf = ''
  let inString = false
  let inComment = false

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]

    if (inComment) {
      if (c === '\n') inComment = false
      buf += c
      continue
    }
    if (inString) {
      buf += c
      if (c === "'") {
        if (sql[i + 1] === "'") buf += sql[++i]  // escaped quote, stays inside
        else inString = false
      }
      continue
    }
    if (c === '-' && sql[i + 1] === '-') { inComment = true; buf += c; continue }
    if (c === "'") { inString = true; buf += c; continue }
    if (c === ';') { out.push(buf); buf = ''; continue }
    buf += c
  }
  if (buf.trim()) out.push(buf)

  /* Drop anything that is only comments and whitespace. */
  return out.filter((s) => s.replace(/--[^\n]*/g, '').trim().length > 0)
}

/** A one-line label for the log, so a failure names the statement. */
function label(stmt: string): string {
  const body = stmt.replace(/--[^\n]*/g, '').trim().replace(/\s+/g, ' ')
  return body.length > 68 ? body.slice(0, 68) + '…' : body
}

if (process.env.NODE_ENV !== 'test') {
  const path = resolve(process.cwd(), 'data/category-guidance.sql')
  const statements = splitStatements(readFileSync(path, 'utf8'))

  const keyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH
  const opts: snowflake.ConnectionOptions = {
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USER!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE ?? 'COMPUTE_WH',
    role: process.env.SNOWFLAKE_ROLE ?? 'ACCOUNTADMIN',
  }
  if (keyPath) {
    opts.privateKey = readFileSync(keyPath.replace(/^~/, process.env.HOME ?? '~'), 'utf8')
    opts.authenticator = 'SNOWFLAKE_JWT'
  } else {
    opts.password = process.env.SNOWFLAKE_PASSWORD
  }

  const conn = snowflake.createConnection(opts)
  const run = (sqlText: string) =>
    new Promise<any[]>((res, rej) =>
      conn.execute({ sqlText, complete: (e, _s, rows) => (e ? rej(e) : res(rows ?? [])) }),
    )

  console.log(`\nloading data/category-guidance.sql — ${statements.length} statements\n`)

  conn.connect(async (err) => {
    if (err) {
      console.error(`  connect failed: ${err.message}`)
      console.error('  Run `npx tsx proxy/snowflake.check.ts` for a diagnosis.\n')
      process.exit(1)
    }
    try {
      for (const stmt of statements) {
        await run(stmt)
        console.log(`  \x1b[32m✓\x1b[0m ${label(stmt)}`)
      }
      const [{ N }] = await run(
        'SELECT COUNT(*) AS N FROM VERTE.PUBLIC.CATEGORY_GUIDANCE',
      )
      console.log(`\nLoaded. CATEGORY_GUIDANCE holds ${N} categories.\n`)
      conn.destroy(() => process.exit(Number(N) === 24 ? 0 : 1))
    } catch (e) {
      console.error(`\n  failed: ${e instanceof Error ? e.message : String(e)}\n`)
      conn.destroy(() => process.exit(1))
    }
  })
}
