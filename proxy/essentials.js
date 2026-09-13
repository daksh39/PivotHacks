/* ---------------------------------------------------------------------------
 * University essentials: the whole starter kit in one answer.
 *
 * "Give me university essentials" returns one lower-carbon pick for each
 * thing a student moving out for the first time needs. One model call for the
 * set, so it's quick. Context ("under $200") applies to every item, and the
 * budget is enforced per item in code.
 *
 * The model gives up to three candidates per item. Each is looked up on
 * Amazon.ca and the first with a real product page wins, so every pick shown
 * links to an actual listing at its actual price.
 * ------------------------------------------------------------------------- */

const { firstReal } = require('../src/lib/amazonLinks');
const { amazonFetch } = require('./amazon');

const ESSENTIALS = [
  'Laptop', 'Mattress topper', 'Monitor', 'Mini fridge',
  'Desk lamp', 'Kettle', 'Microwave', 'Desk chair',
];

const ASKS = /\b(?:university|uni|college|student|dorm|freshman|first[- ]year|moving[- ]out|campus)\s+(?:essentials|starter\s+(?:kit|pack)|must[- ]haves|basics|checklist|supplies)\b|\bessentials\s+for\s+(?:university|uni|college|a\s+student|students|my\s+dorm|a\s+dorm)\b/i;

function isEssentialsRequest(text) {
  return ASKS.test(String(text || ''));
}

const SYSTEM = `You help a university student in Canada living on their own for the first time:
limited budget, limited experience, busy, in a small unfamiliar space.

For EACH item in the list, give 3 candidate products, best first. Each is a
specific, real, widely sold product that is a lower-carbon choice for that item:
ENERGY STAR or efficient, durable, repairable, or right-sized. Favour affordable,
simple, reliable picks. Use 3 DIFFERENT brands or models, all currently listed on
Amazon.ca, so that if one isn't available another is.

Rules:
- Name a real product. Never invent a model number.
- Name each product the way Amazon.ca lists it TODAY: brand + current product
  line + type (for example "Acer Aspire 3 15.6-inch Laptop"). No discontinued
  models and no SKU codes like "A515-45-R3ZV" — those only turn up spare parts.
- "why": ONE plain sentence naming the mechanism (kWh/year, certification, lifespan).
- typicalPriceCad: usual Amazon.ca price in Canadian dollars, as a number.
- Only products sold on Amazon.ca. All prices and budgets are CAD.
- If no genuine product for an item exists within the context, give no candidates.
  Never lower a price to make something fit.
- co2SavingKgPerYear: a number only if reasoned from energy use, otherwise null.

Reply with JSON only:
{"essentials":[{"item":"Laptop","candidates":[{"title":"...","why":"...","typicalPriceCad":0,"co2SavingKgPerYear":null,"searchQuery":"...","fitsContext":null}]}]}`;

function contextRules(context) {
  if (!context) return '';
  const rules = [];
  if (context.budget) rules.push(`- Every single item must typically cost at most CA$${context.budget} on Amazon.ca. Choose the greenest option within that.`);
  if (context.deadline) rules.push(`- Needed ${context.deadline}: prefer widely stocked models with fast delivery.`);
  if (context.noCar) rules.push('- No car: prefer compact, lightweight, or delivered items.');
  if (context.country) rules.push(`- Only products sold in ${context.country}.`);
  return rules.length
    ? `\n\nBuyer context — applies to every item:\n${rules.join('\n')}\n- fitsContext: ONE short phrase on how the pick fits this context.`
    : '';
}

/*
 * Same question, same answer. The model varies its picks from call to call, so
 * "give me university essentials" spoken, typed, or tapped would each show a
 * different kit. The first answer for a given context is kept and reused;
 * a failed or empty answer is not kept, so the next request tries again.
 */
const answers = new Map();

function contextKey(context) {
  if (!context) return 'none';
  const { budget = null, deadline = null, noCar = false, country = null } = context;
  return JSON.stringify([budget, deadline, Boolean(noCar), country]);
}

/** @returns {Promise<Array<{item:string, alternative:object|null}>>} */
function essentialsFor(context, searchUrlFor) {
  const key = contextKey(context);
  if (!answers.has(key)) {
    const answer = askModel(context, searchUrlFor);
    answers.set(key, answer);
    answer.then((list) => {
      if (!list.some((e) => e.alternative)) answers.delete(key);
    });
  }
  return answers.get(key);
}

function toAlternative(e, context, searchUrlFor) {
  // The model sometimes writes the word "null" instead of null.
  const title = String((e && e.title) || '').trim();
  if (!title || /^(?:null|none|n\/a)$/i.test(title)) return null;
  const price = Number(e.typicalPriceCad);
  // Over budget by its own estimate: not worth looking up.
  if (context && context.budget && Number.isFinite(price) && price > context.budget) return null;
  const saving = Number(e.co2SavingKgPerYear);
  const why = String(e.why || '').trim();
  return {
    source: 'ai',
    title: title.slice(0, 90),
    why: /^null$/i.test(why) ? '' : why.slice(0, 180),
    typicalPriceCad: Number.isFinite(price) && price > 0 ? Math.round(price) : null,
    co2SavingKgPerYear: Number.isFinite(saving) && saving > 0 ? Math.round(saving) : null,
    fitsContext: context && e.fitsContext ? String(e.fitsContext).trim().slice(0, 80) : null,
    url: searchUrlFor(null, e.searchQuery || title),
    estimated: true,
  };
}

async function askModel(context, searchUrlFor) {
  const empty = ESSENTIALS.map((item) => ({ item, alternative: null }));
  if (!process.env.OPENAI_API_KEY) return empty;

  try {
    const budget = (context && context.budget) || null;
    const verify = async (items, unavailable) => {
      const byItem = await requestCandidates(items, context, unavailable);
      return Promise.all(items.map(async (item) => {
        const candidates = (byItem.get(item.toLowerCase()) || [])
          .map((c) => toAlternative(c, context, searchUrlFor))
          .filter(Boolean);
        const alternative = await firstReal(candidates, { budget, fetchImpl: amazonFetch });
        return { item, alternative, tried: candidates.map((c) => c.title) };
      }));
    };

    const first = await verify(ESSENTIALS, []);
    // Items where nothing was a real listing get one more round, told what
    // wasn't available so the model doesn't repeat itself.
    const missing = first.filter((e) => !e.alternative);
    const second = missing.length
      ? await verify(missing.map((e) => e.item), missing.flatMap((e) => e.tried))
      : [];
    const retried = new Map(second.map((e) => [e.item, e.alternative]));

    return first.map(({ item, alternative }) => ({ item, alternative: alternative || retried.get(item) || null }));
  } catch (error) {
    console.warn(`[verte] essentials unavailable: ${error.message}`);
    return empty;
  }
}

/** Items → Map(item lowercased → the model's candidates for it). */
async function requestCandidates(items, context, unavailable) {
  const note = unavailable.length
    ? `\nNot available on Amazon.ca${context && context.budget ? ' within budget' : ''} — do not suggest these again: ${unavailable.join('; ')}`
    : '';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM + contextRules(context) },
        { role: 'user', content: `Items: ${items.join(', ')}${note}` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  return new Map(
    (Array.isArray(parsed.essentials) ? parsed.essentials : [])
      .filter((e) => e && e.item)
      .map((e) => [String(e.item).toLowerCase(), Array.isArray(e.candidates) ? e.candidates : []])
  );
}

module.exports = { ESSENTIALS, isEssentialsRequest, essentialsFor, contextKey };
