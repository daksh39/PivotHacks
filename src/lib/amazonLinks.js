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
 * Runs in the user's browser (popup and content script), not the proxy.
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
export function parseResults(html) {
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
export function bestMatch(results, wanted) {
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
export function closestMatch(results, wanted) {
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

/** One alternative → the same alternative, with an exact link when found. */
export async function resolveLink(alternative, fetchImpl = fetch) {
  if (!alternative || !alternative.title || !/amazon\.[a-z.]+\/s\?k=/.test(alternative.url || '')) return alternative;
  try {
    const url = new URL(alternative.url);
    const estimate = alternative.typicalPriceCad || null;
    const results = parseResults(await fetchText(url.href, fetchImpl))
      .filter((r) => plausiblePrice(r, estimate));
    const exact = bestMatch(results, alternative.title);
    const match = exact || closestMatch(results, alternative.title);
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
export async function resolveAll(alternatives, { budget = null, fetchImpl = fetch } = {}) {
  const resolved = await Promise.all((alternatives || []).map((a) => resolveLink(a, fetchImpl)));
  return resolved.filter((a) => !(budget && a && a.livePrice && a.livePrice > budget));
}

/**
 * A whole VerteResult with exact links: its alternatives, or for the
 * university essentials each item's pick. An essential whose real price is
 * over budget is dropped to "nothing found", same as the proxy does.
 */
export async function withExactLinks(result, fetchImpl = fetch) {
  if (!result) return result;
  const budget = (result.context && result.context.budget) || null;

  if (result.kind === 'essentials') {
    const essentials = await Promise.all((result.essentials || []).map(async (entry) => {
      if (!entry.alternative) return entry;
      const [alternative = null] = await resolveAll([entry.alternative], { budget, fetchImpl });
      return { ...entry, alternative };
    }));
    return { ...result, essentials };
  }

  if (!Array.isArray(result.alternatives)) return result;
  return { ...result, alternatives: await resolveAll(result.alternatives, { budget, fetchImpl }) };
}
