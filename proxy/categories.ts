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
  { slug: 'headphones', keywords: ['headphone', 'earbud', 'earphone', 'headset', 'airpods'] },
  { slug: 'winter-coat', keywords: ['winter coat', 'parka', 'puffer', 'down jacket'] },

  /* --- the long tail -----------------------------------------------------
   * Added after measuring what a judge actually opens: of 40 plausible
   * products, 23 matched no keyword at all and so never reached the table.
   * Order still matters — a controller is a PlayStation product, a Kindle is
   * not a tablet, and "vacuum insulated" is a water bottle. Specific first.
   * --------------------------------------------------------------------- */
  { slug: "game-controller", keywords: ["controller", "dualsense", "dualshock", "joy-con", "gamepad"] },
  { slug: "game-console", keywords: ["playstation", "nintendo switch", "xbox", "game console", "ps5", "ps4"] },
  { slug: "e-reader", keywords: ["kindle", "kobo", "e-reader", "ereader", "paperwhite"] },
  { slug: "tablet", keywords: ["ipad", "tablet", "galaxy tab"] },
  { slug: "smart-tv", keywords: ["smart tv", "television", "qled", "oled tv", "4k tv", "led tv", "uhd tv"] },
  { slug: "camera", keywords: ["camera", "dslr", "mirrorless", "gopro"] },
  { slug: "keyboard", keywords: ["keyboard"] },
  { slug: "computer-mouse", keywords: ["mouse"] },
  { slug: "speaker", keywords: ["bluetooth speaker", "soundbar", "smart speaker", "portable speaker"] },
  { slug: "router", keywords: ["wifi router", "wi-fi router", "mesh wifi", "wifi 6", "modem"] },
  { slug: "printer", keywords: ["printer", "inkjet", "laser printer"] },
  { slug: "power-bank", keywords: ["power bank", "powerbank", "portable charger"] },
  { slug: "water-bottle", keywords: ["water bottle", "hydro flask", "insulated bottle", "tumbler", "travel mug", "rambler"] },
  { slug: "water-filter", keywords: ["water filter", "brita", "filter pitcher"] },
  { slug: "multi-cooker", keywords: ["instant pot", "pressure cooker", "slow cooker", "crock-pot", "crockpot", "air fryer", "rice cooker"] },
  { slug: "coffee-maker", keywords: ["coffee maker", "coffee machine", "espresso", "nespresso", "keurig", "french press", "drip coffee"] },
  { slug: "vacuum", keywords: ["vacuum cleaner", "cordless vacuum", "robot vacuum", "stick vacuum", "upright vacuum"] },
  { slug: "air-purifier", keywords: ["air purifier", "hepa purifier"] },
  { slug: "fitness-tracker", keywords: ["fitness tracker", "smartwatch", "smart watch", "apple watch", "fitbit"] },
  { slug: "backpack", keywords: ["backpack", "rucksack", "daypack"] },
  { slug: "luggage", keywords: ["suitcase", "luggage", "carry-on"] },
  { slug: "shoes", keywords: ["sneaker", "running shoe", "shoes"] },
  { slug: "toys", keywords: ["lego", "building blocks", "wooden blocks", "board game", "jigsaw puzzle"] },
  { slug: "electric-toothbrush", keywords: ["electric toothbrush", "sonicare", "oral-b"] },
  { slug: "memory-card", keywords: ["microsd", "memory card", "sd card", "flash drive", "usb drive"] },
  { slug: "external-drive", keywords: ["external hard drive", "external ssd", "portable ssd", "hard drive"] },
  { slug: "webcam", keywords: ["webcam"] },
  { slug: "microphone", keywords: ["microphone", "usb mic", "condenser mic", "shotgun mic"] },
  { slug: "streaming-stick", keywords: ["streaming stick", "fire tv stick", "roku", "chromecast", "apple tv 4k"] },
  { slug: "smart-home", keywords: ["thermostat", "video doorbell", "smart plug", "smart bulb", "security camera"] },
  { slug: "hair-dryer", keywords: ["hair dryer", "hairdryer", "hair straightener", "curling iron", "flat iron"] },
  { slug: "sunglasses", keywords: ["sunglasses"] },
  { slug: "weights", keywords: ["dumbbell", "kettlebell", "barbell", "weight plate", "weight bench"] },
  { slug: "exercise-machine", keywords: ["exercise bike", "treadmill", "elliptical", "rowing machine"] },
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
