# Greener alternatives and quantified impact

**Date:** 2026-09-13
**Status:** awaiting review

## The problem

Verte currently offers one thing: the same product, secondhand. Two gaps follow
from that.

When no secondhand listing exists — which is the most common card — Verte has
nothing to offer but a sentence. It is not wrong, but it is not useful.

And it cannot answer "how much carbon am I saving?" on most products. Only 2 of
36 categories carry a cited figure, so the rest show a qualitative claim and no
number at all.

## The shape: a ladder, not a menu

The order matters and it is the whole argument.

1. **Buy the one that already exists.** Secondhand avoids essentially all
   manufacturing emissions. This stays first, always.
2. **If nothing secondhand exists, buy the least-bad new one.** A certified
   product still incurs its full manufacturing footprint. It is the second-best
   answer, and it is only ever shown when the first is unavailable.
3. **If neither applies, say so.**

A greener new product is never presented as competing with a used one. Framing
it that way would be the weaker environmental claim wearing the stronger one's
clothes — and it is what the reference project got wrong.

**Rule:** rung 2 renders only when `options.length === 0`.

## Part 1 — Greener alternatives

### Source: Amazon Climate Pledge Friendly

Verified live on 2026-09-13. Two mechanisms, both same-origin, no credentials:

**Detecting certification on a product page.** A certified product has
`#climatePledgeFriendly` in its DOM. An uncertified one does not.

Tested on six products — three drawn from the CPF-filtered search and three
from the plain search:

| Source | `#climatePledgeFriendly` present |
|---|---|
| CPF-filtered search (3 products) | 3 / 3 |
| Plain search (3 products) | 0 / 3 |

**Finding certified alternatives.** The search refinement
`rh=p_n_cpf_eligible:21512497011` returns a genuinely different result set
(20 vs 22 for "mini fridge", different products), and every product sampled
from it carries the node.

**Naming the certification.** The node states which certification applies, e.g.
*"Contains at least 50% recycled material. As certified by Global Recycled
Standard"*. We show this verbatim. A green claim with no named certifier is
indistinguishable from greenwashing, so no alternative is shown without one.

### Two earlier attempts, and why this one is trusted

An Amazon search filtered to used condition was investigated and **rejected**:
`rh=p_n_condition-type` is silently ignored (25 plain results vs 27
"filtered"), so it would have presented new items as used.

A first CPF probe appeared to fail, reporting the badge on every page. That
probe was wrong in two ways: it called `body.innerText` on a `DOMParser`
document, which has no layout and always returns empty, and its selector
`[id*="climatePledge" i]` matched a hidden container present on all pages. The
exact id `#climatePledgeFriendly` discriminates cleanly.

The difference that matters: the used filter changed nothing, while the CPF
filter changes the result set *and* every sampled product independently carries
the certification node.

### Best Buy

Out of scope for this change. Best Buy has no equivalent programme we have
verified, so rung 2 is Amazon-only for now. The card must not imply otherwise.

## Part 2 — Quantified impact

### Sourcing real figures

Manufacturers publish per-product carbon footprint reports. Target the twelve
categories a student actually buys, drawing on published PCFs from Dell, Apple,
HP, Lenovo, Samsung and appliance manufacturers:

laptop, monitor, phone, tablet, headphones, speaker, keyboard, mouse,
mini-fridge, microwave, kettle, vacuum.

Two already exist and stay: monitor (Dell S2421HS PCF, 476 kg CO2e lifecycle,
67.7% manufacturing) and laptop (Apple 13-inch MacBook Air PER, 161 kg CO2e,
76% production).

### The rule does not change

`isSourced()` still governs everything. A category without a real citation
shows the qualitative claim and no number. **No figure is invented to fill a
gap**, including for a greener alternative — where the honest claim is usually
about recycled content or safer chemicals, not avoided carbon, so we state the
certification instead.

### One caveat to carry

For appliances that run continuously, published LCAs consistently find the use
phase dominates rather than manufacturing. For those categories the claim is
narrowed to avoided *manufacturing* emissions rather than lifetime footprint.

## Part 3 — Showing the decrease

Three changes, all wording and emphasis:

**On the card.** Today: "Avoids ~322 kg CO₂e of manufacturing." The comparison
asked for is against the product on screen, so: "~322 kg CO₂e less than buying
this new — about 810 miles driven."

**On a greener alternative.** No carbon number. The certification is the claim:
"Certified: contains at least 50% recycled material (Global Recycled
Standard)."

**In the popup.** Lead with cumulative kg avoided rather than dollars saved.
Money is the hook on the card; the tally is where the environmental story
belongs.

## Data model

```ts
/** Where a listing came from. */
export type ListingSource = 'amazon' | 'bestbuy'

export type UsedOption = {
  /* unchanged */
}

/** A certified NEW product, shown only when nothing secondhand exists. */
export type GreenerOption = {
  source: ListingSource
  title: string
  price: number
  currency: string
  url: string
  imageUrl: string | null
  /** Verbatim from the retailer, naming the certifier. Never our words. */
  certification: string
}

export type VerteResult = {
  /* ...existing fields... */
  /** Rung 2. Populated only when options is empty. */
  greener: GreenerOption[]
}
```

`greener` is a separate field rather than another `UsedOption` variant, so no
existing ranking, currency or savings logic can accidentally treat a new
product as secondhand.

## Components

| Unit | Responsibility | Depends on |
|---|---|---|
| `contentScript/greener.ts` | Find certified alternatives via CPF search; read the certification text | `extract`, `parsePrice` |
| `assemble.ts` | Populate `greener` only when `options` is empty | `rank`, `guidance` |
| `components/Greener.tsx` | Render rung 2, always labelled as new | `tokens` |
| `impactLine.ts` | Comparative wording | `carbon` |
| `guidance.ts` | Twelve newly cited carbon figures | — |

## Testing

Following the existing pattern: fixtures copied from real responses, never
invented shapes.

- `greener.test.ts` — detects the certification node; returns nothing when
  absent; extracts the certifier verbatim; model-matches so a different product
  is never offered; fails soft on a network error.
- `assemble.test.ts` — `greener` is empty whenever `options` is non-empty. This
  is the rule that keeps the ladder honest, so it is asserted directly.
- `impactLine.test.ts` — comparative wording; still silent without a citation.
- `carbon.test.ts` — every new figure has a non-placeholder source.

## Risks

**Undocumented endpoints.** The CPF refinement id and the node id are internal
and can change without notice. Same fragility as every other selector in the
project; every function fails soft, and no listings is a normal outcome.

**Recommending new manufacturing.** Mitigated structurally: rung 2 appears only
when rung 1 is empty, and is always labelled new.

**Greenwashing by omission.** Mitigated by refusing to show an alternative
whose certification we cannot name.

## Out of scope

Best Buy greener alternatives. Carbon figures for categories with no published
PCF. Any figure without a citation.
