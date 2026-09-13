/*
 * Reading secondhand offers off the retailer's own page.
 *
 * This is where every listing on the card comes from — Amazon's used buybox,
 * Best Buy's open-box options. Both are already in the DOM of the page the
 * user is standing on, which is why no API key and no approval process is
 * involved, and why every price and URL we show is real.
 *
 * Retail markup churns. Every selector below is tried in order and a miss
 * costs nothing, so when Amazon reshuffles its offer block the fix is to add
 * one selector here — not to touch anything else.
 */

import { parsePrice } from './extract';

function textOf(root, selector) {
  const el = root.querySelector(selector);
  return el ? el.textContent.trim() : null;
}

/** Amazon shows used offers in the buybox accordion and the "other sellers" strip. */
function fromAmazon(product) {
  const options = [];

  // The used accordion row: "Used - Very Good  $34.00"
  const usedRows = document.querySelectorAll(
    '#usedBuySection, #usedAccordionRow, [id^="aod-offer"], #olpLinkWidget_feature_div'
  );

  for (const row of usedRows) {
    const price =
      parsePrice(textOf(row, '.a-price .a-offscreen')) ??
      parsePrice(textOf(row, '.a-color-price')) ??
      parsePrice(row.textContent);
    if (!price) continue;

    const condition =
      textOf(row, '#aod-offer-heading, .a-text-bold') ||
      (row.textContent.match(/Used\s*-\s*[A-Za-z ]+/) || [])[0] ||
      'Used';

    const link = row.querySelector('a[href]');
    const asin = (window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/) || [])[1];

    options.push({
      source: 'amazon-used',
      title: product.title,
      price,
      url: link
        ? new URL(link.getAttribute('href'), window.location.origin).href
        : asin
        ? `${window.location.origin}/gp/offer-listing/${asin}/?condition=used`
        : window.location.href,
      imageUrl: product.imageUrl,
      condition: condition.trim().slice(0, 40),
    });
  }

  return options;
}

/** Best Buy surfaces open-box pricing in its own summary block. */
function fromBestBuy(product) {
  const options = [];
  const blocks = document.querySelectorAll(
    '.open-box-option, [data-testid="openBox"], .open-box-summary, .openbox-container'
  );

  for (const block of blocks) {
    const price = parsePrice(textOf(block, '.price, [data-testid="customer-price"]')) ??
      parsePrice(block.textContent);
    if (!price) continue;

    const link = block.querySelector('a[href]');
    options.push({
      source: 'bestbuy-openbox',
      title: product.title,
      price,
      url: link ? new URL(link.getAttribute('href'), window.location.origin).href : window.location.href,
      imageUrl: product.imageUrl,
      condition: (textOf(block, '.condition, .open-box-condition') || 'Open-Box').slice(0, 40),
    });
  }

  return options;
}

/**
 * Deduplicates by price — the same offer often appears in two blocks.
 * `host` is a parameter so the adapters can be exercised without a live page.
 */
export function readListings(product, host = window.location.hostname) {
  const found = host.includes('amazon')
    ? fromAmazon(product)
    : host.includes('bestbuy')
    ? fromBestBuy(product)
    : [];

  const seen = new Set();
  return found.filter((option) => {
    // An offer at or above the new price isn't an offer.
    if (product.price && option.price >= product.price) return false;
    if (seen.has(option.price)) return false;
    seen.add(option.price);
    return true;
  });
}
