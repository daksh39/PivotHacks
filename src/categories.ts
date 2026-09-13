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
  { slug: 'vacuum', keywords: ["vacuum cleaner", "stick vacuum", "handheld vacuum", "vacuum"] },
  { slug: 'humidifier', keywords: ['humidifier', 'dehumidifier'] },
  { slug: 'mouse', keywords: ["wireless mouse", "gaming mouse", "computer mouse", "mouse"] },
  { slug: 'keyboard', keywords: ['keyboard'] },
  { slug: 'speaker', keywords: ["bluetooth speaker", "smart speaker", "speaker"] },
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
  { slug: 'cookware', keywords: ["cast iron", "stainless", "skillet", "saucepan", "dutch oven", "cookware", "frying pan", "cooking pot", "stock pot", "wok"] },
  { slug: 'bike', keywords: ['bike', 'bicycle', 'cycle'] },
  { slug: 'fan', keywords: ['fan', 'air circulator'] },
  { slug: 'blender', keywords: ['blender', 'smoothie maker'] },
  { slug: 'kettle', keywords: ['kettle'] },
  { slug: 'headphones', keywords: ['headphone', 'earbud', 'earphone', 'headset'] },
  { slug: 'winter-coat', keywords: ['winter coat', 'parka', 'puffer', 'down jacket'] },
  /* "Console table" is furniture. Tested before the games console. */
  { slug: 'bedside-table', keywords: ['console table', 'side table'] },
  { slug: 'game-console', keywords: ["playstation", "nintendo switch", "xbox", "game console", "ps5", "console"] },
  { slug: 'tablet', keywords: ['ipad', 'tablet', 'galaxy tab'] },

  /* --- the rest of the list ------------------------------------------
   * Order inside this block is load-bearing: "paper towel" must be
   * tested before "towel", and every consumable before anything that
   * could swallow it.
   * ------------------------------------------------------------------ */
  { slug: "paper-towel", keywords: ["paper towel", "kitchen roll"] },
  { slug: "toilet-paper", keywords: ["toilet paper", "toilet roll"] },
  { slug: "garbage-bag", keywords: ["garbage bag", "trash bag", "bin liner", "recycling bag"] },
  { slug: "dish-soap", keywords: ["dish soap", "washing up liquid", "dishwasher tablet", "dishwasher pod"] },
  { slug: "laundry-detergent", keywords: ["laundry detergent", "washing powder", "fabric softener"] },
  { slug: "cleaning-spray", keywords: ["cleaning spray", "disinfecting wipe", "disinfectant wipe", "all purpose cleaner"] },
  { slug: "sponge", keywords: ["sponge", "scourer", "scrub pad"] },
  { slug: "printer-ink", keywords: ["printer ink", "ink cartridge", "toner cartridge"] },
  { slug: "printer-paper", keywords: ["printer paper", "copy paper", "a4 paper"] },
  { slug: "pen", keywords: ["ballpoint", "gel pen", "pen set", "rollerball", "pen"] },
  { slug: "highlighter", keywords: ["highlighter", "marker pen", "whiteboard marker", "dry erase marker"] },
  { slug: "sticky-note", keywords: ["sticky note", "post-it", "post it note"] },
  { slug: "electric-toothbrush", keywords: ["electric toothbrush", "sonicare", "oral-b"] },
  { slug: "shaver", keywords: ["electric shaver", "beard trimmer", "hair trimmer", "electric razor"] },
  { slug: "towels", keywords: ["bath towel", "towel set", "hand towel", "towel"] },
  { slug: "bath-mat", keywords: ["bath mat", "bathroom rug"] },
  { slug: "bedsheets", keywords: ["bed sheet", "bedsheet", "fitted sheet", "duvet cover", "pillowcase"] },
  { slug: "duvet", keywords: ["duvet", "comforter", "quilt"] },
  { slug: "mattress-topper", keywords: ["mattress topper", "mattress protector", "mattress pad"] },
  { slug: "toilet-brush", keywords: ["toilet brush", "plunger"] },
  { slug: "shaker-bottle", keywords: ["shaker bottle", "protein shaker"] },
  { slug: "water-bottle", keywords: ["water bottle", "hydro flask", "insulated bottle", "travel mug", "tumbler", "rambler"] },
  { slug: "water-filter", keywords: ["water filter", "brita", "filter pitcher"] },
  { slug: "bike-lock", keywords: ["bike lock", "bicycle lock", "u-lock"] },
  { slug: "tv", keywords: ["smart tv", "television", "qled", "oled tv", "4k tv", "led tv", "uhd tv", "tv"] },
  { slug: "webcam", keywords: ["webcam"] },
  { slug: "router", keywords: ["wifi router", "wi-fi router", "mesh wifi", "wifi 6", "modem"] },
  { slug: "printer", keywords: ["printer", "inkjet", "laserjet", "all-in-one printer"] },
  { slug: "external-drive", keywords: ["external hard drive", "external ssd", "portable ssd", "hard drive", "flash drive", "usb drive", "memory card", "microsd", "ssd"] },
  { slug: "charger", keywords: ["laptop charger", "phone charger", "power adapter", "wall charger", "charging brick"] },
  { slug: "cable", keywords: ["usb-c cable", "hdmi cable", "ethernet cable", "usb cable", "charging cable", "display cable"] },
  { slug: "usb-hub", keywords: ["usb hub", "usb-c hub", "docking station", "dongle"] },
  { slug: "extension-cord", keywords: ["extension cord", "extension lead"] },
  { slug: "controller", keywords: ["controller", "dualsense", "dualshock", "joy-con", "gamepad"] },
  { slug: "streaming-stick", keywords: ["streaming stick", "fire tv stick", "roku", "chromecast", "apple tv 4k"] },
  { slug: "desktop-pc", keywords: ["desktop computer", "gaming pc", "prebuilt pc", "tower pc", "all-in-one pc"] },
  { slug: "pc-part", keywords: ["graphics card", "gpu", "cpu processor", "motherboard", "ddr4", "ddr5", "desktop memory", "power supply unit", "pc case", "cpu cooler", "cpu", "ram", "power supply"] },
  { slug: "alarm-clock", keywords: ["alarm clock", "clock radio"] },
  { slug: "led-strip", keywords: ["led light strip", "led strip", "fairy lights", "string lights"] },
  { slug: "calculator", keywords: ["calculator", "scientific calculator", "graphing calculator"] },
  { slug: "space-heater", keywords: ["space heater", "portable heater", "oil heater"] },
  { slug: "air-purifier", keywords: ["air purifier", "hepa purifier"] },
  { slug: "hair-dryer", keywords: ["hair dryer", "hairdryer", "hair straightener", "curling iron", "flat iron"] },
  { slug: "bathroom-scale", keywords: ["bathroom scale", "body scale", "weighing scale"] },
  { slug: "sandwich-maker", keywords: ["sandwich maker", "panini press", "waffle maker", "grill press"] },
  { slug: "bedside-table", keywords: ["bedside table", "nightstand", "night stand"] },
  { slug: "storage-shelf", keywords: ["storage shelf", "shelving unit", "utility shelf", "wire shelving"] },
  { slug: "drawer-organizer", keywords: ["drawer organizer", "drawer divider", "desk organizer"] },
  { slug: "under-bed-storage", keywords: ["under-bed storage", "under bed storage", "underbed box"] },
  { slug: "hangers", keywords: ["clothes hanger", "coat hanger", "hanger set"] },
  { slug: "laundry-hamper", keywords: ["laundry hamper", "laundry basket", "laundry bag"] },
  { slug: "shoe-rack", keywords: ["shoe rack", "shoe organizer", "shoe cabinet"] },
  { slug: "mirror", keywords: ["mirror", "full-length mirror", "full length mirror"] },
  { slug: "curtains", keywords: ["curtain", "blackout curtain", "blind", "window shade"] },
  { slug: "curtain-rod", keywords: ["curtain rod", "curtain rail", "curtain pole"] },
  { slug: "rug", keywords: ["area rug", "floor rug", "carpet rug", "rug"] },
  { slug: "blanket", keywords: ["blanket", "throw blanket", "fleece blanket"] },
  { slug: "luggage", keywords: ["suitcase", "luggage", "carry-on", "carry on bag"] },
  { slug: "gym-bag", keywords: ["gym bag", "duffel bag", "sports bag", "lunch bag", "lunch box"] },
  { slug: "umbrella", keywords: ["umbrella"] },
  { slug: "shopping-bag", keywords: ["reusable shopping bag", "tote bag", "grocery bag"] },
  { slug: "phone-case", keywords: ["phone case", "phone cover", "laptop sleeve", "laptop case"] },
  { slug: "wallet", keywords: ["wallet", "card holder", "cardholder"] },
  { slug: "mug", keywords: ["coffee mug", "mug set", "ceramic mug"] },
  { slug: "tableware", keywords: ["dinner plate", "plate set", "bowl set", "drinking glass", "glassware", "dinnerware", "plate", "bowl"] },
  { slug: "cutlery", keywords: ["cutlery set", "silverware", "flatware", "utensil set"] },
  { slug: "food-container", keywords: ["food storage container", "meal prep container", "tupperware", "lunch container", "meal prep", "meal-prep", "meal prep"] },
  { slug: "baking-tray", keywords: ["baking tray", "baking sheet", "roasting tin", "cake tin"] },
  { slug: "cutting-board", keywords: ["cutting board", "chopping board"] },
  { slug: "knife", keywords: ["kitchen knife", "chef knife", "knife set", "knife block"] },
  { slug: "kitchen-tool", keywords: ["spatula", "tongs", "can opener", "vegetable peeler", "measuring cup", "measuring spoon", "whisk", "ladle"] },
  { slug: "dish-rack", keywords: ["dish rack", "drying rack for dishes", "dish drainer"] },
  { slug: "mop", keywords: ["mop", "broom", "dustpan", "sweeping brush"] },
  { slug: "microfiber-cloth", keywords: ["microfiber cloth", "microfibre cloth", "cleaning cloth"] },
  { slug: "iron", keywords: ["steam iron", "clothes iron", "garment steamer", "clothes steamer", "iron"] },
  { slug: "ironing-board", keywords: ["ironing board"] },
  { slug: "sewing-kit", keywords: ["sewing kit", "mending kit", "needle and thread"] },
  { slug: "notebook", keywords: ["notebook", "notepad", "journal", "legal pad", "pencil"] },
  { slug: "binder", keywords: ["ring binder", "lever arch", "document folder", "file folder", "binder", "folder"] },
  { slug: "whiteboard", keywords: ["whiteboard", "dry erase board", "cork board", "notice board"] },
  { slug: "yoga-mat", keywords: ["yoga mat", "exercise mat", "pilates mat"] },
  { slug: "weights", keywords: ["dumbbell", "kettlebell", "barbell", "weight plate", "weight bench"] },
  { slug: "resistance-band", keywords: ["resistance band", "exercise band", "pull up bar", "pull-up bar", "foam roller"] },
  { slug: "shower-caddy", keywords: ["shower caddy", "shower organizer", "soap dispenser"] },
  { slug: "smartwatch", keywords: ["smartwatch", "smart watch", "apple watch", "fitness tracker", "fitbit"] },
  { slug: "microphone", keywords: ["microphone", "usb mic", "condenser mic", "shotgun mic"] },
  { slug: "camera", keywords: ["camera", "dslr", "mirrorless", "gopro", "action cam"] },
  { slug: "smart-home", keywords: ["thermostat", "video doorbell", "smart plug", "smart bulb", "security camera"] },
  { slug: "sunglasses", keywords: ["sunglasses", "eyeglasses", "reading glasses"] },
  { slug: "shoes", keywords: ["sneaker", "running shoe", "trainers", "shoe"] },
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
    if (rule.keywords.some((k) => matches(haystack, k))) return rule.slug
  }
  return null
}

/** Compiled once. Building a RegExp per keyword per title is not free. */
const WORD_BOUNDED = new Map<string, RegExp>()

/**
 * Whole-word matching, not substring.
 *
 * A plain `includes` reads "environment" as an iron, "drug" as a rug, "open" as
 * a pen and "ceramic" as RAM. That is not hypothetical: it is what blocked the
 * short, obvious keywords — "tv", "mouse", "plate" — from being added at all,
 * because each one would have misfired somewhere.
 *
 * Boundaries are non-alphanumeric, so a model number like "WH-CH720N" still
 * matches on its parts and "usb-c hub" matches inside a longer title.
 */
function matches(haystack: string, keyword: string): boolean {
  let re = WORD_BOUNDED.get(keyword)
  if (!re) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    /* A trailing plural is still the same word: "Dumbbells" is a dumbbell,
     * "Plates" a plate. Without this the boundary broke every plural title. */
    re = new RegExp(`(?<![a-z0-9])${escaped}(?:e?s)?(?![a-z0-9])`, 'i')
    WORD_BOUNDED.set(keyword, re)
  }
  return re.test(haystack)
}

export const KNOWN_CATEGORIES = RULES.map((r) => r.slug)
