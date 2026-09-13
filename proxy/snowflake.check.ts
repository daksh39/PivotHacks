/* ---------------------------------------------------------------------------
 * Connection check.  Owned by lane/snowflake.
 *
 *     npx tsx proxy/snowflake.check.ts
 *
 * Answers one question — can we reach the warehouse with what is in .env? —
 * and says precisely which step failed when we cannot. Nothing else in the
 * product depends on this passing; see the header of proxy/snowflake.ts.
 * ------------------------------------------------------------------------- */

import 'dotenv/config'
import { readFileSync } from 'node:fs'
import snowflake from 'snowflake-sdk'

const {
  SNOWFLAKE_ACCOUNT: account,
  SNOWFLAKE_USER: username,
  SNOWFLAKE_PASSWORD: password,
  SNOWFLAKE_PRIVATE_KEY_PATH: keyPath,
  SNOWFLAKE_WAREHOUSE: warehouse = 'COMPUTE_WH',
  SNOWFLAKE_ROLE: role = 'ACCOUNTADMIN',
  SNOWFLAKE_DATABASE: database = 'VERTE',
  SNOWFLAKE_SCHEMA: schema = 'PUBLIC',
} = process.env

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const bad = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`)
const hint = (m: string) => console.log(`      ${m}`)

function die(message: string, ...hints: string[]): never {
  bad(message)
  for (const h of hints) hint(h)
  console.log('\nNot connected. Nothing is broken — the proxy still serves the')
  console.log('built-in table for all 24 categories.\n')
  process.exit(1)
}

console.log('\nsnowflake connection check\n')

/* --- what is in .env ----------------------------------------------------- */

if (!account) die('SNOWFLAKE_ACCOUNT is empty', 'See .env.example — Snowsight, bottom-left, "Copy account identifier".')
if (!username) die('SNOWFLAKE_USER is empty', 'Your Snowsight login name, not your email address.')

if (account.includes('.snowflakecomputing.com') || account.startsWith('http')) {
  die(
    `SNOWFLAKE_ACCOUNT looks like a URL: ${account}`,
    'Use the identifier alone, e.g. KLXZBQP-AB12345 — drop https:// and .snowflakecomputing.com.',
  )
}
ok(`account  ${account}`)
ok(`user     ${username}`)

const opts: snowflake.ConnectionOptions = { account, username, warehouse, role, database, schema }

if (keyPath) {
  try {
    opts.privateKey = readFileSync(keyPath.replace(/^~/, process.env.HOME ?? '~'), 'utf8')
  } catch {
    die(`cannot read the private key at ${keyPath}`, 'Check the path, and that it is the .p8 PRIVATE key, not the .pub.')
  }
  opts.authenticator = 'SNOWFLAKE_JWT'
  ok('auth     key-pair (method B)')
} else if (password) {
  opts.password = password
  ok('auth     password (method A)')
} else {
  die(
    'no credential set',
    'Fill in either SNOWFLAKE_PASSWORD (method A) or SNOWFLAKE_PRIVATE_KEY_PATH (method B).',
  )
}

/* --- connect ------------------------------------------------------------- */

const conn = snowflake.createConnection(opts)

const query = (sqlText: string) =>
  new Promise<any[]>((resolve, reject) =>
    conn.execute({ sqlText, complete: (err, _s, rows) => (err ? reject(err) : resolve(rows ?? [])) }),
  )

conn.connect(async (err) => {
  if (err) {
    const m = String(err.message ?? err)
    const hints: string[] = []
    if (/multi-factor|MFA|password.*disabl/i.test(m))
      hints.push('This is the MFA enforcement noted in .env.example. Switch to method B (key-pair).')
    if (/account.*not exist|Incorrect username or password|404/i.test(m))
      hints.push('Usually the account identifier. It should be ORGNAME-ACCOUNT_NAME, with a hyphen.')
    if (/JWT|token is invalid/i.test(m))
      hints.push("The public key may not be registered. Run ALTER USER <user> SET RSA_PUBLIC_KEY='...' in Snowsight.")
    die(`connect failed: ${m}`, ...hints)
  }

  try {
    const [who] = await query(
      'SELECT CURRENT_ACCOUNT() AS A, CURRENT_ROLE() AS R, CURRENT_WAREHOUSE() AS W, CURRENT_VERSION() AS V',
    )
    ok(`connected — role ${who.R}, warehouse ${who.W ?? '(none active)'}, Snowflake ${who.V}`)

    if (!who.W) {
      bad(`warehouse ${warehouse} did not activate`)
      hint('Check the name in Snowsight: Admin -> Warehouses. A trial usually has COMPUTE_WH.')
    }

    const tables = await query(
      `SELECT TABLE_NAME FROM ${database}.INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'CATEGORY_GUIDANCE'`,
    ).catch(() => [])

    if (!tables.length) {
      bad(`${database}.${schema}.CATEGORY_GUIDANCE does not exist yet`)
      hint('Expected before the first load. Run data/category-guidance.sql in a Snowsight worksheet.')
    } else {
      const [{ N }] = await query(`SELECT COUNT(*) AS N FROM ${database}.${schema}.CATEGORY_GUIDANCE`)
      if (Number(N) === 24) ok(`CATEGORY_GUIDANCE — ${N} categories, matching the classifier`)
      else {
        bad(`CATEGORY_GUIDANCE holds ${N} rows, expected 24`)
        hint('Re-run data/category-guidance.sql; it replaces the table wholesale.')
      }
    }

    console.log('\nConnected.\n')
    conn.destroy(() => process.exit(0))
  } catch (e) {
    die(`query failed: ${e instanceof Error ? e.message : String(e)}`)
  }
})
