/* ---------------------------------------------------------------------------
 * The category knowledge base. BUILD_PLAN.md §07.
 *
 * Source of truth is VERTE.PUBLIC.CATEGORY_GUIDANCE in Snowflake, loaded once
 * at boot and cached. A warehouse we can't reach must never cost us a card, so
 * any failure falls back to the built-in table and says so in the log.
 * ------------------------------------------------------------------------- */

const { readFileSync } = require('node:fs');

/* Minimal built-in table — the demo path plus the categories that argue
 * against themselves. Carbon is 0/'' wherever we have no citation, and
 * carbon.js suppresses the claim rather than printing an indefensible number.
 * Snowflake carries the full 24. */
const SEED = {
  'mini-fridge':   { verdict: 'safe',  bulky: true,  embodiedCo2Kg: 0, co2Source: '', note: '',
                     checkTips: ['Check the door seal', 'Confirm it cools within an hour of plugging in'] },
  'desk':          { verdict: 'safe',  bulky: true,  embodiedCo2Kg: 0, co2Source: '', note: '',
                     checkTips: ['Check the drawer runners', "Make sure it isn't particleboard that's been wet"] },
  'monitor':       { verdict: 'safe',  bulky: false, embodiedCo2Kg: 0, co2Source: '', note: '',
                     checkTips: ['Look for dead pixels on a white screen', 'Check for backlight bleed'] },
  'microwave':     { verdict: 'safe',  bulky: true,  embodiedCo2Kg: 0, co2Source: '', note: '',
                     checkTips: ['Check the door latch', "Make sure the interior isn't scorched or rusted"] },
  'laptop':        { verdict: 'check', bulky: false, embodiedCo2Kg: 0, co2Source: '', note: '',
                     checkTips: ['Ask for the battery cycle count', "Verify it isn't activation-locked"] },
  'desk-chair':    { verdict: 'check', bulky: true,  embodiedCo2Kg: 0, co2Source: '', note: '',
                     checkTips: ['Test the gas cylinder — if it sinks under weight, that is a real repair'] },
  'mattress':      { verdict: 'avoid', bulky: true,  embodiedCo2Kg: 0, co2Source: '',
                     note: 'Hygiene and pest risk, and compression is permanent.', checkTips: [] },
  'bike-helmet':   { verdict: 'avoid', bulky: false, embodiedCo2Kg: 0, co2Source: '',
                     note: 'Single-impact protection. You cannot see whether it has already been used.', checkTips: [] },
  'smoke-detector':{ verdict: 'avoid', bulky: false, embodiedCo2Kg: 0, co2Source: '',
                     note: 'Sensors expire.', checkTips: [] },
};

function seedTable() {
  const table = {};
  for (const [category, g] of Object.entries(SEED)) table[category] = { category, ...g };
  return table;
}

function configured() {
  return Boolean(process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USER);
}

/* The driver hands CHECK_TIPS back as either a JSON string or an array
 * depending on version. A row we can't read is dropped, not guessed at — we
 * would rather serve the seed than a verdict we cannot trust. */
function toGuidance(row) {
  const category = String(row.CATEGORY || '');
  const verdict = String(row.VERDICT || '');
  if (!category) return null;
  if (!['safe', 'check', 'avoid'].includes(verdict)) return null;

  let checkTips = [];
  try {
    const raw = row.CHECK_TIPS;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) checkTips = parsed.map(String);
  } catch {
    return null;
  }

  const embodiedCo2Kg = Number(row.EMBODIED_CO2_KG || 0);
  if (!Number.isFinite(embodiedCo2Kg)) return null;

  return {
    category,
    verdict,
    checkTips,
    embodiedCo2Kg,
    co2Source: String(row.CO2_SOURCE || ''),
    note: String(row.NOTE || ''),
    bulky: Boolean(row.BULKY),
  };
}

let cache = null;

async function loadFromSnowflake() {
  if (!configured()) return null;

  const snowflake = require('snowflake-sdk');
  snowflake.configure({ logLevel: 'OFF' });

  const opts = {
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USER,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
    role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
    database: process.env.SNOWFLAKE_DATABASE || 'VERTE',
    schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC',
  };

  const keyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
  if (keyPath) {
    opts.privateKey = readFileSync(keyPath.replace(/^~/, process.env.HOME || '~'), 'utf8');
    opts.authenticator = 'SNOWFLAKE_JWT';
  } else {
    opts.password = process.env.SNOWFLAKE_PASSWORD;
  }

  const conn = snowflake.createConnection(opts);
  await new Promise((res, rej) => conn.connect((e) => (e ? rej(e) : res())));

  const rows = await new Promise((res, rej) =>
    conn.execute({
      sqlText:
        'SELECT CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE, BULKY FROM CATEGORY_GUIDANCE',
      complete: (e, _s, r) => (e ? rej(e) : res(r || [])),
    })
  );

  const table = {};
  let rejected = 0;
  for (const row of rows) {
    const g = toGuidance(row);
    if (g) table[g.category] = g;
    else rejected++;
  }
  if (rejected) console.warn(`[verte] ${rejected} guidance row(s) failed validation`);
  return table;
}

/** Loads once, caches, never throws. */
async function guidanceTable() {
  if (cache) return cache;
  try {
    const table = await loadFromSnowflake();
    if (table && Object.keys(table).length) {
      console.log(`[verte] category guidance from Snowflake — ${Object.keys(table).length} rows`);
      cache = table;
      return cache;
    }
    console.warn('[verte] Snowflake returned no rows, serving the built-in table');
  } catch (error) {
    console.warn(`[verte] Snowflake unavailable, serving the built-in table: ${error.message}`);
  }
  cache = seedTable();
  return cache;
}

/** Null means we know nothing about this category — render no card at all. */
async function guidanceFor(category) {
  const table = await guidanceTable();
  return table[category] || null;
}

module.exports = { guidanceTable, guidanceFor, seedTable, toGuidance, SEED };
