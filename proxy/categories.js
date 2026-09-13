/* ---------------------------------------------------------------------------
 * Title → category slug. BUILD_PLAN.md §08.
 *
 * "Keyword classification before anything clever. It's deterministic, instant,
 * and you can fix a misclassification in five seconds at 3am. A model in this
 * slot is a fine upgrade and a terrible foundation."
 *
 * Rules are checked in order and first match wins, so specific sits above
 * general ("mini fridge" before "fridge"). Slugs match CATEGORY in the
 * Snowflake knowledge base exactly.
 * ------------------------------------------------------------------------- */

const RULES = [
  /* specific first */
  { slug: 'mini-fridge', keywords: ['mini fridge', 'compact refrigerator', 'mini refrigerator', 'dorm fridge'] },
  { slug: 'bike-helmet', keywords: ['bike helmet', 'cycling helmet', 'bicycle helmet'] },
  { slug: 'desk-chair', keywords: ['desk chair', 'office chair', 'task chair', 'gaming chair'] },
  { slug: 'non-stick-pan', keywords: ['non-stick', 'nonstick', 'ceramic pan'] },
  { slug: 'smoke-detector', keywords: ['smoke detector', 'carbon monoxide', 'co detector', 'smoke alarm'] },
  { slug: 'surge-protector', keywords: ['surge protector', 'power strip'] },
  { slug: 'drying-rack', keywords: ['drying rack', 'clothes airer', 'laundry rack'] },
  { slug: 'storage-bin', keywords: ['storage bin', 'storage box', 'plastic tote', 'storage container'] },

  /* general */
  { slug: 'mattress', keywords: ['mattress', 'memory foam bed', 'mattress topper'] },
  { slug: 'pillow', keywords: ['pillow'] },
  { slug: 'desk', keywords: ['desk', 'writing table', 'study table'] },
  { slug: 'bookshelf', keywords: ['bookshelf', 'bookcase', 'shelving unit'] },
  { slug: 'dresser', keywords: ['dresser', 'chest of drawers', 'wardrobe'] },
  { slug: 'microwave', keywords: ['microwave'] },
  { slug: 'monitor', keywords: ['monitor', 'display', 'led screen'] },
  { slug: 'laptop', keywords: ['laptop', 'macbook', 'notebook computer', 'chromebook'] },
  { slug: 'textbook', keywords: ['textbook', 'edition', 'paperback', 'hardcover'] },
  { slug: 'cookware', keywords: ['cast iron', 'stainless', 'skillet', 'saucepan', 'dutch oven', 'cookware'] },
  { slug: 'bike', keywords: ['bike', 'bicycle', 'cycle'] },
  { slug: 'fan', keywords: ['fan', 'air circulator'] },
  { slug: 'blender', keywords: ['blender', 'smoothie maker'] },
  { slug: 'kettle', keywords: ['kettle'] },
  { slug: 'headphones', keywords: ['headphone', 'earbud', 'earphone', 'headset'] },
  { slug: 'winter-coat', keywords: ['winter coat', 'parka', 'puffer', 'down jacket'] },
];

/**
 * Returns null when nothing matches, which is the signal to render no card at
 * all. A wrong verdict is far worse than no verdict.
 */
function classify(title) {
  // Hyphens become spaces so spoken transcripts ("mini-fridge") match too.
  const haystack = String(title || '').toLowerCase().replace(/-/g, ' ');
  for (const rule of RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) return rule.slug;
  }
  return null;
}

const KNOWN_CATEGORIES = RULES.map((r) => r.slug);

module.exports = { classify, KNOWN_CATEGORIES, RULES };

/* ---------------------------------------------------------------------------
 * Optional model fallback. BUILD_PLAN.md §08, §11 (#3 on the cut list — the
 * third thing to go, not the third thing to build).
 *
 * Runs ONLY when the rules above return null, and its answer is constrained to
 * KNOWN_CATEGORIES — anything else is discarded. With no OPENAI_API_KEY set,
 * this is a no-op and the proxy runs on keyword rules alone.
 * ------------------------------------------------------------------------- */

async function classifyWithModel(title) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 12,
        messages: [
          {
            role: 'system',
            content:
              'You map a retail product title to exactly one category slug from this list, or to "none" if no slug fits. ' +
              'Reply with the slug alone and nothing else. Slugs: ' +
              KNOWN_CATEGORIES.join(', '),
          },
          { role: 'user', content: String(title).slice(0, 300) },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`[verte] classifier fallback HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const slug = (data.choices?.[0]?.message?.content || '').trim().toLowerCase();

    // A slug we don't recognise is discarded, not trusted.
    return KNOWN_CATEGORIES.includes(slug) ? slug : null;
  } catch (error) {
    console.warn(`[verte] classifier fallback unavailable: ${error.message}`);
    return null;
  }
}

/** Rules first, model second, null if neither is sure. */
async function classifyDeep(title) {
  return classify(title) || (await classifyWithModel(title));
}

module.exports.classifyWithModel = classifyWithModel;
module.exports.classifyDeep = classifyDeep;
