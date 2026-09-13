/*
 * ProductContext extraction. BUILD_PLAN.md §08.
 *
 * "Scrape JSON-LD before CSS selectors." Retail markup churns and hand-picked
 * selectors rot, so: application/ld+json Product first, og: meta tags second,
 * per-retailer selectors only as a last resort. Amazon and Best Buy publish
 * neither structured data nor og: price, which is exactly why they need
 * adapters and everyone else does not.
 */

/** "$1,299.99" / "1.299,99 €" → 1299.99. Null when there's no number. */
export function parsePrice(text) {
  if (text == null) return null;
  const match = String(text).replace(/[ \s]/g, '').match(/(\d[\d.,]*)/);
  if (!match) return null;
  let raw = match[1];
  // Last separator with 2 trailing digits is the decimal point.
  const dot = raw.lastIndexOf('.');
  const comma = raw.lastIndexOf(',');
  const sep = Math.max(dot, comma);
  if (sep > -1 && raw.length - sep - 1 === 2) {
    raw = raw.slice(0, sep).replace(/[.,]/g, '') + '.' + raw.slice(sep + 1);
  } else {
    raw = raw.replace(/[.,]/g, '');
  }
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function fromJsonLd() {
  const blocks = document.querySelectorAll('script[type="application/ld+json"]');
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block.textContent);
    } catch {
      continue;
    }
    const nodes = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])];
    for (const node of nodes) {
      if (!node || node['@type'] !== 'Product' || !node.name) continue;
      const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      const image = Array.isArray(node.image) ? node.image[0] : node.image;
      return {
        title: String(node.name).trim(),
        price: parsePrice(offer && offer.price),
        currency: (offer && offer.priceCurrency) || 'USD',
        imageUrl: image || null,
      };
    }
  }
  return null;
}

function meta(property) {
  const el =
    document.querySelector(`meta[property="${property}"]`) ||
    document.querySelector(`meta[name="${property}"]`);
  return el ? el.getAttribute('content') : null;
}

function fromOpenGraph() {
  const title = meta('og:title');
  if (!title) return null;
  return {
    title: title.trim(),
    price: parsePrice(meta('og:price:amount') || meta('product:price:amount')),
    currency: meta('og:price:currency') || meta('product:price:currency') || 'USD',
    imageUrl: meta('og:image'),
  };
}

function text(selector) {
  const el = document.querySelector(selector);
  return el ? el.textContent.trim() : null;
}

function fromAmazon() {
  const title = text('#productTitle');
  if (!title) return null;
  const price =
    parsePrice(text('#corePrice_feature_div .a-offscreen')) ??
    parsePrice(text('.priceToPay .a-offscreen')) ??
    parsePrice(text('#price_inside_buybox')) ??
    parsePrice(text('.a-price .a-offscreen'));
  const image = document.querySelector('#landingImage, #imgTagWrapperId img');
  return {
    title,
    price,
    currency: 'USD',
    imageUrl: image ? image.getAttribute('src') : null,
  };
}

function fromBestBuy() {
  const title = text('.sku-title h1, h1.heading-5');
  if (!title) return null;
  return {
    title,
    price:
      parsePrice(text('[data-testid="customer-price"]')) ??
      parsePrice(text('.priceView-customer-price span')),
    currency: 'USD',
    imageUrl: (document.querySelector('.primary-image') || {}).src || null,
  };
}

/**
 * @returns {object|null} ProductContext without a category — the proxy
 * classifies. Null means this isn't a product page and nothing should render.
 */
export function extractProduct(host = window.location.hostname) {
  const adapter = host.includes('amazon') ? fromAmazon : host.includes('bestbuy') ? fromBestBuy : null;

  // A dedicated adapter knows its retailer better than generic og: tags do —
  // Amazon's og:title carries an "Amazon.com:" prefix and no price.
  const found = fromJsonLd() || (adapter && adapter()) || fromOpenGraph();
  if (!found || !found.title) return null;
  found.title = found.title.replace(/^Amazon\.com\s*:\s*/i, '');

  return {
    title: found.title,
    price: found.price ?? null,
    currency: found.currency || 'USD',
    category: '',
    imageUrl: found.imageUrl || null,
    sourceUrl: window.location.href.split('?')[0],
  };
}
