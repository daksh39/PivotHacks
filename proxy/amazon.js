/* ---------------------------------------------------------------------------
 * Reading Amazon.ca search pages from the proxy.
 *
 * Node's built-in fetch is turned away by Amazon (HTTP 503); the plain https
 * client with browser headers is served normally. Pages are cached for a
 * while and requests are capped a few at a time, so checking a whole kit of
 * essentials doesn't look like a flood.
 * ------------------------------------------------------------------------- */

const https = require('https');
const zlib = require('zlib');

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-CA,en;q=0.9',
  'accept-encoding': 'gzip',
};
const TIMEOUT_MS = 10000;
const CACHE_MS = 30 * 60 * 1000;
const MAX_CONCURRENT = 4;

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: HEADERS }, (res) => {
      const body = res.headers['content-encoding'] === 'gzip' ? res.pipe(zlib.createGunzip()) : res;
      const chunks = [];
      body.on('data', (c) => chunks.push(c));
      body.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
      body.on('error', reject);
    });
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

let active = 0;
const waiting = [];
async function limited(task) {
  if (active >= MAX_CONCURRENT) await new Promise((go) => waiting.push(go));
  active += 1;
  try {
    return await task();
  } finally {
    active -= 1;
    if (waiting.length) waiting.shift()();
  }
}

const pages = new Map();

/** fetch-shaped, for src/lib/amazonLinks.js: (url) → { ok, text() } */
async function amazonFetch(url) {
  const hit = pages.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ok: true, text: async () => hit.text };

  let res = await limited(() => get(url));
  if (res.status === 503) {
    // Amazon sheds load now and then; one polite retry.
    await new Promise((r) => setTimeout(r, 1000));
    res = await limited(() => get(url));
  }
  const ok = res.status === 200 && res.text.includes('s-search-result');
  if (ok) pages.set(url, { at: Date.now(), text: res.text });
  else console.warn(`[verte] amazon.ca ${res.status} for ${url}`);
  return { ok, text: async () => (ok ? res.text : '') };
}

module.exports = { amazonFetch };
