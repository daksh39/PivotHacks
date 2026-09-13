/* ---------------------------------------------------------------------------
 * Title → category slug.  verte-plan.md §08.
 *
 * "Keyword classification before anything clever. It's deterministic,
 * instant, and you can fix a misclassification in five seconds at 3am. A
 * model in this slot is a fine upgrade and a terrible foundation."
 *
 * Model-based classification is #3 on the cut list (§11) — meaning it is the
 * third thing to go, not the third thing to build. Owned by lane/proxy.
 *
 * Rules are checked in order; first match wins, so put the specific ones
 * above the general ones ("mini fridge" before "fridge").
 * ------------------------------------------------------------------------- */

type Rule = { slug: string; keywords: string[] }

const RULES: Rule[] = [
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
]

/**
 * Returns null when nothing matches, which is the signal to render no card at
 * all. A wrong verdict is far worse than no verdict.
 */
export function classify(title: string): string | null {
  const haystack = title.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) return rule.slug
  }
  return null
}

export const KNOWN_CATEGORIES = RULES.map((r) => r.slug)
