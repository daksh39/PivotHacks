# Verte — Build Plan

> **The greenest product is the one that already exists.**

Verte surfaces the secondhand option at the moment a student is about to buy new. Manufacturing dominates the lifetime emissions of most durable goods, so buying used avoids nearly all of a product's footprint — something no amount of eco-branding on a newly manufactured item can match. **It is also the cheap option**, which is what actually moves a first-year living independently for the first time.

- **Format:** 12-hour hackathon
- **Build:** Chrome extension, Manifest V3
- **Track:** Problem 9 — Sustainable choices

---

## Contents

1. [What we're building](#01--what-were-building)
2. [The contract](#02--agree-on-this-in-the-first-thirty-minutes)
3. [Data layers](#03--three-layers-one-of-them-live)
4. [Workstreams](#04--four-lanes-worked-in-parallel)
5. [Hour by hour](#05--hour-by-hour)
6. [The card](#06--the-card)
7. [Category rules](#07--whats-actually-safe-to-buy-used)
8. [Known traps](#08--traps-that-will-cost-you-hours)
9. [Numbers we cite](#09--the-numbers-we-put-on-screen)
10. [Demo script](#10--ninety-seconds)
11. [Cut list](#11--cut-in-this-order)
12. [Design system](#12--design-system)

---

## 01 — What we're building

A Chrome extension that detects when you're on a product page and injects a small card near the buy button showing the same item, used — the price, whether that category is actually safe to buy secondhand, and the manufacturing emissions you avoid by not buying new.

### Who it's for

A university student setting up independent living for the first time. This is a specific person and every design call should bend toward them:

- **Limited budget.** Money leads. The environmental win is real but it rides along — we never ask them to spend more to be virtuous.
- **Limited experience.** They don't know a used desk is a great idea and a used mattress is a terrible one. Nobody has ever told them. This is a feature, not an assumption.
- **Busy schedule.** The answer has to land in one line without a comparison-shopping session.
- **Unfamiliar environment.** They have no idea what already exists near campus. We do.

### Why this isn't another green-shopping extension

The category norm is to recommend an eco-branded *new* product, which still incurs the full manufacturing footprint — the largest share of lifetime emissions for most durable goods. Verte's answer is to not manufacture anything. That's a sharper environmental claim and a cheaper one, and it's the line the whole pitch rests on.

---

## 02 — Agree on this in the first thirty minutes

This is the single most important thing in the document. Every lane codes against these four types, everyone mocks them locally, and nobody waits on anyone else. Put it in `src/types.ts` before anyone writes a feature.

```ts
// What the content script scrapes off the page.
type ProductContext = {
  title:     string
  price:     number | null
  currency:  string
  category:  string        // normalized slug: "mini-fridge"
  imageUrl:  string | null
  sourceUrl: string
}

// One secondhand option, from any source.
type UsedOption = {
  source:      "ebay" | "campus"
  title:       string
  price:       number
  url:         string
  imageUrl:    string | null
  condition:   string
  distanceMi?: number      // campus listings only
}

// What we know about buying this category used.
type CategoryGuidance = {
  category:       string
  verdict:        "safe" | "check" | "avoid"
  checkTips:      string[]
  embodiedCo2Kg:  number   // estimate — carries a source
  co2Source:      string
  note:           string
}

// The one object the UI renders. Nothing else reaches a component.
type VerteResult = {
  product:      ProductContext
  guidance:     CategoryGuidance
  options:      UsedOption[]
  savingsUsd:   number | null
  co2AvoidedKg: number | null
}
```

> **Why this matters more than usual**
>
> We expect mid-event pivots. Every pivot we can absorb becomes a change to whatever *produces* a `VerteResult`, never to what consumes it. Swap eBay for another marketplace, swap categories, swap the whole scoring idea — the card doesn't move. Breaking this rule is how a 12-hour build dies at hour nine.

---

## 03 — Three layers, one of them live

### Layer 1 — eBay Browse API `PRIMARY`

Real listings, real prices, real photos, searched by product title and filtered to used conditions. This is our live API and it's what makes the demo credible. Someone needs to start the developer-account signup **in the first hour** — OAuth approval is the kind of thing that quietly eats ninety minutes.

### Layer 2 — Campus listings `SEEDED`

A Snowflake table of secondhand items near campus. This is the local texture that makes Verte feel like it knows where you are, and it's genuinely the better answer for bulky goods a student can't ship. These groups have no API, so the table is hand-seeded and we say so plainly if asked — seeded demo data presented honestly costs us nothing.

### Layer 3 — Category knowledge base `OURS`

The part that serves "limited experience," and the part a judge will remember. Maps a category to a verdict, what to inspect before buying, and an embodied-carbon estimate. Full starter table in section 07.

### Where Snowflake sits

It holds layers 2 and 3, plus a small event log so the popup can show a running avoided-emissions total. Queries go through the proxy, never from the extension.

---

## 04 — Four lanes, worked in parallel

Written for four. For three, fold D into whoever finishes first. For two, one person owns A + C and the other owns B + D, and you cut the campus layer on the spot.

### Lane A — Extension shell

**Owner:** ____________

- Fresh **Manifest V3** scaffold — Vite + CRXJS, React 18. Do not port the MV2 repo.
- Service worker, content script, message passing between them.
- Detect product pages; extract `ProductContext`. Try JSON-LD first, CSS selectors as fallback.
- Inject the card into a **shadow root** so the host page's CSS can't reach it.
- Amazon only until it works. Other retailers are a bonus, never a blocker.

### Lane B — Data & proxy

**Owner:** ____________

- **eBay developer account first** — before anything else, hour zero.
- Thin proxy service (Cloudflare Worker, Vercel function, or local Express). Holds the eBay secret, does the OAuth token dance, talks to Snowflake.
- One endpoint: `POST /lookup` takes a `ProductContext`, returns a `VerteResult`.
- Category classifier: **keyword rules first**, debuggable at 3am. LLM only if there's time left.
- Snowflake tables + seed data for campus listings and the category KB.

### Lane C — Design & UI

**Owner:** ____________

- Build the card **in a plain local page first**, against a mocked `VerteResult`. Zero dependency on lanes A or B.
- Collapsed strip state, expanded card state, verdict component, loading skeleton, and the "nothing found" state.
- Design tokens, and all styles authored to live inside a shadow root.
- Popup: running avoided-emissions total and a campus feed.
- Owns the wordmark and the one-line thesis on the devpost page.

### Lane D — Demo & pitch

**Owner:** ____________

- Seed campus listings that match the exact products in the demo path.
- Pick and freeze **three real product URLs** early; everyone tests against those.
- Source and record every carbon figure we display (section 09).
- Devpost copy, screenshots, and the recorded fallback video.
- Owns the clock. Calls the cut list when we're behind.

---

## 05 — Hour by hour

Two hard gates. Everything is sequenced so that **we have something demoable at hour six**, not hour eleven.

| Time | Milestone | What it means |
|---|---|---|
| **0:00** | Lock and scaffold | Types file committed. Repo scaffolded and pushed. eBay developer signup submitted. Three demo product URLs chosen and frozen. Nobody writes a feature until the types file exists. |
| **0:30** | Four lanes open, all on mocks | A: extension loads and injects a hardcoded box on a real Amazon page. B: eBay search returns JSON in curl. C: card renders from a mocked result in a local page. D: Snowflake tables created and seeded. |
| **3:00** | **GATE ONE — fake data, real page** | C's card is rendering inside A's shadow root on a live Amazon product page, fed by a hardcoded `VerteResult`. Ugly is fine. If this slips past 3:30, cut the campus layer immediately. |
| 3:00 | Make it real | A swaps hardcoded context for real DOM extraction. B wires the proxy to eBay and Snowflake and serves a genuine `VerteResult`. C polishes states. |
| **6:00** | **GATE TWO — end to end** | Real Amazon page in, real eBay listings out, real price delta on screen. From this moment we always have something to show. Everything after this is upside. |
| 6:00 | Depth | Campus listings merged into results. Carbon figures with sources. Verdict and inspection tips. Popup with the running total. |
| 9:00 | Harden | Empty states, loading skeletons, failure paths. Walk the three demo URLs end to end repeatedly. Fix only what breaks on that path. |
| **10:00** | **FEATURE FREEZE — hard stop** | No new features. None. Record the backup demo video now, while the build is known-good — this is the single highest-value thirty minutes of the event and the one teams always skip. |
| 10:30 | Rehearse and submit | Run the demo out loud at least three times. Devpost copy, screenshots, repo README. Submit with buffer — never at the deadline. |

---

## 06 — The card

It appears inline, near the buy button — not in a popup nobody clicks. Collapsed, it's a single line: *"$34 used nearby — save $55."* Expanded:

```
┌──────────────────────────────────────────────┐
│  🌱  Verte                                   │  ← moss tint header
├──────────────────────────────────────────────┤
│                                              │
│   $89  →  $34                    SAVE $55    │  ← Domine 33px / moss pill
│  ─────────────────────────────────────────   │
│   ✓  Safe to buy used                        │
│      Check the door seal and that it         │
│      cools within an hour.                   │
│  ─────────────────────────────────────────   │
│   Avoids ~46 kg CO₂e of manufacturing        │
│   — about 180 miles driven                   │
│                                              │
│   [   3 on eBay   ]  [  2 near campus  ]     │  ← moss fill / outline
│                                              │
└──────────────────────────────────────────────┘
   cream #FAF6ED ground, #9FB87E border
```

Mini-fridge, the canonical demo product. Figures illustrative — real ones carry sources.

### The order is the argument

- **Money first.** It's what makes them look. The saving is the largest element on the card.
- **Verdict second.** This is the trust-builder — it proves we know something they don't, and it's why they'd keep it installed.
- **Carbon third.** Present, framed as avoided manufacturing, never preachy. The tilde stays.
- **Listings last.** Two clear routes: ship it, or walk to it.

### Rules for lane C

- The cream ground is ours, not the page's — keep the `#9FB87E` border so the card reads as deliberate against a white retail page rather than a rendering fault.
- `#D0E2B8` and `#9FB87E` are fills and borders, **never text on cream**. Accent text is `#3C4A2C`.
- No all-caps alarm language. A banner reading "SUSTAINABLE ALTERNATIVES FOUND" sounds like a virus warning, not a recommendation.
- Never render a bare number with no explanation — every figure carries its unit and its framing.
- A skeleton while loading. A blank flash on someone else's page is worse than not appearing.
- Dismissible, and it stays dismissed for that product.

---

## 07 — What's actually safe to buy used

Starter set for the `CATEGORY_GUIDANCE` table. This is the most quietly valuable thing we ship — it's real advice a first-year genuinely does not have, and it's what separates Verte from a price-comparison widget.

| Category | Verdict | What to tell them |
|---|---|---|
| Desk, bookshelf, dresser | **SAFE** | Ideal used. Check drawer runners and that it's not particleboard that's been wet. |
| Mini-fridge | **SAFE** | Check the door seal; confirm it cools within an hour of plugging in. |
| Microwave | **SAFE** | Check the door latch and that the interior isn't scorched or rusted. |
| Monitor | **SAFE** | Look for dead pixels and backlight bleed on a white screen. |
| Textbooks | **SAFE** | Confirm the edition matches the syllabus. Previous edition is often fine — ask first. |
| Cast iron, stainless cookware | **SAFE** | Effectively indestructible. Rust on cast iron is cosmetic and scrubs off. |
| Bike | **SAFE** | Check the frame for cracks near welds. Chain, brakes, and tyres are cheap to replace. |
| Storage bins, drying rack, fan | **SAFE** | No meaningful risk. Never buy these new. |
| Laptop | **CHECK** | Ask for battery cycle count and confirm it powers on. Verify it isn't activation-locked. |
| Desk chair | **CHECK** | Test the gas cylinder — if it sinks under weight, that's a real repair. |
| Blender, kettle | **CHECK** | Inspect seals and gaskets. Limescale is fine; cracked plastic is not. |
| Headphones | **CHECK** | Hygiene — budget for replacement ear pads. |
| Winter coat | **CHECK** | Check zips and whether the insulation still lofts. Great value used. |
| Mattress | **BUY NEW** | Hygiene and pest risk, and compression is permanent. The one thing we tell them to buy new. |
| Pillows | **BUY NEW** | Same reasoning, and they're cheap enough that it doesn't sting. |
| Bike helmet | **BUY NEW** | Single-impact protection. You cannot see whether it's already been used. |
| Non-stick pans | **BUY NEW** | The coating degrades and scratches. Buy stainless or cast iron used instead. |
| Smoke / CO detector | **BUY NEW** | Sensors expire. Don't gamble on this one. |
| Surge protector | **BUY NEW** | Protection components wear out invisibly with each surge absorbed. |

> **Demo advice**
>
> Show a **"buy new"** verdict during the demo — walk onto a mattress page and have Verte tell them *not* to buy used. An app willing to argue against itself is far more convincing than one that always says yes, and it takes ten seconds.

---

## 08 — Traps that will cost you hours

### Manifest V2 is dead — don't port the old repo

Chrome has disabled MV2 extensions, so most extension tutorials and boilerplate you find will not load in a current browser. The service worker model, the manifest format, and the background plumbing all differ from MV2. Check the manifest version on anything you copy from, and start from an MV3 scaffold rather than adapting older code.

### The eBay secret cannot live in the extension

> **Blocker if discovered late.** OAuth client credentials in a content script are both exposed to anyone who opens the bundle and blocked by CORS. **You need the proxy from the start** — this isn't a refactor you can do at hour eight. Lane B builds it first, and the extension only ever talks to our endpoint.

### Inject into a shadow root

Amazon's stylesheet will obliterate an ordinary injected div. Attach a shadow root, put the styles inside it, and the card renders identically everywhere. Skipping this means lane C spends the back half of the event fighting specificity wars.

### Scrape JSON-LD before CSS selectors

Retail markup churns and hand-picked selectors rot. Most product pages carry an `application/ld+json` Product block with name, image, and price — parse that first, fall back to `og:` meta tags, and only then to selectors. One function, far more robust.

### Keyword classification before anything clever

Title to category via a rules table. It's deterministic, instant, and you can fix a misclassification in five seconds at 3am. A model in this slot is a fine upgrade and a terrible foundation.

### Cache eBay responses

You will hit the same three demo products hundreds of times. Cache by category in Snowflake or in memory — it protects your rate limit and makes the demo instant.

---

## 09 — The numbers we put on screen

We're displaying carbon figures, and the first question a good judge asks is where "46 kg" came from. Having an answer is worth more than having a bigger number.

- **Store the source with the number.** `co2Source` is in the type for a reason. Every row in the KB carries a citation.
- **Use published embodied-carbon estimates per category.** Don't compute anything bespoke and don't invent precision.
- **Display the tilde.** "~46 kg CO₂e" is honest; "46.2 kg" is a claim we can't support.
- **Cite the driving conversion too.** The miles-driven equivalence needs a per-mile figure with a source behind it.
- **Say the campus listings are seeded.** If asked, answer plainly. Seeded data described accurately is completely fine; seeded data implied to be live is not.

One line in the README and one line in the pitch covering methodology reads as rigor, not weakness. Teams that hand-wave this get taken apart in Q&A.

---

## 10 — Ninety seconds

1. Open a real Amazon mini-fridge listing. Say nothing — let the card appear on its own. That silence is the whole product.
2. Expand it. *"Eighty-nine dollars new. Thirty-four used, two miles from campus."*
3. Point at the verdict. *"And it tells you what to check, because a first-year has never bought a used fridge before."*
4. Show the live eBay listings, then the campus ones.
5. Navigate to a mattress. Verte says buy new. *"It's not trying to make every purchase secondhand. It's trying to make the right ones."*
6. Open the popup: total avoided this term.
7. Close on the thesis: **the greenest product is the one that already exists** — and for a student, it's also the affordable one.

> **Non-negotiable.** Record this as video at the hour-ten freeze. Live demos fail on venue wifi, and a recorded run of a working build has saved more hackathon projects than any feature.

---

## 11 — Cut in this order

Decided now, calmly, so nobody argues about it at hour nine. Lane D calls it.

1. **Multi-retailer support** — Amazon only. Nobody has ever lost for demoing on one site.
2. **Popup impact total** — nice closing beat, contributes nothing to the core argument.
3. **Model-based classification** — keyword rules cover the demo path completely.
4. **Campus listings layer** — hurts, it's the local texture, but eBay alone still proves the thesis.

> **Never cut.** Inline injection on a real product page, live eBay results, the price delta, and the safe-to-buy-used verdict. That set *is* Verte. Everything else is decoration on top of it.

---

## 12 — Design system

### Color

| Token | Hex | Use |
|---|---|---|
| Base / background | `#FAF6ED` | Card and panel grounds |
| Primary accent — Moss | `#D0E2B8` | Button fills, pills, active states |
| Accent tint | `#E8F0DA` | Hover, soft fills, callout grounds |
| Accent shade | `#9FB87E` | Borders, rules, active edges |
| Ink | `#42473C` | Headings and body text |
| Ink soft | `#868C7C` | Secondary text, captions, meta labels |
| Accent text | `#3C4A2C` | Links, accent type, button labels |

**Contrast rules — these matter:**

- `#9FB87E` on cream is ~2.3:1 and **fails** as text. Borders and fills only.
- `#D0E2B8` is a fill, never text on cream.
- `#868C7C` is ~3.1:1 — fine for small meta labels, not for running body copy.
- All accent *text* uses `#3C4A2C` (~9:1 on cream).

**Semantic colors** (additions — the base system doesn't define these):

| Verdict | Text | Background |
|---|---|---|
| Safe | `#3C4A2C` | `#D0E2B8` |
| Check | `#8A6E2F` | `#F3EBD6` |
| Buy new | `#9A4B37` | `#F4E2DC` |

Both additions are desaturated toward warm so they sit on the cream instead of punching through it.

### Type

| Role | Face | Weights |
|---|---|---|
| Wordmark, display | Newsreader | 400 / 500 / 600 |
| Headings, labels | Domine | 400–700 |
| Body, UI | Instrument Sans | 400–700 |
| Code | IBM Plex Mono | 400 / 500 |

IBM Plex Mono is an addition — the base system doesn't specify a mono face.

### Geometry

- Panels and cards: `28px` radius
- Inner blocks: `16–20px` radius
- Buttons and pills: `100px` radius
- Shadow: `0 8px 24px rgba(92, 138, 107, 0.10)`
- Page ground: `linear-gradient(160deg, #FDF6EC 0%, #F2ECDD 45%, #E8F0E6 100%)`

### Mark

Two overlapping leaf forms on a shared base point:

- Left leaf `#9DC9AC`, radius `0 100% 0 100%`, rotated `-15°`
- Right leaf `#6FA984` at 88% opacity, radius `100% 0 100% 0`, rotated `+15°`
- Wordmark set in Newsreader 600, `#5C8A6B`

---

*Verte · build plan · v2*
