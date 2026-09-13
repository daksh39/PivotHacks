/* ---------------------------------------------------------------------------
 * University essentials: the whole starter kit in one answer.
 *
 * "Give me university essentials" returns one lower-carbon pick for each
 * thing a student moving out for the first time needs. One model call for the
 * set, so it's quick. Context ("under $200") applies to every item, and the
 * budget is enforced per item in code.
 * ------------------------------------------------------------------------- */

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

For EACH item in the list, recommend ONE specific, real, widely sold product that
is the lower-carbon choice for that item: ENERGY STAR or efficient, durable,
repairable, or right-sized. Favour affordable, simple, reliable picks.

Rules:
- Name a real product with brand and model family. Never invent a model number.
- "why": ONE plain sentence naming the mechanism (kWh/year, certification, lifespan).
- typicalPriceCad: usual Amazon.ca price in Canadian dollars, as a number.
- Only products sold on Amazon.ca. All prices and budgets are CAD.
- If no genuine product for an item exists within the context, set its title to null.
  Never lower a price to make something fit.
- co2SavingKgPerYear: a number only if reasoned from energy use, otherwise null.

Reply with JSON only:
{"essentials":[{"item":"Laptop","title":"...","why":"...","typicalPriceCad":0,"co2SavingKgPerYear":null,"searchQuery":"...","fitsContext":null}]}`;

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

async function askModel(context, searchUrlFor) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return ESSENTIALS.map((item) => ({ item, alternative: null }));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM + contextRules(context) },
          { role: 'user', content: `Items: ${ESSENTIALS.join(', ')}` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const byItem = new Map(
      (Array.isArray(parsed.essentials) ? parsed.essentials : [])
        .filter((e) => e && e.item)
        .map((e) => [String(e.item).toLowerCase(), e])
    );

    return ESSENTIALS.map((item) => {
      const e = byItem.get(item.toLowerCase());
      // The model sometimes writes the word "null" instead of null.
      if (!e || !e.title || /^(?:null|none|n\/a|)$/i.test(String(e.title).trim())) {
        return { item, alternative: null };
      }
      const price = Number(e.typicalPriceCad);
      // Over budget is dropped, not shown with a warning.
      if (context && context.budget && Number.isFinite(price) && price > context.budget) {
        return { item, alternative: null };
      }
      const saving = Number(e.co2SavingKgPerYear);
      return {
        item,
        alternative: {
          source: 'ai',
          title: String(e.title).trim().slice(0, 90),
          why: /^null$/i.test(String(e.why || '').trim()) ? '' : String(e.why || '').trim().slice(0, 180),
          typicalPriceCad: Number.isFinite(price) && price > 0 ? Math.round(price) : null,
          co2SavingKgPerYear: Number.isFinite(saving) && saving > 0 ? Math.round(saving) : null,
          fitsContext: context && e.fitsContext ? String(e.fitsContext).trim().slice(0, 80) : null,
          url: searchUrlFor(null, e.searchQuery || e.title),
          estimated: true,
        },
      };
    });
  } catch (error) {
    console.warn(`[verte] essentials unavailable: ${error.message}`);
    return ESSENTIALS.map((item) => ({ item, alternative: null }));
  }
}

module.exports = { ESSENTIALS, isEssentialsRequest, essentialsFor, contextKey };
