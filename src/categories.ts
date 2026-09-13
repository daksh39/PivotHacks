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
  { slug: 'lamp', keywords: ['desk lamp', 'floor lamp', 'table lamp'] },
  { slug: 'pressure-cooker', keywords: ['pressure cooker', 'instant pot', 'multi-cooker', 'slow cooker'] },
  { slug: 'air-fryer', keywords: ['air fryer'] },
  { slug: 'toaster', keywords: ['toaster'] },
  { slug: 'rice-cooker', keywords: ['rice cooker'] },
  { slug: 'vacuum', keywords: ['vacuum cleaner', 'stick vacuum', 'handheld vacuum'] },
  { slug: 'humidifier', keywords: ['humidifier', 'dehumidifier'] },
  { slug: 'mouse', keywords: ['wireless mouse', 'gaming mouse'] },
  { slug: 'keyboard', keywords: ['keyboard'] },
  { slug: 'speaker', keywords: ['bluetooth speaker', 'smart speaker'] },
  { slug: 'coffee-maker', keywords: ['coffee maker', 'espresso machine', 'french press'] },
  { slug: 'backpack', keywords: ['backpack', 'laptop bag'] },
  { slug: 'desk', keywords: ['desk', 'writing table', 'study table'] },
  { slug: 'bookshelf', keywords: ['bookshelf', 'bookcase', 'shelving unit'] },
  { slug: 'dresser', keywords: ['dresser', 'chest of drawers', 'wardrobe'] },
  { slug: 'microwave', keywords: ['microwave'] },
  { slug: 'monitor', keywords: ['monitor', 'display', 'led screen'] },
  { slug: 'phone', keywords: ['iphone', 'galaxy s2', 'galaxy s9', 'pixel 8', 'pixel 9', 'smartphone'] },
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

/* --- the retailer's own category ----------------------------------------
 * Amazon publishes a breadcrumb and Best Buy returns categoryName. Reading
 * what the site already knows beats guessing from a marketing title, which
 * missed 5 of 12 real products.
 * ----------------------------------------------------------------------- */

/** Department wording → our slug. Matched against the crumb text. */
const DEPARTMENTS: [RegExp, string][] = [
  [/compact refrigerator|mini fridge|beverage refrigerator/i, 'mini-fridge'],
  [/microwave/i, 'microwave'],
  [/\bmonitor/i, 'monitor'],
  [/laptop|notebook computer|chromebook/i, 'laptop'],
  [/cell phones?|smartphones?|mobile phones?/i, 'phone'],
  [/\bmice\b|\bmouse\b/i, 'mouse'],
  [/keyboard/i, 'keyboard'],
  [/headphone|earbud|earphone|headset/i, 'headphones'],
  [/speaker/i, 'speaker'],
  [/mattress/i, 'mattress'],
  [/pillow/i, 'pillow'],
  [/bookcase|bookshelf|shelving/i, 'bookshelf'],
  [/dresser|chest of drawers|wardrobe/i, 'dresser'],
  [/office chair|desk chair|task chair/i, 'desk-chair'],
  [/lamp|lighting/i, 'lamp'],
  [/pressure cooker|slow cooker|multi.?cooker/i, 'pressure-cooker'],
  [/air fryer|deep fryer/i, 'air-fryer'],
  [/toaster/i, 'toaster'],
  [/rice cooker/i, 'rice-cooker'],
  [/vacuum/i, 'vacuum'],
  [/humidifier/i, 'humidifier'],
  [/\bdesks?\b|writing table/i, 'desk'],
  [/cookware|frying pan|saucepan|dutch oven|skillet/i, 'cookware'],
  [/blender|food processor/i, 'blender'],
  [/kettle/i, 'kettle'],
  [/coffee maker|espresso/i, 'coffee-maker'],
  [/\bfans?\b|air circulator/i, 'fan'],
  [/storage|organiser|organizer|bins?\b/i, 'storage-bin'],
  [/backpack|luggage/i, 'backpack'],
  [/textbook|\bbooks?\b/i, 'textbook'],
  [/bicycle|cycling/i, 'bike'],
  [/helmet/i, 'bike-helmet'],
  [/coat|jacket|parka/i, 'winter-coat'],
  [/smoke alarm|carbon monoxide/i, 'smoke-detector'],
  [/surge protector|power strip/i, 'surge-protector'],
  [/drying rack|laundry/i, 'drying-rack'],
]

/**
 * The category the retailer itself assigns.
 *
 * Crumbs run general → specific, so the LAST one that matches wins:
 * "Electronics › Computers & Accessories › Monitors" is a monitor, not
 * whatever "Electronics" might suggest.
 */
export function fromBreadcrumb(crumbs: string[]): string | null {
  for (let i = crumbs.length - 1; i >= 0; i -= 1) {
    for (const [pattern, slug] of DEPARTMENTS) {
      if (pattern.test(crumbs[i])) return slug
    }
  }
  return null
}

/**
 * Returns null when we genuinely cannot tell. That is a normal outcome: the
 * card still shows the saving, just without a verdict.
 *
 * The retailer's own category is tried first because a title is marketing
 * copy — "LED Desk Lamp" is not a desk.
 */
export function classify(title: string, crumbs: string[] = []): string | null {
  const fromSite = fromBreadcrumb(crumbs)
  if (fromSite) return fromSite

  const haystack = title.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) return rule.slug
  }
  return null
}

export const KNOWN_CATEGORIES = RULES.map((r) => r.slug)
