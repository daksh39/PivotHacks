# Context: adding green product data sources

**Audience:** whoever (human or LLM) is aggregating data on environmentally
better products, to plug into Verte.

**Read first:** `CLAUDE.md` (working agreement), then
`docs/superpowers/specs/2026-09-13-greener-alternatives-design.md`.

---

## What Verte is, in one paragraph

A Chrome extension (MV3) that injects a card on Amazon and Best Buy product
pages. Its argument is **"the greenest product is the one that already
exists"** — manufacturing dominates the lifetime footprint of most durable
goods, so buying secondhand avoids nearly all of it. Everything runs in the
content script. There is **no server, no API key, and no build step you need to
run beyond `npm run build`**.

## The ladder — the single most important rule

```
1. Buy the one that already exists   (secondhand)   ← always preferred
2. If none exists, buy the least-bad new one        ← your work lands here
3. If neither, say so honestly
```

Enforced in `src/assemble.ts`:

```ts
greener: ranked.options.length ? [] : greener
```

**Rung 2 is only ever shown when rung 1 is empty.** A newly manufactured
product still carries its full footprint, so it must never sit beside a used
one as an equal. If you find yourself wanting to relax this, that is the moment
to stop and ask — it is the difference between this project and a shopping
affiliate.

---

## The seam you plug into

### The type (`src/types.ts`)

```ts
export type GreenerOption = {
  source: ListingSource        // 'amazon' | 'bestbuy'
  title: string
  price: number
  currency: string             // ISO code, e.g. 'CAD'. Must match the product's.
  url: string
  imageUrl: string | null
  /** Verbatim from the source, naming the certifier. Never our own words. */
  certification: string
}
```

### The function to mirror (`src/contentScript/greener.ts`)

```ts
export async function findGreener(
  title: string,
  url: string,
  options?: { fetchImpl?: typeof fetch },
): Promise<GreenerOption[]>
```

A new source should expose the same shape, and `findGreener` should dispatch to
it by hostname — exactly how `src/contentScript/listings.ts` already dispatches
between Amazon and Best Buy.

The `fetchImpl` parameter exists so the function is testable without a network.
Keep it.

---

## Four rules your data must satisfy

**1. Every green claim names a third-party certifier.**
`certification` is quoted from the source. If you cannot say *who* certified
it, drop the product. A green claim with no certifier is indistinguishable from
greenwashing, and that is worse for us than showing nothing. The current
implementation drops any candidate whose certification it cannot read.

**2. Never invent a carbon number.**
`isSourced()` in `src/carbon.ts` governs this. A category shows a figure only
when `co2Source` names a real reference; otherwise it carries `0` and an empty
string, and the card shows a qualitative claim instead. Three categories are
currently cited: monitor (Dell PCF datasheet), laptop (Apple Product
Environmental Report), phone (published smartphone LCAs). **Do not pad this
list to make coverage look better.**

**3. Currency must match the product's.**
`assemble.ts` drops any option whose currency differs. A CAD price minus a USD
price is not a saving. `currencyForUrl()` in `extract.ts` derives it from the
TLD; `parsePrice()` reads an explicit marker when present.

**4. Fail soft, always.**
Returning `[]` is a normal outcome, never an error. Every network function is
wrapped so a changed endpoint degrades the card rather than removing it.

---

## What is verified, and what is not

Verified live on 2026-09-13, on real pages:

| Thing | Evidence |
|---|---|
| Amazon used buybox | `#usedAccordionRow` — textbook at CA$69.26 vs CA$243.63 new |
| Amazon Renewed search | 9 / 17 / 3 real listings for AirPods, Latitude, QC45 |
| Best Buy open box | `/api/v2/json/search` → 6 matching listings, cheapest CA$174 |
| Climate Pledge Friendly | `#climatePledgeFriendly` present on 3/3 certified, 0/3 uncertified |
| Breadcrumb categories | Amazon and Best Buy both publish them |

**Not verified / known gaps:**

- **Best Buy has no green programme we have verified.** Rung 2 is Amazon-only.
  Do not add a Best Buy green source without evidence a certification exists
  and is readable; the card must not imply coverage it lacks.
- **`daysToHand` is a constant (7).** No source reports a real delivery
  estimate yet, so the deadline-aware ranking cannot distinguish two listings.
  Best Buy has an availability endpoint that has not been probed.
- **Carbon coverage is 3 of 37 categories.** No published PCF was found for
  furniture, cookware, clothing or most kitchen appliances.

---

## Traps that already cost us hours

**Amazon silently ignores refinements it does not like.** We tried
`rh=p_n_condition-type` to filter to used: plain search returned 25 results,
"filtered" returned 27. It does nothing. Building on it would have shown **new
items labelled used**. Always compare filtered against unfiltered before
trusting a refinement. The CPF refinement passes this test (different result
set, and every sampled product independently carries the certification node) —
but we still confirm on the product page rather than trusting it.

**Selector breadth causes silent false positives.**
`[id*="climatePledge" i]` matches a hidden container on *every* product page
and reported 100% of products as certified. The exact id
`#climatePledgeFriendly` discriminates cleanly. Prefer exact ids; always test
your selector against a known-negative.

**`DOMParser` documents have no layout.** `doc.body.innerText` is always empty
— use `textContent`. This produced a completely wrong conclusion once.

**Never split a product title on `-`.** Model numbers contain hyphens.
`"Sony WH-CH720N"` became `"Sony WH"` and returned WH-1000XM5 listings for a
WH-CH720N page. `sameProduct()` and `modelTokens()` in `listings.ts` guard
this; reuse them rather than writing new matching.

**`vite` overwrites `dist/` with an unloadable dev build.** `npm run build` is
the only thing that should write the extension. `npm run preview:card` uses a
separate config (`vite.preview.config.ts`) that cannot touch `dist/`. Do not
reintroduce a `dev` script that shares the CRXJS plugin.

---

## The category table has one source of truth

`src/guidance.ts` holds `GUIDANCE` — plain data, no Node imports, bundled into
the extension. Everything else is downstream of it:

```
src/guidance.ts  ──>  proxy/snowflake.ts   (SEED, and the warehouse fallback)
                 ──>  data/category-guidance.sql   (generated)
                          └─>  Snowflake CATEGORY_GUIDANCE   (loaded)
```

```bash
npx tsx proxy/snowflake.gen.ts     # regenerate the SQL after editing guidance
npx tsx proxy/snowflake.load.ts    # load it into the warehouse
npx tsx proxy/snowflake.check.ts   # diagnose a connection
```

**Add categories in `src/guidance.ts`, then regenerate.** Editing the SQL by
hand puts the two out of sync, and a test fails when they disagree.

Snowflake is an upgrade, never a dependency: the proxy reads the warehouse when
`.env` carries credentials and falls back to the seed when it does not. The
extension itself never talks to either — it bundles the table.

## Running and testing

```bash
npm install
npm run build          # writes dist/ — load this as an unpacked extension
npm test               # 242 tests (extension + warehouse tooling)
npm run typecheck
npm run preview:card   # every card state, no extension needed
```

Load: `chrome://extensions` → Developer mode → Load unpacked → `dist/`.

**Diagnostics.** The content script publishes progress to
`document.documentElement.dataset.verte`. If a card does not appear, read that
attribute in devtools — it distinguishes `not-a-product-page`,
`no-product-found`, `nothing-to-show` and `mounted`, which have four completely
different causes.

**Testing style.** Fixtures are copied from real responses, never invented
shapes — see `greener.test.ts` and `listings.test.ts`. Write the failing test
first; several real bugs in this codebase were found precisely because the test
was written before the implementation.

---

## Where to take it next, in order of value

1. **More green sources.** Anything with a real certification: ENERGY STAR,
   B Corp, Cradle to Cradle, GOTS, EPEAT. The constraint is not finding brands
   — it is being able to name the certifier per product.
2. **Real delivery estimates.** Unlocks the deadline rule, which is written,
   tested, and currently inert for lack of data.
3. **More cited carbon figures.** Manufacturer PCF reports are the best source
   — Dell, Apple, HP, Lenovo and Samsung publish per-product numbers.
4. **Best Buy green parity**, if and only if a verifiable certification exists.

## What not to do

- Do not recommend a greener new product alongside a secondhand one.
- Do not show a green claim without a named certifier.
- Do not invent or estimate a carbon figure.
- Do not add a retailer without verifying its markup on a live page first.
