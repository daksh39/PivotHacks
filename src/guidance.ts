/* ---------------------------------------------------------------------------
 * The category knowledge base.
 *
 * Static data, so it ships inside the extension. It used to live behind the
 * proxy, which meant the extension could not say anything about a product
 * unless a localhost server happened to be running — the single reason it
 * worked on one machine and not another.
 *
 * A category carries a carbon figure ONLY when co2Source names a real
 * reference. Where none was found, embodiedCo2Kg is 0 and co2Source is empty,
 * and isSourced() suppresses the claim rather than printing an indefensible
 * number.
 * ------------------------------------------------------------------------- */

import type { CategoryGuidance } from './types'

export const GUIDANCE: Record<string, CategoryGuidance> = {
  /* SOURCED. Published smartphone LCAs consistently put manufacturing at
   * 85-95% of a phone's lifetime footprint, around 55 kg CO2e on average —
   * the strongest used-versus-new case of any category we cover. */
  phone: {
    category: 'phone',
    verdict: 'check',
    checkTips: [
      'Ask for the battery health percentage.',
      'Confirm it is not carrier-locked or activation-locked.',
      'Check the IMEI is not blacklisted before paying.',
    ],
    embodiedCo2Kg: 55,
    co2Source:
      'Published smartphone LCAs — ~55 kg CO2e manufacturing, 85-95% of lifetime footprint',
    note: 'Manufacturing is almost the entire footprint of a phone, so a used one avoids nearly all of it.',
    bulky: false,
    useDominant: false,
  },
  'pressure-cooker': {
    category: 'pressure-cooker',
    verdict: 'check',
    checkTips: [
      "Check the lid gasket \u2014 it perishes and is the usual failure.",
      "Confirm the pressure-release valve moves freely.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The pot outlives several gaskets, and gaskets are cheap.",
    bulky: false,
    useDominant: false,
  },
  'air-fryer': {
    category: 'air-fryer',
    verdict: 'check',
    checkTips: [
      "Check the basket coating is not flaking.",
      "Run it once to check the fan and thermostat.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A flaking basket is the one thing worth walking away from.",
    bulky: false,
    useDominant: false,
  },
  toaster: {
    category: 'toaster',
    verdict: 'safe',
    checkTips: [
      "Shake out the crumb tray and check the element glows evenly.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Almost nothing to go wrong.",
    bulky: false,
    useDominant: false,
  },
  'rice-cooker': {
    category: 'rice-cooker',
    verdict: 'check',
    checkTips: [
      "Check the inner pot coating for scratches.",
      "Confirm the keep-warm setting still works.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Inner pots can usually be replaced separately.",
    bulky: false,
    useDominant: false,
  },
  vacuum: {
    category: 'vacuum',
    verdict: 'check',
    checkTips: [
      "Budget for a new filter.",
      "Check the brush bar spins and the hose is not split.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Filters and belts are consumables, not faults.",
    bulky: false,
    useDominant: false,
  },
  humidifier: {
    category: 'humidifier',
    verdict: 'check',
    checkTips: [
      "Check for limescale and mould in the tank.",
      "Confirm the tank seal does not leak.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Hygiene is the thing to inspect, not the motor.",
    bulky: false,
    useDominant: false,
  },
  lamp: {
    category: 'lamp',
    verdict: 'safe',
    checkTips: [
      "Check the switch and that the cord is not frayed.",
      "Bulbs are cheap \u2014 a dead bulb is not a dead lamp.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Nothing meaningful degrades. Ideal used.",
    bulky: false,
    useDominant: false,
  },
  mouse: {
    category: 'mouse',
    verdict: 'check',
    checkTips: [
      "Click every button, including the scroll wheel.",
      "Worn feet are cheap to replace; a failing switch is not.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Switches wear before anything else does.",
    bulky: false,
    useDominant: false,
  },
  keyboard: {
    category: 'keyboard',
    verdict: 'check',
    checkTips: [
      "Test every key.",
      "Ask whether it has been cleaned \u2014 they collect a lot.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Mechanical keyboards in particular outlast several owners.",
    bulky: false,
    useDominant: false,
  },
  speaker: {
    category: 'speaker',
    verdict: 'check',
    checkTips: [
      "Play something at volume and listen for rattle.",
      "Check the charging port if it is portable.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Drivers last a long time; batteries do not.",
    bulky: false,
    useDominant: false,
  },
  'coffee-maker': {
    category: 'coffee-maker',
    verdict: 'check',
    checkTips: [
      "Descale before first use.",
      "Check the carafe and seals for cracks.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Limescale is cosmetic. Cracked seals leak.",
    bulky: false,
    useDominant: false,
  },
  backpack: {
    category: 'backpack',
    verdict: 'safe',
    checkTips: [
      "Run every zip.",
      "Check the base and strap seams, which fail first.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Excellent used. Straps and zips tell you everything.",
    bulky: false,
    useDominant: false,
  },
  /* Every slug proxy/categories.ts can produce needs an entry here, or the
   * lookup 404s and no card ever appears. Verdicts and tips are real advice;
   * carbon stays 0/'' unless a citation exists (§09). */
  'bike-helmet': {
    category: 'bike-helmet',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Single-impact protection, and a helmet that has already been dropped looks identical to one that has not.",
    bulky: false,
    useDominant: false,
  },
  'desk-chair': {
    category: 'desk-chair',
    verdict: 'check',
    checkTips: [
      "Sit on it and check the gas cylinder does not sink.",
      "Test that the recline lock holds.",
    ],
    embodiedCo2Kg: 85,
    co2Source:
      "Herman Miller Aeron Chair Environmental Product Declaration (2016) — 85.3 kg CO2e cradle-to-gate, A1–A3",
    note: "A failed gas cylinder is a real repair, not a quirk.",
    bulky: true,
    useDominant: false,
  },
  'non-stick-pan': {
    category: 'non-stick-pan',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The coating degrades and scratches. Buy cast iron or stainless used instead.",
    bulky: false,
    useDominant: false,
  },
  'smoke-detector': {
    category: 'smoke-detector',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Sensors expire on a fixed schedule from manufacture.",
    bulky: false,
    useDominant: false,
  },
  'surge-protector': {
    category: 'surge-protector',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Protection components wear out invisibly with every surge absorbed.",
    bulky: false,
    useDominant: false,
  },
  'drying-rack': {
    category: 'drying-rack',
    verdict: 'safe',
    checkTips: [
      "Confirm the hinges lock open.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Nothing to go wrong. Always worth checking used first.",
    bulky: false,
    useDominant: false,
  },
  'storage-bin': {
    category: 'storage-bin',
    verdict: 'safe',
    checkTips: [
      "Check for cracks along the base.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "No meaningful risk. Never buy these new.",
    bulky: false,
    useDominant: false,
  },
  pillow: {
    category: 'pillow',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Hygiene, and they are cheap enough new that it does not sting.",
    bulky: false,
    useDominant: false,
  },
  bookshelf: {
    category: 'bookshelf',
    verdict: 'safe',
    checkTips: [
      "Check the shelves are not sagging.",
      "Confirm the wall anchor hardware is included.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Very little that can go wrong.",
    bulky: true,
    useDominant: false,
  },
  dresser: {
    category: 'dresser',
    verdict: 'safe',
    checkTips: [
      "Open every drawer.",
      "Check the back panel is still attached.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Heavy, so favour local pickup over shipping.",
    bulky: true,
    useDominant: false,
  },
  microwave: {
    category: 'microwave',
    verdict: 'safe',
    checkTips: [
      "Check the door latch closes firmly.",
      "The interior should not be scorched or rusted.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A damaged door seal is the one real safety concern.",
    bulky: false,
    useDominant: false,
  },
  textbook: {
    category: 'textbook',
    verdict: 'safe',
    checkTips: [
      "Confirm the edition matches the syllabus.",
      "Ask whether an access code is required and still unused.",
    ],
    embodiedCo2Kg: 3,
    co2Source:
      "Wells et al. 2012, Journal of Industrial Ecology — 2.71 kg CO2e per paperback, cradle-to-gate",
    note: "A previous edition is often fine, and usually a fraction of the price.",
    bulky: false,
    useDominant: false,
  },
  cookware: {
    category: 'cookware',
    verdict: 'safe',
    checkTips: [
      "Surface rust on cast iron is cosmetic and scrubs off.",
      "Check stainless pans sit flat on a counter.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Cast iron and stainless are effectively indestructible.",
    bulky: false,
    useDominant: false,
  },
  bike: {
    category: 'bike',
    verdict: 'safe',
    checkTips: [
      "Inspect the frame for cracks near the welds.",
      "Spin both wheels and check they run true.",
      "Chain, brakes and tyres are cheap to replace.",
    ],
    embodiedCo2Kg: 116,
    co2Source:
      "Trek Bicycle 2021 Sustainability Report — Marlin hardtail, 116 kg CO2e per bike manufactured",
    note: "Frame condition is the only thing that really matters.",
    bulky: false,
    useDominant: false,
  },
  fan: {
    category: 'fan',
    verdict: 'safe',
    checkTips: [
      "Run it on every speed setting.",
      "Check the cage is not bent into the blades.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "No meaningful risk.",
    bulky: false,
    useDominant: false,
  },
  blender: {
    category: 'blender',
    verdict: 'check',
    checkTips: [
      "Inspect the seal and gasket around the blade assembly.",
      "Cracked plastic near the base means leaks.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Seals perish long before motors do.",
    bulky: false,
    useDominant: false,
  },
  kettle: {
    category: 'kettle',
    verdict: 'check',
    checkTips: [
      "Limescale is cosmetic and descales off.",
      "Check the flex and plug for fraying.",
      "Confirm the auto shut-off works.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A failed auto shut-off is the one thing to avoid.",
    bulky: false,
    useDominant: false,
  },
  headphones: {
    category: 'headphones',
    verdict: 'check',
    checkTips: [
      "Budget for replacement ear pads.",
      "Test both channels before paying.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Hygiene is the reason for the caveat, not whether they work.",
    bulky: false,
    useDominant: false,
  },
  'winter-coat': {
    category: 'winter-coat',
    verdict: 'check',
    checkTips: [
      "Run every zip fully up and down.",
      "Check the insulation still lofts rather than sitting flat.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Excellent value used. Flattened insulation cannot be restored.",
    bulky: false,
    useDominant: false,
  },
  'mini-fridge': {
    category: 'mini-fridge',
    verdict: 'safe',
    checkTips: [
      'Check the door seal for cracks or gaps.',
      'Confirm it cools within an hour of plugging in.',
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Compressor appliances last well, but the electricity is the real cost here — a cheap old one is not automatically the greener choice.',
    bulky: true,
    useDominant: true,
  },
  mattress: {
    category: 'mattress',
    verdict: 'avoid',
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Hygiene and pest risk, and compression is permanent. Buy this one new.',
    bulky: true,
    useDominant: false,
  },
  /* SOURCED. Dell publishes a per-product carbon footprint datasheet for the
   * S2421HS 24" monitor: 476 kg CO2e over the full life cycle, of which
   * manufacturing is 67.7% -> ~322 kg. Displays are the strongest case Verte
   * has: the footprint is overwhelmingly in the making, not the using. */
  monitor: {
    category: 'monitor',
    verdict: 'safe',
    checkTips: [
      'Show a white image and look for dead pixels.',
      'Check the corners for backlight bleed in a dark room.',
      'Confirm which cables are included.',
    ],
    embodiedCo2Kg: 322,
    co2Source: 'Dell S2421HS Monitor PCF datasheet — 476 kg CO2e total, 67.7% manufacturing',
    note: 'Most of a display\'s footprint is in the making of it, so a used one avoids nearly all of it.',
    bulky: false,
    useDominant: false,
  },

  /* SOURCED. Apple's Product Environmental Report for the 13-inch MacBook Air
   * puts life-cycle emissions at ~161 kg CO2e with 76% from production. */
  laptop: {
    category: 'laptop',
    verdict: 'check',
    checkTips: [
      'Ask for the battery cycle count.',
      'Confirm it powers on and gets past the setup screen.',
      'Check it is not activation locked to the previous owner.',
    ],
    embodiedCo2Kg: 122,
    co2Source: 'Apple 13-inch MacBook Air Product Environmental Report — 161 kg CO2e, 76% production',
    note: 'Production dominates a laptop\'s footprint. Activation lock is the one thing that makes a cheap one worthless.',
    bulky: false,
    useDominant: false,
  },

  desk: {
    category: 'desk',
    verdict: 'safe',
    checkTips: [
      'Check the drawer runners slide cleanly.',
      "Make sure it isn't particleboard that has been wet.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: 'Ideal used. Solid wood outlives several owners.',
    bulky: true,
    useDominant: false,
  },
  tablet: {
    category: 'tablet',
    verdict: 'check',
    checkTips: [
      'Confirm it is not activation locked to the previous owner.',
      'Ask for the battery health percentage.',
      'Check it still receives OS updates — old tablets get dropped quietly.',
    ],
    embodiedCo2Kg: 59,
    co2Source:
      'Apple iPad (9th generation) Product Environmental Report — 75 kg CO2e life cycle, 78% production',
    note: 'Production dominates a tablet\u2019s footprint. Activation lock is the one thing that makes a cheap one worthless.',
    bulky: false,
    useDominant: false,
  },
  'game-console': {
    category: 'game-console',
    verdict: 'check',
    checkTips: [
      'Confirm it is not banned from online play — ask the seller to sign in.',
      'Listen to the fan under load; a screaming fan means dust or dried paste.',
      'Check the storage is wiped, not just logged out.',
    ],
    embodiedCo2Kg: 89,
    co2Source:
      'University of Cambridge study of the PlayStation 4 — ~89 kg CO2e to manufacture and ship one unit',
    note: 'Consoles last a decade and hold value. The risks are an account ban and a neglected fan, both checkable.',
    bulky: false,
    useDominant: false,
  },
}

/** Null when we could not classify the product — a normal outcome, not an error. */
export function guidanceFor(category: string | null): CategoryGuidance | null {
  if (!category) return null
  return GUIDANCE[category] ?? null
}
