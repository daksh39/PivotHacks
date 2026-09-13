/* ---------------------------------------------------------------------------
 * Buyer context: budget, location, availability, convenience.
 *
 * Read straight out of what the person said or typed ("a laptop under $600,
 * I need it by Friday, I don't have a car"). Plain rules, no model call — so
 * the context that changes a recommendation is deterministic and shows on
 * screen exactly as it was understood.
 * ------------------------------------------------------------------------- */

const COUNTRIES = {
  'united states': 'US', usa: 'US', america: 'US', 'the us': 'US',
  canada: 'CA', 'united kingdom': 'UK', uk: 'UK', britain: 'UK', england: 'UK',
  india: 'IN', australia: 'AU', germany: 'DE', france: 'FR',
};

const DOMAIN_COUNTRY = [['amazon.ca', 'CA'], ['bestbuy.ca', 'CA'], ['amazon.co.uk', 'UK'], ['amazon.com', 'US']];

function budgetFrom(text) {
  const patterns = [
    /(?:under|below|less than|max(?:imum)?|at most|up to|budget(?: of| is)?|no more than)\s*(?:\$|usd\s*|cad\s*)?(\d[\d,]*)/i,
    /\$\s?(\d[\d,]*)/,
    /(\d[\d,]*)\s*(?:dollars|bucks|usd|cad)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1].replace(/,/g, ''));
      if (value > 0) return value;
    }
  }
  return null;
}

function deadlineFrom(text) {
  const match = text.match(
    /\b(today|tonight|tomorrow|asap|as soon as possible|right away|this week|next week|by (?:mon|tues|wednes|thurs|fri|satur|sun)day|by the weekend|in (?:a|one|two|three|\d+) days?)\b/i
  );
  return match ? match[1].toLowerCase() : null;
}

function noCarFrom(text) {
  return /\b(no car|don'?t have a car|do not have a car|without a car|can'?t (?:drive|pick (?:it )?up)|carry it home|walk(?:ing)? (?:it )?home|by bus|on foot)\b/i.test(text);
}

function locationFrom(text, sourceUrl) {
  const lower = text.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRIES)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return code;
  }
  const url = String(sourceUrl || '');
  const byDomain = DOMAIN_COUNTRY.find(([domain]) => url.includes(domain));
  return byDomain ? byDomain[1] : null;
}

/** @returns {{budget:number|null, deadline:string|null, noCar:boolean, country:string|null}} */
function extractContext(text, sourceUrl) {
  const input = String(text || '');
  return {
    budget: budgetFrom(input),
    deadline: deadlineFrom(input),
    noCar: noCarFrom(input),
    country: locationFrom(input, sourceUrl),
  };
}

function hasContext(context) {
  return Boolean(context && (context.budget || context.deadline || context.noCar || context.country));
}

/** Short tags for the screen: "under $600 · by friday · no car · CA" */
function contextTags(context) {
  if (!context) return [];
  return [
    context.budget ? `under $${context.budget}` : null,
    context.deadline ? context.deadline : null,
    context.noCar ? 'no car' : null,
    context.country ? `in ${context.country}` : null,
  ].filter(Boolean);
}

/* Words that carry no product on their own: filler, pronouns, and the context
 * phrases themselves. What's left after removing them is the product, if any. */
const FILLER = new Set(('i im i\'m me my we you it its a an the and or but so to for of in on at by with ' +
  'need want looking look find get buy buying shop shopping some something thing one please can could would ' +
  'dont don\'t do not have has no any just also only really very hi hello hey thanks thank okay ok yes yeah ' +
  'under below less than max maximum most up budget more dollars bucks usd cad car drive pick walk home bus foot ' +
  'today tonight tomorrow asap soon possible right away this next week weekend days day ' +
  'monday tuesday wednesday thursday friday saturday sunday live living country').split(/\s+/));

function namesProduct(text) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/\$?\d[\d,.]*/g, ' ')
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const countries = new Set(Object.keys(COUNTRIES).join(' ').split(' '));
  return words.some((word) => !FILLER.has(word) && !countries.has(word));
}

module.exports = { extractContext, hasContext, contextTags, namesProduct };
