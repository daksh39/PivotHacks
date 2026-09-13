# Verte — working agreement

> Read `verte-plan.md` before touching anything. It is the spec. This file is
> only the operational layer on top of it. Section references below (§02, §07…)
> point into that plan.

**What we're building:** a Manifest V3 Chrome extension that detects a product
page and injects a card near the buy button showing the same item secondhand —
the price, whether that category is actually safe to buy used, and the
manufacturing emissions avoided by not buying new.

Four people work four lanes in parallel on four branches. This file is what
keeps those branches from colliding.

---

## The two rules

### 1. Frozen files

These are the contract every lane codes against. **Do not edit them on a lane
branch.** Changing one is a whole-team decision, committed straight to `main`,
after which every lane rebases.

| File | What it is |
|---|---|
| `src/types.ts` | The four types from §02. Everything is built against these. |
| `src/contentScript/listings.ts` | The two real listing sources. Both are same-origin reads; nothing else may fetch them. |
| `proxy/snowflake.ts` — **the exported signature** | `getCategoryGuidance(slug)`. `lane/snowflake` owns the body; `lane/proxy` only calls it. |

Why this is the one rule that matters: we expect mid-event pivots. Every pivot
we can absorb becomes a change to whatever *produces* a `VerteResult`, never to
what consumes it. Swap a listing source, swap categories, swap the
whole scoring idea — the card doesn't move. Breaking this is how a 12-hour build
dies at hour nine (§02).

### 2. Stay in your lane's directories

| Branch | Owns — edit freely | Never touch |
|---|---|---|
| `lane/extension` | `src/contentScript/` `src/background/` `manifest.config.ts` | `src/components/` `proxy/` |
| `lane/ui` | `src/components/` `src/popup/` `src/dev/` `src/tokens.ts` `src/carbon.ts` | `src/contentScript/` `proxy/` |
| `lane/proxy` | `proxy/index.ts` `proxy/categories.ts` `proxy/rank.ts` | `proxy/snowflake.ts` `src/` |
| `lane/snowflake` | `proxy/snowflake.ts` `data/` | `proxy/index.ts` `src/` |
| `lane/site` | `site/` | everything else |

Branches touch disjoint directories, so merges are boring by construction. If
you find yourself needing to edit outside your lane, that's a conversation, not
a commit.

---

## Commands

```bash
npm install

npm run proxy          # proxy on :8787 — NO credentials needed
npm test               # unit tests (vitest)
npm run smoke          # prove the proxy returns a well-formed VerteResult
npm run dev            # build + hot-reload the extension
npm run preview:card   # the card alone, every state, in a plain page
npm run site           # the landing page on :5174
npm run typecheck      # tsc --noEmit
npm run all            # proxy + extension together
```

Load the extension: `chrome://extensions` → Developer mode → Load unpacked →
select `dist/`.

## Verify your own lane, alone

Nobody waits on anybody. Every lane has a green signal it can get by itself:

- **lane/extension** — `npm run dev`, load `dist/`, open an Amazon product page.
  The card appears. Listings are read from the page itself, so this works
  whether or not the proxy is running.
- **lane/ui** — `npm run preview:card`. Every state renders in a real shadow
  root. Zero dependency on the extension or the proxy.
- **lane/proxy** — `npm run proxy` in one terminal, `npm run smoke` in another.
- **lane/snowflake** — same smoke test: it exercises `getCategoryGuidance`.
- **lane/site** — `npm run site`.

## Merging

```bash
git fetch origin && git rebase origin/main      # often. Not once at hour ten.
```

Before you merge: `npm run typecheck` passes and your lane's green signal above
is actually green — run it, don't assume it.

---

## Things that will cost you hours (§08)

- **MV2 is dead.** Chrome has disabled it, so MV2 boilerplate and most
  extension tutorials will not load. Scaffold fresh, and check the manifest
  version on anything you copy from.
- **Amazon and Best Buy publish no JSON-LD and no `og:` tags.** Verified live
  on both. Structured data is the fallback for *other* retailers; these two
  need the site adapters in `src/contentScript/extract.ts`.
- **Never assume the currency.** amazon.com serves `CAD73.54` to a browser in
  Canada. `parsePrice()` reads the currency out of the string; defaulting to
  USD misreports the price and corrupts every saving computed from it.
- **Listings need NO credentials.** Amazon's used buybox is in the page DOM,
  and Best Buy's open-box search is their own frontend API. Both are
  same-origin reads performed by the content script — the proxy could not
  fetch them if it tried. Don't reintroduce an API that needs a key.
- **Inject into a shadow root.** Amazon's stylesheet will obliterate an
  ordinary div. Already done in `src/contentScript/mount.tsx`.
- **Site adapters first, structured data second.** JSON-LD and `og:` tags are
  the fallback for OTHER retailers — Amazon and Best Buy publish neither.
- **Keyword classification before anything clever.** `proxy/categories.ts` is
  a rules table you can fix in five seconds at 3am. A model here is a fine
  upgrade and a terrible foundation.
- **Never split a product title on "-".** Model numbers contain hyphens.
  Doing it turned "Sony WH-CH720N" into "Sony WH" and returned WH-1000XM5
  listings for a WH-CH720N page. `sameProduct()` now guards this.

## Carbon: no citation, no claim

A category shows a carbon figure ONLY when its `co2Source` names a real
reference. `isSourced()` in `src/carbon.ts` enforces that — uncited categories
carry `0` and an empty source, and the card renders no carbon line at all.

**Do not invent a citation to fill one in.** §09: the first question a good
judge asks is where a number came from, and having an answer is worth more than
having a bigger number. Cited today: monitors (Dell PCF datasheet) and laptops
(Apple Product Environmental Report). `KG_CO2_PER_MILE_DRIVEN` is the US EPA's
~400 g/mile figure.

There is no seeded listing data left anywhere in the product. Every listing on
the card came from the retailer whose page you are standing on.

## Card rules (§06)

The order on the card is the argument. Money, then verdict, then carbon, then
listings. Don't reshuffle it.

- `#D0E2B8` and `#9FB87E` are fills and borders, **never text on cream**.
  Accent text is `#3C4A2C`.
- No all-caps alarm language. The old build said "SUSTAINABLE ALTERNATIVES
  FOUND," which reads like a virus warning.
- Never render a bare number with no explanation — every figure carries its
  unit and its framing.
- Skeleton while loading. A blank flash on someone else's page is worse than
  not appearing.

## Cut list, decided in advance (§11)

When we're behind, cut in this order and don't relitigate it: multi-retailer
support → popup impact total → model-based classification.

**Never cut:** inline injection on a real product page, real listings, the
price delta, the safe-to-buy-used verdict. That set *is* Verte.
