/**
 * Product title to category slug.
 *
 * Deterministic keyword rules on purpose. They are instant, they cost nothing,
 * and when something misclassifies at 3am you fix it by adding a word to a list.
 * A model here is a fine upgrade later and a bad foundation now.
 *
 * Order matters. First rule whose `match` hits and whose `exclude` does not, wins.
 * Put narrow rules above broad ones: nonstick before cookware, helmet before bike.
 */

type Rule = {
  category: string;
  match: string[];
  exclude?: string[];
};

const RULES: Rule[] = [
  // Narrow rules first, these are the ones that get stolen by broader matches.
  { category: "bike-helmet", match: ["bike helmet", "cycling helmet", "bicycle helmet"] },
  { category: "cookware-nonstick", match: ["nonstick", "non-stick", "ptfe", "teflon", "ceramic coated"] },
  { category: "smoke-detector", match: ["smoke detector", "smoke alarm", "carbon monoxide detector", "co detector"] },
  { category: "surge-protector", match: ["surge protector", "power strip", "extension lead", "surge suppressor"] },

  { category: "mini-fridge", match: ["mini fridge", "mini-fridge", "compact refrigerator", "dorm fridge", "beverage cooler"] },
  { category: "microwave", match: ["microwave"] },
  { category: "monitor", match: ["monitor", "display"], exclude: ["monitor stand", "monitor arm", "baby monitor"] },
  { category: "laptop", match: ["laptop", "macbook", "notebook computer", "chromebook", "thinkpad"] },

  { category: "desk-chair", match: ["desk chair", "office chair", "task chair", "ergonomic chair", "gaming chair"] },
  { category: "desk", match: ["desk", "writing table", "computer table"], exclude: ["desk chair", "desk lamp", "desk organizer", "desk mat", "desk pad"] },
  { category: "bookshelf", match: ["bookshelf", "bookcase", "shelving unit", "book shelf"] },
  { category: "dresser", match: ["dresser", "chest of drawers", "wardrobe", "drawer unit", "armoire"] },

  { category: "mattress", match: ["mattress"], exclude: ["mattress protector", "mattress cover"] },
  { category: "pillow", match: ["pillow"], exclude: ["pillowcase", "pillow cover", "throw pillow"] },

  { category: "blender", match: ["blender", "food processor", "smoothie maker"] },
  { category: "kettle", match: ["kettle", "water boiler"] },
  { category: "cookware-durable", match: ["cast iron", "stainless steel pan", "stainless steel pot", "skillet", "saucepan", "dutch oven", "frying pan", "cookware set"] },

  { category: "headphones", match: ["headphone", "headset", "earbuds", "earphones", "airpods"] },
  { category: "winter-coat", match: ["winter coat", "parka", "puffer jacket", "down jacket", "insulated jacket"] },
  { category: "bike", match: ["bike", "bicycle"], exclude: ["bike helmet", "bike lock", "bike pump", "bike light", "exercise bike", "bike rack", "motorcycle"] },

  { category: "textbook", match: ["textbook", "study guide", "course reader"] },
  { category: "storage-bins", match: ["storage bin", "storage box", "storage container", "plastic tote", "storage cube"] },
  { category: "drying-rack", match: ["drying rack", "clothes airer", "laundry rack"] },
  { category: "fan", match: ["fan"], exclude: ["fan art", "ceiling fan", "exhaust fan"] },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whole-word match, tolerating a plural suffix.
 *
 * Substring matching is wrong here and the failures are not obvious:
 * "fan" appears inside "infant", "cycle" inside "recycled", "desk" inside
 * "deskside". Anchoring to word boundaries costs nothing and removes a class
 * of misclassification you would otherwise find at 3am.
 */
const hasTerm = (haystack: string, term: string) =>
  new RegExp(`\\b${escape(term)}(?:s|es)?\\b`).test(haystack);

/**
 * Returns a category slug, or null when nothing matches.
 *
 * null is a normal outcome. Most pages on the internet are not products we
 * have guidance for, and the card should stay hidden rather than guess.
 */
export function classify(title: string): string | null {
  const t = title.toLowerCase();

  for (const rule of RULES) {
    if (rule.exclude?.some((term) => hasTerm(t, term))) continue;
    if (rule.match.some((term) => hasTerm(t, term))) return rule.category;
  }

  return null;
}

/** Exposed so a debug endpoint can list what we cover. */
export const KNOWN_CATEGORIES = RULES.map((r) => r.category);
