/*
 * Exact product links.
 *
 * The model names a product but can't be trusted with a URL — it invents
 * Amazon IDs that 404. So Verte runs the search it already built, reads the
 * real results, and links to the first genuine (non-sponsored) product whose
 * title actually matches. The ID comes from Amazon's own page, so it exists.
 * If nothing matches well enough, the search link stays: a search is better
 * than a confident link to the wrong product.
 *
 * Runs in the proxy (proxy/amazon.js supplies the fetch), so only picks with a
 * real Amazon.ca product page ever reach the popup or the card. Plain CommonJS
 * so Node can require it and the extension's tests can import it.
 */

const RESULT_START = /<div[^>]*data-component-type="s-search-result"/g;
const MAX_RESULTS = 8;
const TIMEOUT_MS = 6000;

function decode(text) {
  return String(text)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/** Real search results from an Amazon search page's HTML. */
function parseResults(html) {
  const starts = [];
  let match;
  RESULT_START.lastIndex = 0;
  while ((match = RESULT_START.exec(html)) && starts.length < MAX_RESULTS + 4) starts.push(match.index);

  return starts.map((start, i) => {
    const block = html.slice(start, starts[i + 1] || start + 60000);
    const asin = (block.match(/data-asin="([A-Z0-9]{10})"/) || [])[1];
    const title = (block.match(/<h2[^>]*aria-label="([^"]+)"/) || [])[1];
    // Amazon.ca puts the brand in its own heading above the title.
    const headings = [...block.matchAll(/<h2(?![^>]*aria-label)[^>]*>([\s\S]*?)<\/h2>/g)]
      .map((h) => decode(h[1].replace(/<[^>]+>/g, '')).trim())
      .filter((t) => t && t.length < 40 && !/energy star|climate pledge/i.test(t));
    const brand = headings[0] || '';
    // "$39.99" on Amazon.ca, "CAD 549.99" when Amazon localises for Canada.
    const price = (block.match(/class="a-offscreen">\s*(?:(?:US|CA|C)?\$|CAD)\s?([\d,]+(?:\.\d{2})?)</) || [])[1];
    const image = (block.match(/<img[^>]*class="s-image"[^>]*src="([^"]+)"/) || [])[1];
    return {
      asin,
      title: title ? decode(title).replace(/^Sponsored Ad\s*[-–—]\s*/, '') : null,
      brand,
      sponsored: /AdHolder|Sponsored Ad|sspa/.test(block),
      price: price ? Number(price.replace(/,/g, '')) : null,
      image: image || null,
    };
  }).filter((r) => r.asin && r.title);
}

const STOP = new Set(['the', 'and', 'with', 'for', 'of', 'in', 'to', 'a', 'an', 'inch', 'model', 'standard', 'new', 'by']);

function tokens(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    // Single digits stay: the 5 in "Aspire 5" is the model.
    .filter((t) => (t.length > 1 || /\d/.test(t)) && !STOP.has(t));
}

/*
 * What the listing IS, before any "for …" / "compatible with …". A battery
 * "for ASUS Zenbook 14 UX425" names the laptop, but only after "for" — the
 * thing being sold is the battery.
 */
function productName(result) {
  const title = result.title.split(/\s(?:for|compatible|fits|fit|replacement)\b/i)[0];
  return `${result.brand || ''} ${title.split(/[|,(]/)[0]}`;
}

/* A real listing far cheaper than the product's usual price is an accessory
 * or a part, not the product. */
function plausiblePrice(result, estimate) {
  return !(estimate && result.price && result.price < estimate * 0.35);
}

/**
 * The first organic result that is recognisably the named product: the brand
 * (first word) must appear, every model number must appear, and most of the
 * name's other words must too.
 */
function bestMatch(results, wanted) {
  const want = tokens(wanted);
  if (!want.length) return null;
  const brand = want[0];

  for (const result of results.filter((r) => !r.sponsored)) {
    const have = new Set(tokens(`${result.brand || ''} ${result.title}`));
    const name = new Set(tokens(productName(result)));
    if (!name.has(brand)) continue;
    // Sizes and model numbers ("16", "m2", "9310") decide which product it
    // is, so every one of them must match — "Go 16" is not "Go 15". Checked
    // against the name only: specs after it ("Ryzen 7 7730U") would otherwise
    // make "Aspire 7" match an Aspire Go.
    if (!want.filter((t) => /\d/.test(t)).every((t) => name.has(t))) continue;
    const hits = want.filter((t) => have.has(t)).length;
    if (hits / want.length >= 0.5) return result;
  }
  return null;
}

/**
 * When the exact model isn't sold here: the first organic result from the same
 * brand that shares most of the product words, model numbers ignored. The
 * caller shows THIS product's real name and price, never the model's guess.
 */
function closestMatch(results, wanted) {
  const want = tokens(wanted).filter((t) => !/\d/.test(t));
  if (!want.length) return null;
  const brand = want[0];
  for (const result of results.filter((r) => !r.sponsored)) {
    const have = new Set(tokens(`${result.brand || ''} ${result.title}`));
    if (!new Set(tokens(productName(result))).has(brand)) continue;
    if (want.filter((t) => have.has(t)).length / want.length >= 0.5) return result;
  }
  return null;
}

async function fetchText(url, fetchImpl) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller && setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { credentials: 'include', signal: controller && controller.signal });
    return response.ok ? await response.text() : '';
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/*
 * The same pick resolves to the same listing every time it's shown, so the
 * button and a spoken request can't disagree on a link or a price.
 */
const resolved = new Map();

/** For tests: forget every resolved listing. */
function clearResolved() {
  resolved.clear();
}

/** One alternative → the same alternative, with an exact link when found. */
function resolveLink(alternative, fetchImpl = fetch, budget = null) {
  if (!alternative || !alternative.title) return Promise.resolve(alternative);
  const key = `${alternative.url}|${alternative.title}|${alternative.typicalPriceCad || ''}|${budget || ''}`;
  if (!resolved.has(key)) {
    const pending = lookupListing(alternative, fetchImpl, budget);
    resolved.set(key, pending);
    // Only a found listing is worth remembering; a miss may be a network blip.
    pending.then((out) => { if (out === alternative) resolved.delete(key); });
  }
  return resolved.get(key).then((out) => (out === alternative ? out : { ...alternative, ...pick(out) }));
}

function pick({ title, url, searchUrl, exact, livePrice, image }) {
  return { title, url, searchUrl, exact, livePrice, image };
}

async function lookupListing(alternative, fetchImpl, budget) {
  if (!alternative || !alternative.title || !/amazon\.[a-z.]+\/s\?k=/.test(alternative.url || '')) return alternative;
  try {
    const url = new URL(alternative.url);
    const estimate = alternative.typicalPriceCad || null;
    const results = parseResults(await fetchText(url.href, fetchImpl))
      .filter((r) => plausiblePrice(r, estimate));
    // With a budget, the same product line often has a listing that fits
    // (a smaller spec, another seller); look there first.
    const affordable = budget ? results.filter((r) => r.price && r.price <= budget) : results;
    const exact = bestMatch(affordable, alternative.title) || bestMatch(results, alternative.title);
    const match = exact || closestMatch(affordable, alternative.title) || closestMatch(results, alternative.title);
    if (!match) return alternative;
    return {
      ...alternative,
      // Name, link and price all describe the same real listing.
      title: exact ? alternative.title : `${match.brand ? match.brand + ' ' : ''}${match.title}`.slice(0, 90),
      url: `${url.origin}/dp/${match.asin}`,
      searchUrl: alternative.url,
      exact: Boolean(exact),
      livePrice: match.price,
      image: match.image,
    };
  } catch {
    return alternative;   // offline, blocked, timed out — the search still works
  }
}

/**
 * Resolves every link, then enforces the budget against the REAL price where
 * we have one. The model's own price estimate can't be trusted for this: asked
 * for "under $60" it will happily price a laptop at $59.
 */
async function resolveAll(alternatives, { budget = null, fetchImpl = fetch } = {}) {
  const resolved = await Promise.all((alternatives || []).map((a) => resolveLink(a, fetchImpl)));
  return resolved.filter((a) => !(budget && a && a.livePrice && a.livePrice > budget));
}

/* Within budget by the REAL price when we have it, the estimate otherwise.
 * With no price at all, a budget can't be promised. */
function fitsBudget(alternative, budget) {
  if (!budget) return true;
  const price = alternative.livePrice || alternative.typicalPriceCad;
  return Boolean(price) && price <= budget;
}

const isProductPage = (a) => Boolean(a && /amazon\.[a-z.]+\/dp\/[A-Z0-9]{10}/.test(a.url || ''));

/**
 * The model's candidates for one slot, in its order of preference → the first
 * that is a real Amazon product page within budget. An exact model match wins
 * over an earlier candidate that only found the closest listing. Null when
 * none is real: nothing is shown rather than a search or a guess.
 */
async function firstReal(candidates, { budget = null, fetchImpl = fetch } = {}) {
  let closest = null;
  for (const candidate of candidates || []) {
    const found = await resolveLink(candidate, fetchImpl, budget);
    if (!isProductPage(found) || !fitsBudget(found, budget)) continue;
    if (found.exact) return found;
    closest = closest || found;
  }
  return closest;
}

/** Every candidate that is a real product page within budget, no repeats. */
async function allReal(candidates, { budget = null, fetchImpl = fetch, limit = 3 } = {}) {
  const found = await Promise.all((candidates || []).map((c) => resolveLink(c, fetchImpl, budget)));
  const seen = new Set();
  return found
    .filter((a) => isProductPage(a) && fitsBudget(a, budget))
    .filter((a) => !seen.has(a.url) && seen.add(a.url))
    .slice(0, limit);
}

module.exports = {
  parseResults, bestMatch, closestMatch, resolveLink, resolveAll, clearResolved,
  firstReal, allReal, isProductPage,
};
