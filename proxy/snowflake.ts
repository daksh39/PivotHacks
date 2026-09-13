/* ---------------------------------------------------------------------------
 * The category knowledge base.  Layer 3 (verte-plan.md §03).  Owned by
 * lane/snowflake.
 *
 * ┌─ THE SEAM ────────────────────────────────────────────────────────────┐
 * │ This exported signature is FROZEN. lane/snowflake owns the body of    │
 * │ this file and data/*.sql. lane/proxy only ever CALLS it and never     │
 * │ opens this file. That is the whole reason neither branch conflicts.   │
 * │                                                                       │
 * │   getCategoryGuidance(slug) : Promise<CategoryGuidance | null>        │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Returning null means "no card at all" — proxy/index.ts answers 404 and the
 * extension renders nothing. A wrong verdict is far worse than no verdict, so
 * every slug proxy/categories.ts can emit MUST have a row here. The test
 * beside this file fails if one goes missing.
 *
 * ┌─ SNOWFLAKE IS AN UPGRADE, NEVER A DEPENDENCY ─────────────────────────┐
 * │ Reads come from VERTE.PUBLIC.CATEGORY_GUIDANCE when .env carries      │
 * │ credentials, and from the SEED below when it does not. Every failure  │
 * │ path — no credentials, connect refused, query error, a malformed row  │
 * │ — falls back to SEED and logs. The card must never depend on a        │
 * │ warehouse being reachable from a conference wifi network.             │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * The table is 24 rows, so the first call fetches all of it and everything
 * after is served from memory. Load it with:
 *
 *     npx tsx proxy/snowflake.load.ts     # data/category-guidance.sql
 *     npx tsx proxy/snowflake.check.ts    # diagnose a connection
 *
 * Queries go through this proxy, never from the extension (§03).
 * ------------------------------------------------------------------------- */

import type { CategoryGuidance } from '../src/types'

const SEED: Record<string, CategoryGuidance> = {
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
    co2Source: 'Herman Miller Aeron Chair Environmental Product Declaration (2016) — 85.3 kg CO2e cradle-to-gate, A1–A3',
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
    co2Source: 'Wells et al. 2012, Journal of Industrial Ecology — 2.71 kg CO2e per paperback, cradle-to-gate',
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
    co2Source: 'Trek Bicycle 2021 Sustainability Report — Marlin hardtail, 116 kg CO2e per bike manufactured',
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

  /* --- the long tail -------------------------------------------------
   * No carbon figure on any of these: §09, a number only ships with a
   * citation behind it, and nobody has sourced these yet. The card
   * suppresses the claim entirely rather than printing 0.
   * ------------------------------------------------------------------ */
  "game-controller": {
    category: "game-controller",
    verdict: "check",
    checkTips: [
      "Test both sticks in a drift checker before the return window closes.",
      "Press every face and shoulder button \u2014 worn switches feel mushy.",
      "Check the battery still holds a charge through a full session.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Stick drift is the one failure that makes a cheap controller worthless, and it is easy to test in a minute.",
    bulky: false,
    useDominant: false,
  },
  "game-console": {
    category: "game-console",
    verdict: "check",
    checkTips: [
      "Confirm it is not banned from online play \u2014 ask the seller to sign in.",
      "Listen to the fan under load; a screaming fan means dust or dried paste.",
      "Check the disc drive reads and the storage is wiped, not just logged out.",
    ],
    embodiedCo2Kg: 89,
    co2Source: 'University of Cambridge study of the PlayStation 4 — ~89 kg CO2e to manufacture and ship one unit',
    note: "Consoles last a decade and hold value. The risks are an account ban and a neglected fan, both checkable.",
    bulky: false,
    useDominant: false,
  },
  "e-reader": {
    category: "e-reader",
    verdict: "check",
    checkTips: [
      "Look for cracks under the glass \u2014 e-ink screens do not survive a drop.",
      "Confirm it is deregistered from the previous owner's account.",
      "Ask how long a charge lasts; an old battery is the usual reason for selling.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "E-ink barely ages, so a used one is close to a new one. A screen crack is the thing that ends it.",
    bulky: false,
    useDominant: false,
  },
  "tablet": {
    category: "tablet",
    verdict: "check",
    checkTips: [
      "Confirm it is not activation locked to the previous owner.",
      "Ask for the battery health percentage.",
      "Check it still receives OS updates \u2014 old tablets get dropped quietly.",
    ],
    embodiedCo2Kg: 59,
    co2Source: 'Apple iPad (9th generation) Product Environmental Report — 75 kg CO2e life cycle, 78% production',
    note: "Production dominates a tablet's footprint. Activation lock is the one thing that makes a cheap one worthless.",
    bulky: false,
    useDominant: false,
  },
  "smart-tv": {
    category: "smart-tv",
    verdict: "check",
    checkTips: [
      "Have it powered on before you commit \u2014 look for lines, dark patches or dead pixels.",
      "Check the panel for pressure marks, which show as clouding on a white screen.",
      "Confirm the stand and remote are included.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A panel fault is invisible on a switched-off screen, and it is the only defect that really matters.",
    bulky: false,
    useDominant: false,
  },
  "camera": {
    category: "camera",
    verdict: "check",
    checkTips: [
      "Ask for the shutter count \u2014 it is a camera's odometer.",
      "Shoot a plain bright surface and look for sensor dust spots.",
      "Check the lens mount and threads for dents.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Bodies are built for far more actuations than most owners ever use, so a low shutter count is a genuinely good buy.",
    bulky: false,
    useDominant: false,
  },
  "keyboard": {
    category: "keyboard",
    verdict: "safe",
    checkTips: [
      "Test every key in an online key tester.",
      "Check the cable or the battery, whichever it uses.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Mechanical switches outlive several owners and anything broken is obvious in thirty seconds.",
    bulky: false,
    useDominant: false,
  },
  "computer-mouse": {
    category: "computer-mouse",
    verdict: "check",
    checkTips: [
      "Click each button twenty times and listen for double-clicks.",
      "Check the feet and the scroll wheel for wear.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Switches wear out before anything else, and a double-clicking mouse is unusable for work.",
    bulky: false,
    useDominant: false,
  },
  "speaker": {
    category: "speaker",
    verdict: "safe",
    checkTips: [
      "Play something bass-heavy and listen for buzzing from a blown driver.",
      "Check the charging port is not loose.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Drivers and cabinets do not age much. A blown speaker announces itself immediately.",
    bulky: false,
    useDominant: false,
  },
  "router": {
    category: "router",
    verdict: "check",
    checkTips: [
      "Check the manufacturer still ships firmware updates for that model.",
      "Factory reset it before use \u2014 never trust an inherited configuration.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A router with no security updates is a liability on your network, so the model's support status matters more than its age.",
    bulky: false,
    useDominant: false,
  },
  "printer": {
    category: "printer",
    verdict: "check",
    checkTips: [
      "Price the cartridges before you buy \u2014 they often cost more than the printer.",
      "Print a test page; a clogged inkjet head is usually unfixable.",
      "Laser printers survive storage far better than inkjets.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The purchase price is the small part. A cheap used inkjet with expensive clogged heads is no bargain.",
    bulky: true,
    useDominant: false,
  },
  "power-bank": {
    category: "power-bank",
    verdict: "avoid",
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Lithium cells degrade with every cycle and with age, and a used pack's history is unknowable. A damaged cell is a fire risk. Buy this one new.",
    bulky: false,
    useDominant: false,
  },
  "water-bottle": {
    category: "water-bottle",
    verdict: "avoid",
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "You cannot verify how a bottle was cleaned or what was kept in it, and the seal and straw are where that matters. Buy this one new.",
    bulky: false,
    useDominant: false,
  },
  "water-filter": {
    category: "water-filter",
    verdict: "avoid",
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A filter's job is what it has already absorbed. Buying that history secondhand defeats the point. Buy this one new.",
    bulky: false,
    useDominant: false,
  },
  "multi-cooker": {
    category: "multi-cooker",
    verdict: "check",
    checkTips: [
      "Inspect the sealing ring \u2014 it holds smells and is the usual thing that fails.",
      "Confirm the pressure release valve moves freely.",
      "Check the inner pot coating is not scratched through.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The body lasts for years and the two parts that do not \u2014 the ring and the valve \u2014 are cheap to replace.",
    bulky: false,
    useDominant: false,
  },
  "coffee-maker": {
    category: "coffee-maker",
    verdict: "check",
    checkTips: [
      "Ask when it was last descaled; scale is what kills these.",
      "Run a cycle and check for leaks around the seals.",
      "Confirm the basket, carafe and any pods system are all there.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A descaled machine lasts a decade. A neglected one is a repair job, and you can tell which you are looking at.",
    bulky: false,
    useDominant: false,
  },
  "vacuum": {
    category: "vacuum",
    verdict: "check",
    checkTips: [
      "Check the filter and whether replacements are still sold.",
      "For a cordless, ask how long it runs on a full charge.",
      "Look at the brush roll for hair damage and worn bristles.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Motors long outlast batteries and filters. Price the consumables before you decide it is a bargain.",
    bulky: true,
    useDominant: false,
  },
  "air-purifier": {
    category: "air-purifier",
    verdict: "check",
    checkTips: [
      "Price a replacement filter \u2014 assume you will need one immediately.",
      "Check the unit's filter indicator has been reset, not ignored.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The machine is fine used. Always budget for a new filter on day one \u2014 the old one is not worth inheriting.",
    bulky: true,
    useDominant: false,
  },
  "fitness-tracker": {
    category: "fitness-tracker",
    verdict: "check",
    checkTips: [
      "Confirm it is unpaired and removed from the previous owner's account.",
      "Ask for battery life in real terms \u2014 these degrade fast.",
      "Check whether the strap is a standard size you can replace.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Account locks and tired batteries are the two things that turn a cheap tracker into a paperweight.",
    bulky: false,
    useDominant: false,
  },
  "backpack": {
    category: "backpack",
    verdict: "safe",
    checkTips: [
      "Run every zip end to end.",
      "Check the shoulder strap stitching where it meets the body.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Bags are built for years of abuse, and everything that fails is visible from the outside.",
    bulky: false,
    useDominant: false,
  },
  "luggage": {
    category: "luggage",
    verdict: "safe",
    checkTips: [
      "Roll it \u2014 wheels and bearings are what wear out.",
      "Extend and retract the handle a few times.",
      "Check the shell for cracks around the corners.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A hard case survives far more trips than one owner takes. Wheels and handles are the only real wear points.",
    bulky: true,
    useDominant: false,
  },
  "shoes": {
    category: "shoes",
    verdict: "check",
    checkTips: [
      "Look at the sole tread and the midsole for compression creases.",
      "Check the heel counter still holds its shape.",
      "Running shoes lose cushioning well before they look worn out.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Fine for casual and fashion pairs. For running, worn midsoles are a genuine injury risk however good they look.",
    bulky: false,
    useDominant: false,
  },
  "toys": {
    category: "toys",
    verdict: "check",
    checkTips: [
      "Check the piece count against the box \u2014 missing pieces are the norm.",
      "Look up the model for a safety recall.",
      "For anything with small parts, check the age rating matches.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Toys are one of the strongest secondhand cases: barely used, and children outgrow them long before they wear out.",
    bulky: false,
    useDominant: false,
  },
  "electric-toothbrush": {
    category: "electric-toothbrush",
    verdict: "avoid",
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "A used toothbrush handle cannot be meaningfully sanitised where it matters, around the head seal. Buy this one new.",
    bulky: false,
    useDominant: false,
  },
  "memory-card": {
    category: "memory-card",
    verdict: "avoid",
    checkTips: [],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Flash memory wears out silently with use, and the secondhand market for cards is full of relabelled fakes. Buy this one new.",
    bulky: false,
    useDominant: false,
  },
  "external-drive": {
    category: "external-drive",
    verdict: "check",
    checkTips: [
      "Ask for the SMART power-on hours before you buy.",
      "Run a full read test on arrival, while you can still return it.",
      "Never keep your only copy of anything on a used drive.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Enclosures and interfaces last, but a drive's remaining life is the whole question \u2014 and SMART data answers it honestly.",
    bulky: false,
    useDominant: false,
  },
  "webcam": {
    category: "webcam",
    verdict: "safe",
    checkTips: [
      "Plug it in and check the autofocus settles.",
      "Confirm the mount still grips a monitor.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Nothing inside wears out, and anything broken shows up the first time you open it.",
    bulky: false,
    useDominant: false,
  },
  "microphone": {
    category: "microphone",
    verdict: "safe",
    checkTips: [
      "Record a test clip and listen for crackle on the capsule.",
      "Check the stand thread and the shock mount are included.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Microphones are famously durable \u2014 studios run the same ones for decades.",
    bulky: false,
    useDominant: false,
  },
  "streaming-stick": {
    category: "streaming-stick",
    verdict: "check",
    checkTips: [
      "Factory reset it so it is off the previous owner's account.",
      "Check the model still gets app updates \u2014 old sticks lose Netflix quietly.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The hardware is fine. What dates these is app support, so the model year matters more than the condition.",
    bulky: false,
    useDominant: false,
  },
  "smart-home": {
    category: "smart-home",
    verdict: "check",
    checkTips: [
      "Confirm it has been removed from the previous owner's account \u2014 many are useless until it is.",
      "Check the model still receives security updates.",
      "For anything wired, confirm the mounting plate and screws are included.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "The one thing that bricks these is an account the seller forgot to release, and it is free to check before you pay.",
    bulky: false,
    useDominant: false,
  },
  "hair-dryer": {
    category: "hair-dryer",
    verdict: "check",
    checkTips: [
      "Run it on every heat setting and smell for burning.",
      "Check the cord where it meets the body for kinks.",
      "Look at the plates or filter for scorching and residue.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Motors and elements last well. A frayed cord is the one fault worth walking away from.",
    bulky: false,
    useDominant: false,
  },
  "sunglasses": {
    category: "sunglasses",
    verdict: "check",
    checkTips: [
      "Hold the lenses to the light at an angle to find scratches.",
      "Check the hinges are tight and the frame is not sprung.",
      "Ask whether the lenses are still the original UV-coated ones.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Frames outlive lenses. A scratched or relensed pair may no longer block what it claims to.",
    bulky: false,
    useDominant: false,
  },
  "weights": {
    category: "weights",
    verdict: "safe",
    checkTips: [
      "Check adjustable dumbbells lock at every setting.",
      "Look for cracks in rubber coating, which is cosmetic but spreads.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Cast iron is the strongest secondhand case there is. It does not wear out, and new ones cost a fortune to ship.",
    bulky: true,
    useDominant: false,
  },
  "exercise-machine": {
    category: "exercise-machine",
    verdict: "check",
    checkTips: [
      "Run it at speed for five minutes and listen to the belt and bearings.",
      "Check whether the subscription the console depends on is transferable.",
      "Measure your doorway before you commit \u2014 these rarely come apart.",
    ],
    embodiedCo2Kg: 0,
    co2Source: '',
    note: "Bought new with good intentions and sold barely used, so condition is usually excellent. The catch is the subscription and getting it home.",
    bulky: true,
    useDominant: false,
  },
}

/* --- the warehouse ------------------------------------------------------- */

/** Null until the first call decides; false means "use SEED and stop asking". */
let pool: Promise<Record<string, CategoryGuidance> | null> | null = null

function configured(): boolean {
  return Boolean(
    process.env.SNOWFLAKE_ACCOUNT &&
      process.env.SNOWFLAKE_USER &&
      (process.env.SNOWFLAKE_PASSWORD || process.env.SNOWFLAKE_PRIVATE_KEY_PATH),
  )
}

/**
 * One row -> CategoryGuidance, or null if it does not survive validation.
 *
 * The table is ours, but a row that has drifted is exactly the case where we
 * would rather show the seed than a verdict we cannot trust. CHECK_TIPS is an
 * ARRAY, which the driver hands back as either a JSON string or an array
 * depending on version.
 */
function toGuidance(row: Record<string, unknown>): CategoryGuidance | null {
  const category = String(row.CATEGORY ?? '')
  const verdict = String(row.VERDICT ?? '')
  if (!category) return null
  if (verdict !== 'safe' && verdict !== 'check' && verdict !== 'avoid') return null

  let checkTips: string[] = []
  try {
    const raw = row.CHECK_TIPS
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(parsed)) checkTips = parsed.map(String)
  } catch {
    return null
  }

  const co2Source = String(row.CO2_SOURCE ?? '')
  const embodiedCo2Kg = Number(row.EMBODIED_CO2_KG ?? 0)
  if (!Number.isFinite(embodiedCo2Kg)) return null

  return {
    category,
    verdict,
    checkTips,
    embodiedCo2Kg,
    co2Source,
    note: String(row.NOTE ?? ''),
    bulky: Boolean(row.BULKY),
    useDominant: Boolean(row.USE_DOMINANT),
  }
}

/**
 * Fetches all 24 rows once. Resolves to null on any failure, which is the
 * signal to serve SEED — a warehouse we cannot reach must not cost us a card.
 */
async function load(): Promise<Record<string, CategoryGuidance> | null> {
  if (!configured()) return null

  try {
    const { readFileSync } = await import('node:fs')
    const snowflake = (await import('snowflake-sdk')).default
    snowflake.configure({ logLevel: 'OFF' })

    const keyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH
    const opts: import('snowflake-sdk').ConnectionOptions = {
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USER!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE ?? 'COMPUTE_WH',
      role: process.env.SNOWFLAKE_ROLE ?? 'ACCOUNTADMIN',
      database: process.env.SNOWFLAKE_DATABASE ?? 'VERTE',
      schema: process.env.SNOWFLAKE_SCHEMA ?? 'PUBLIC',
    }
    if (keyPath) {
      opts.privateKey = readFileSync(keyPath.replace(/^~/, process.env.HOME ?? '~'), 'utf8')
      opts.authenticator = 'SNOWFLAKE_JWT'
    } else {
      opts.password = process.env.SNOWFLAKE_PASSWORD
    }

    conn = snowflake.createConnection(opts)
    await new Promise<void>((res, rej) => conn!.connect((e) => (e ? rej(e) : res())))

    const rows = await new Promise<Record<string, unknown>[]>((res, rej) =>
      conn!.execute({
        sqlText:
          'SELECT CATEGORY, VERDICT, CHECK_TIPS, EMBODIED_CO2_KG, CO2_SOURCE, NOTE, BULKY FROM CATEGORY_GUIDANCE',
        complete: (e, _s, r) => (e ? rej(e) : res((r ?? []) as Record<string, unknown>[])),
      }),
    )

    const table: Record<string, CategoryGuidance> = {}
    let rejected = 0
    for (const row of rows) {
      const g = toGuidance(row)
      if (g) table[g.category] = g
      else rejected++
    }
    if (rejected) console.warn(`[verte] ${rejected} guidance row(s) failed validation, using seed for those`)

    const missing = Object.keys(SEED).filter((s) => !(s in table))
    if (missing.length) console.warn(`[verte] not in the warehouse, using seed: ${missing.join(", ")}`)

    console.log(`[verte] category guidance from Snowflake — ${Object.keys(table).length} rows`)
    return table
  } catch (error) {
    console.warn(
      `[verte] Snowflake unavailable, serving the built-in table: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return null
  }
}

let conn: import('snowflake-sdk').Connection | null = null

/** Layer 3 — the category knowledge base. §07 is the full starter table. */
export async function getCategoryGuidance(slug: string): Promise<CategoryGuidance | null> {
  pool ??= load()
  const table = await pool
  /* SEED is the floor, not merely the fallback: a slug missing from the
   * warehouse still answers rather than 404-ing on a page we recognised. */
  return table?.[slug] ?? SEED[slug] ?? null
}

/**
 * The running total behind the popup. Fire and forget — a failed insert must
 * never reach the caller, and proxy/index.ts deliberately does not await it.
 */
export async function logImpact(slug: string, co2Kg: number): Promise<void> {
  if (!conn || !(await pool)) return
  try {
    await new Promise<void>((res, rej) =>
      conn!.execute({
        sqlText: 'INSERT INTO IMPACT_LOG (CATEGORY, CO2_KG) VALUES (?, ?)',
        binds: [slug, co2Kg],
        complete: (e) => (e ? rej(e) : res()),
      }),
    )
  } catch (error) {
    console.warn(`[verte] impact log write failed: ${error instanceof Error ? error.message : error}`)
  }
}

/** Exported for the parity test only. Not part of the seam. */
export const __SEED = SEED
