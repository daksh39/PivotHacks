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
| `src/mocks.ts` | Shared fixtures. The proxy serves these in mock mode, the card previews them, the extension falls back to them. |
| `proxy/snowflake.ts` — **the two exported signatures** | `getCategoryGuidance(slug)` and `getCampusListings(slug)`. `lane/snowflake` owns the bodies; `lane/proxy` only calls them. |

Why this is the one rule that matters: we expect mid-event pivots. Every pivot
we can absorb becomes a change to whatever *produces* a `VerteResult`, never to
what consumes it. Swap eBay for another marketplace, swap categories, swap the
whole scoring idea — the card doesn't move. Breaking this is how a 12-hour build
dies at hour nine (§02).

### 2. Stay in your lane's directories

| Branch | Owns — edit freely | Never touch |
|---|---|---|
| `lane/extension` | `src/contentScript/` `src/background/` `manifest.config.ts` | `src/components/` `proxy/` |
| `lane/ui` | `src/components/` `src/popup/` `src/dev/` `src/tokens.ts` `src/carbon.ts` | `src/contentScript/` `proxy/` |
| `lane/proxy` | `proxy/index.ts` `proxy/ebay.ts` `proxy/categories.ts` | `proxy/snowflake.ts` `src/` |
| `lane/snowflake` | `proxy/snowflake.ts` `data/` | `proxy/index.ts` `src/` |
| `lane/site` | `site/` | everything else |

Branches touch disjoint directories, so merges are boring by construction. If
you find yourself needing to edit outside your lane, that's a conversation, not
a commit.

---

## Commands

```bash
npm install

npm run proxy:mock     # proxy on :8787 with mock data — NO credentials needed
npm run proxy          # proxy with real eBay + Snowflake
npm run smoke          # prove the proxy returns a well-formed VerteResult
npm run dev            # build + hot-reload the extension
npm run preview:card   # the card alone, every state, in a plain page
npm run site           # the landing page on :5174
npm run typecheck      # tsc --noEmit
npm run all            # mock proxy + extension together
```

Load the extension: `chrome://extensions` → Developer mode → Load unpacked →
select `dist/`.

## Verify your own lane, alone

Nobody waits on anybody. Every lane has a green signal it can get by itself:

- **lane/extension** — `npm run dev`, load `dist/`, open an Amazon product page.
  The card appears. With no proxy running it falls back to `src/mocks.ts`, so
  this works before the proxy exists.
- **lane/ui** — `npm run preview:card`. Every state renders in a real shadow
  root. Zero dependency on the extension or the proxy.
- **lane/proxy** — `npm run proxy` in one terminal, `npm run smoke` in another.
- **lane/snowflake** — same smoke test with `VERTE_MOCK` unset: it exercises
  your two functions.
- **lane/site** — `npm run site`.

## Merging

```bash
git fetch origin && git rebase origin/main      # often. Not once at hour ten.
```

Merge into `main` at the gates (§05): gate one at 3:00, gate two at 6:00.
Before you merge: `npm run typecheck` passes and your lane's green signal above
is actually green — run it, don't assume it.

---

## Things that will cost you hours (§08)

- **MV2 is dead.** Don't port the 2022 GreenBeans repo. This is a fresh MV3
  scaffold. The React screens are worth referencing; the shell is not.
- **The eBay secret cannot live in the extension.** Credentials in a content
  script are readable by anyone who opens the bundle *and* blocked by CORS.
  The service worker talks to the proxy; the proxy holds the secret. This is
  already wired — don't undo it.
- **Inject into a shadow root.** Amazon's stylesheet will obliterate an
  ordinary div. Already done in `src/contentScript/mount.tsx`.
- **Scrape JSON-LD before CSS selectors.** Retail markup churns. Already
  ordered correctly in `src/contentScript/extract.ts`.
- **Keyword classification before anything clever.** `proxy/categories.ts` is
  a rules table you can fix in five seconds at 3am. A model here is a fine
  upgrade and a terrible foundation.
- **Cache eBay responses.** You'll hit the same three demo products hundreds
  of times. Already cached in `proxy/ebay.ts` and `src/background/index.ts`.

## The carbon numbers are placeholders — on purpose

Every `co2Source` in `src/mocks.ts`, `proxy/snowflake.ts` and
`data/category-guidance.sql` currently reads `PLACEHOLDER — lane/demo to
source`. So does `KG_CO2_PER_MILE_SOURCE` in `src/carbon.ts`.

**Do not invent a citation to fill one in.** §09: the first question a good
judge asks is where "46 kg" came from, and having an answer is worth more than
having a bigger number. Use published embodied-carbon estimates per category,
store the source next to the number, and display the tilde — "~46 kg CO₂e" is
honest, "46.2 kg" is a claim we can't support.

Same rule for the campus listings: they are **seeded**, and we say so plainly
if asked. Seeded data described accurately costs us nothing. Seeded data
implied to be live does.

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
support → popup impact total → model-based classification → campus listings.

**Never cut:** inline injection on a real product page, live eBay results, the
price delta, the safe-to-buy-used verdict. That set *is* Verte.
