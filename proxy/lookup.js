/* ---------------------------------------------------------------------------
 * Assembling a VerteResult.
 *
 * Two kinds of information reach the card and they are kept apart on purpose:
 *
 *   guidance       — from the Snowflake knowledge base. Sourced. A carbon
 *                    figure appears here only with a citation behind it.
 *   alternatives   — model-generated lower-carbon options. Estimates, marked
 *                    as estimates, with search links rather than invented URLs.
 *
 * Anything the page itself reported (a used offer already on the listing) is
 * passed through untouched as `pageOptions` — real prices, real URLs.
 * ------------------------------------------------------------------------- */

const { classifyDeep } = require('./categories');
const { guidanceFor } = require('./guidance');
const { alternativesFor } = require('./alternatives');
const { isSourced } = require('./carbon');

const MAX_OPTIONS = 6;

function rank(options) {
  return [...options]
    .filter((o) => o && Number.isFinite(Number(o.price)) && o.url)
    .map((o) => ({ ...o, price: Number(o.price) }))
    .sort((a, b) => a.price - b.price)
    .slice(0, MAX_OPTIONS);
}

/**
 * @param {object} product   ProductContext from the page
 * @param {Array}  listings  anything secondhand the page itself reported
 * @returns {Promise<object>} VerteResult — always, for any product with a title
 */
async function lookup(product, listings = []) {
  // An unknown category no longer ends the lookup. The knowledge base only
  // covers 24 categories, and treating everything else as "nothing to say"
  // is what made real product pages report themselves as non-products.
  // Without guidance we simply have no sourced figure; the model can still
  // propose alternatives.
  const category = product.category || (await classifyDeep(product.title)) || 'other';
  const guidance = (await guidanceFor(category)) || {
    category,
    verdict: 'check',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: '',
    bulky: false,
  };

  const alternatives = await alternativesFor({ ...product, category }, guidance);
  const pageOptions = guidance.verdict === 'avoid' ? [] : rank(listings);

  const cheapest = pageOptions.length ? pageOptions[0].price : null;
  const newPrice = Number(product.price);
  const savingsUsd =
    Number.isFinite(newPrice) && cheapest !== null && newPrice > cheapest
      ? Math.round((newPrice - cheapest) * 100) / 100
      : null;

  // The sourced manufacturing figure for this category. Shown as what making
  // this thing costs — the baseline every alternative is argued against.
  const embodiedCo2Kg = isSourced(guidance) ? guidance.embodiedCo2Kg : null;

  return {
    product: { ...product, category },
    guidance,
    alternatives,
    pageOptions,
    embodiedCo2Kg,
    co2AvoidedKg: pageOptions.length && isSourced(guidance) ? guidance.embodiedCo2Kg : null,
    savingsUsd,
  };
}

module.exports = { lookup, rank, MAX_OPTIONS };
