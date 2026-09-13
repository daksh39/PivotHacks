# Greener Alternatives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When no secondhand listing exists, offer Amazon Climate Pledge Friendly certified alternatives — named certification only, never our own green claim — and state carbon savings comparatively where a real citation exists.

**Architecture:** A new `greener.ts` content-script module finds certified products through Amazon's own CPF search refinement, same-origin, no credentials. `assemble.ts` populates a separate `greener` field **only when `options` is empty**, so a new product can never compete with a used one. A new `Greener.tsx` renders rung 2, always labelled new.

**Tech Stack:** TypeScript, React 18, Vite + CRXJS, Vitest + jsdom, Chrome MV3.

**Spec:** `docs/superpowers/specs/2026-09-13-greener-alternatives-design.md`

## Global Constraints

- Amazon only. Best Buy has no verified equivalent; the card must not imply coverage it lacks.
- `greener` is populated **only** when `options.length === 0`. This is the ladder rule.
- No green claim without a named third-party certification read verbatim from the page.
- `isSourced()` still governs carbon. No invented figures, no placeholder strings.
- Detection selector is exactly `#climatePledgeFriendly`. Looser selectors false-positive on every page.
- CPF search refinement: `rh=p_n_cpf_eligible%3A21512497011`.
- Every network function fails soft — returning `[]` is a normal outcome, never an error.
- Colours from `src/tokens.ts` only. `#D0E2B8` / `#9FB87E` are fills and borders, never text.

---

### Task 1: Types for rung 2

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `GreenerOption`, and `VerteResult.greener: GreenerOption[]`

- [ ] **Step 1: Add the type**

```ts
/**
 * A certified NEW product, shown only when nothing secondhand exists.
 *
 * Deliberately NOT a UsedOption variant: keeping them separate means no
 * ranking, currency or savings logic can accidentally treat a new product as
 * secondhand.
 */
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
```

- [ ] **Step 2: Add the field to VerteResult**

```ts
  /** Rung 2. Populated only when `options` is empty. */
  greener: GreenerOption[]
```

- [ ] **Step 3: Run typecheck to see the call sites that must change**

Run: `npm run typecheck`
Expected: errors in `src/assemble.ts` and `src/dev/fixtures.ts` — those are Tasks 3 and 5.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts && git commit -m "Add the greener option type"
```

---

### Task 2: Find certified alternatives

**Files:**
- Create: `src/contentScript/greener.ts`
- Test: `src/contentScript/greener.test.ts`

**Interfaces:**
- Consumes: `parsePrice`, `currencyForUrl` from `./extract`; `modelTokens`, `sameProduct` from `./listings`
- Produces: `findGreener(title: string, url: string, options?: { fetchImpl?: typeof fetch }): Promise<GreenerOption[]>`, `readCertification(doc: Document | Element): string | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'vitest'
import { findGreener, readCertification } from './greener'

/* Node shape copied from a live certified product page. Uncertified products
 * do not have #climatePledgeFriendly at all — verified 3/3 vs 0/3. */
const CERTIFIED = `
  <div id="climatePledgeFriendly">
    Sustainability features This product has sustainability features recognized by
    trusted certifications. Recycled materials Contains at least 50% recycled
    material. <a>Global Recycled Standard</a>
  </div>`

describe('readCertification', () => {
  test('names the certifier verbatim', () => {
    const el = new DOMParser().parseFromString(CERTIFIED, 'text/html')
    expect(readCertification(el)).toContain('Global Recycled Standard')
  })

  test('returns null when the product is not certified', () => {
    const el = new DOMParser().parseFromString('<div>nothing</div>', 'text/html')
    expect(readCertification(el)).toBeNull()
  })
})

describe('findGreener', () => {
  const page = (cards: { asin: string; title: string; price: string }[]) =>
    `<div>${cards
      .map(
        (c) =>
          `<div data-asin="${c.asin}"><h2>${c.title}</h2>
           <span class="a-price"><span class="a-offscreen">${c.price}</span></span></div>`,
      )
      .join('')}</div>`

  const fetchReturning = (searchHtml: string, productHtml: string) =>
    (async (input: string) =>
      ({
        ok: true,
        status: 200,
        text: async () => (String(input).includes('/s?k=') ? searchHtml : productHtml),
      }) as unknown as Response) as unknown as typeof fetch

  test('returns a certified alternative with its certification', async () => {
    const out = await findGreener('Cooluli Mini Fridge 4L', 'https://www.amazon.com/dp/B0771S9XT8', {
      fetchImpl: fetchReturning(
        page([{ asin: 'B0FN44NCTQ', title: 'BEICHEN Mini Fridge 4 Liter', price: 'CAD61.00' }]),
        CERTIFIED,
      ),
    })
    expect(out).toHaveLength(1)
    expect(out[0].price).toBe(61)
    expect(out[0].currency).toBe('CAD')
    expect(out[0].certification).toContain('Global Recycled Standard')
    expect(out[0].source).toBe('amazon')
  })

  test('drops a product whose certification cannot be named', async () => {
    const out = await findGreener('Cooluli Mini Fridge 4L', 'https://www.amazon.com/dp/B0771S9XT8', {
      fetchImpl: fetchReturning(
        page([{ asin: 'B0FN44NCTQ', title: 'BEICHEN Mini Fridge 4 Liter', price: 'CAD61.00' }]),
        '<div>no certification here</div>',
      ),
    })
    expect(out).toEqual([])
  })

  test('never throws when the network fails', async () => {
    const out = await findGreener('x', 'https://www.amazon.com/dp/B0', {
      fetchImpl: (async () => {
        throw new Error('offline')
      }) as unknown as typeof fetch,
    })
    expect(out).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- greener`
Expected: FAIL — `Cannot find module './greener'`

- [ ] **Step 3: Implement**

```ts
import type { GreenerOption } from '../types'
import { currencyForUrl, parsePrice } from './extract'
import { modelTokens, sameProduct } from './listings'

/** Amazon's own refinement for Climate Pledge Friendly. */
const CPF_REFINEMENT = 'p_n_cpf_eligible%3A21512497011'

/** How many product pages we open to check certification. Keep it small. */
const MAX_CANDIDATES = 4

/**
 * The certification text, verbatim.
 *
 * Only `#climatePledgeFriendly` exactly — `[id*="climatePledge"]` matches a
 * hidden container present on every product page and false-positives 100%.
 */
export function readCertification(root: Document | Element): string | null {
  const node = root.querySelector('#climatePledgeFriendly')
  if (!node) return null
  const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
  return text.length > 20 ? text.slice(0, 220) : null
}

export async function findGreener(
  title: string,
  url: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<GreenerOption[]> {
  const doFetch = options.fetchImpl ?? fetch
  const currency = currencyForUrl(url)
  let origin = 'https://www.amazon.com'
  try {
    origin = new URL(url).origin
  } catch {
    /* keep the default */
  }

  const models = modelTokens(title)
  const query = (models.length ? `${title.split(/\s+/)[0]} ${models[0]}` : title)
    .trim()
    .slice(0, 70)

  try {
    const search = await doFetch(
      `${origin}/s?k=${encodeURIComponent(query)}&rh=${CPF_REFINEMENT}`,
      { credentials: 'include' },
    )
    if (!search.ok) return []

    const doc = new DOMParser().parseFromString(await search.text(), 'text/html')
    const found: GreenerOption[] = []

    for (const card of [...doc.querySelectorAll('[data-asin]')].slice(0, MAX_CANDIDATES)) {
      const asin = card.getAttribute('data-asin') ?? ''
      const name = card.querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      const parsed = parsePrice(card.querySelector('.a-price .a-offscreen')?.textContent, currency)
      if (asin.length !== 10 || !name || !parsed) continue

      /* Confirm certification on the product's own page. The search
       * refinement changes the result set, but we state a green claim only
       * against a certification we have actually read. */
      const page = await doFetch(`${origin}/dp/${asin}`, { credentials: 'include' })
      if (!page.ok) continue
      const productDoc = new DOMParser().parseFromString(await page.text(), 'text/html')
      const certification = readCertification(productDoc)
      if (!certification) continue

      found.push({
        source: 'amazon',
        title: name,
        price: parsed.amount,
        currency: parsed.currency,
        url: `${origin}/dp/${asin}`,
        imageUrl: card.querySelector('img')?.getAttribute('src') ?? null,
        certification,
      })
    }
    return found
  } catch {
    return []
  }
}

/** Exported so the dispatch in index.tsx reads clearly. */
export { sameProduct }
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- greener`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/contentScript/greener.ts src/contentScript/greener.test.ts
git commit -m "Find certified alternatives on Amazon"
```

---

### Task 3: The ladder rule

**Files:**
- Modify: `src/assemble.ts`
- Test: `src/assemble.test.ts`

**Interfaces:**
- Consumes: `GreenerOption` from Task 1
- Produces: `buildResult(product, guidance, options, context, greener?: GreenerOption[]): VerteResult`

- [ ] **Step 1: Write the failing test**

```ts
const greenerOption = {
  source: 'amazon' as const,
  title: 'BEICHEN Mini Fridge',
  price: 61,
  currency: 'CAD',
  url: 'https://www.amazon.com/dp/B0FN44NCTQ',
  imageUrl: null,
  certification: 'Contains at least 50% recycled material. Global Recycled Standard',
}

describe('the ladder rule', () => {
  test('offers a greener new product when nothing secondhand exists', () => {
    const out = buildResult(product, null, [], ctx, [greenerOption])
    expect(out.greener).toHaveLength(1)
  })

  test('NEVER offers a new product when a used one exists', () => {
    /* This is the rule that keeps the thesis honest: a newly manufactured
     * item must never compete with one that already exists. */
    const out = buildResult(product, null, [option], ctx, [greenerOption])
    expect(out.greener).toEqual([])
  })

  test('defaults to empty when no alternatives were passed', () => {
    expect(buildResult(product, null, [], ctx).greener).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- assemble`
Expected: FAIL — `buildResult` takes 4 arguments / `greener` undefined

- [ ] **Step 3: Implement**

Change the signature and the return object:

```ts
export function buildResult(
  product: ProductContext,
  guidance: CategoryGuidance | null,
  options: UsedOption[],
  context: BuyerContext,
  greener: GreenerOption[] = [],
): VerteResult {
  const comparable = sameCurrency(options, product.currency)
  const usable = guidance?.verdict === 'avoid' ? [] : comparable
  const ranked = rank(usable, context, guidance ?? NO_GUIDANCE)

  return {
    /* ...existing fields... */
    /* The ladder: a new product is offered ONLY when nothing that already
     * exists is available. Buying new is always the weaker answer. */
    greener: ranked.options.length ? [] : greener,
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- assemble`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/assemble.ts src/assemble.test.ts
git commit -m "Offer a greener new option only when nothing used exists"
```

---

### Task 4: Render rung 2

**Files:**
- Create: `src/components/Greener.tsx`
- Modify: `src/components/Card.tsx`, `src/components/styles.ts`

**Interfaces:**
- Consumes: `GreenerOption`
- Produces: `<Greener options={GreenerOption[]} currency={string} />`

- [ ] **Step 1: Create the component**

```tsx
import type { GreenerOption } from '../types'
import { formatUsd } from '../carbon'

/**
 * Rung 2: a certified NEW product, shown only when nothing secondhand exists.
 *
 * Labelled "new" without exception. The certification is quoted from the
 * retailer — we never author a green claim ourselves, because a claim with no
 * named certifier is indistinguishable from greenwashing.
 */
export function Greener({ options }: { options: GreenerOption[] }) {
  if (!options.length) return null

  return (
    <div className="verte__greener">
      <p className="verte__greener-label">No secondhand — the greenest new option</p>
      <ul className="verte__listings">
        {options.slice(0, 2).map((option) => (
          <li key={option.url}>
            <a
              className="verte__listing"
              href={option.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="verte__listing-price">
                {formatUsd(option.price, option.currency)}
              </span>
              <span className="verte__listing-title">{option.title}</span>
              <span className="verte__listing-meta">
                <span className="verte__cert">new · certified</span>
              </span>
            </a>
            <p className="verte__cert-detail">{option.certification}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Render it in Card.tsx, after the impact block**

```tsx
        <Greener options={greener} />
```

Destructure `greener` from `result` alongside `options`, and import the component.

- [ ] **Step 3: Add styles to styles.ts (inside the template literal)**

```css
.verte__greener { margin-top: 14px; }
.verte__greener-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${color.accentText};
  margin-bottom: 6px;
}
.verte__cert {
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${color.accentText};
  background: ${color.moss};
  border-radius: 100px;
  padding: 2px 8px;
}
.verte__cert-detail {
  font-size: 12px;
  line-height: 1.45;
  color: ${color.inkSoft};
  margin: 2px 0 8px 2px;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm test`
Expected: 0 errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Greener.tsx src/components/Card.tsx src/components/styles.ts
git commit -m "Render the greener new option"
```

---

### Task 5: Wire it into the page, and fix fixtures

**Files:**
- Modify: `src/contentScript/index.tsx`, `src/dev/fixtures.ts`, `src/dev/preview.tsx`

- [ ] **Step 1: Fetch alternatives only when no listings were found**

```tsx
  const options = await findUsedListings(product.title, product.sourceUrl).catch(() => [])

  /* Only look for a new product when nothing that already exists turned up.
   * Skipping the request otherwise also avoids opening product pages we will
   * throw away. */
  const greener = options.length
    ? []
    : await findGreener(product.title, product.sourceUrl).catch(() => [])

  return buildResult(product, guidance, options, context, greener)
```

- [ ] **Step 2: Add `greener: []` to every fixture in `src/dev/fixtures.ts`**

Typecheck will name each one.

- [ ] **Step 3: Add a preview fixture showing rung 2**

```ts
export const FIXTURE_GREENER: VerteResult = {
  ...FIXTURE_NOTHING_FOUND,
  greener: [
    {
      source: 'amazon',
      title: 'BEICHEN Mini Fridge 4 Liter/6 Can Portable',
      price: 61,
      currency: 'CAD',
      url: 'https://www.amazon.com/dp/B0FN44NCTQ',
      imageUrl: null,
      certification:
        'Recycled materials. Contains at least 50% recycled material. As certified by Global Recycled Standard',
    },
  ],
}
```

Add a `<Panel label="NO SECONDHAND — GREENER NEW OPTION">` rendering it.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm test && npm run build`
Expected: 0 errors, all pass, clean build.

- [ ] **Step 5: Commit**

```bash
git add src/contentScript/index.tsx src/dev/fixtures.ts src/dev/preview.tsx
git commit -m "Look for a greener option when nothing used is available"
```

---

### Task 6: Comparative carbon wording and the smartphone figure

**Files:**
- Modify: `src/impactLine.ts`, `src/impactLine.test.ts`, `src/guidance.ts`, `src/categories.ts`

**Scope note:** three categories carry a defensible citation — monitor and
laptop already exist, smartphone is added here. No published PCF was found for
kettles, coats, desks and similar, so those keep the qualitative claim. Padding
the list with uncited figures is the one thing this project refuses to do.

- [ ] **Step 1: Write the failing test for comparative wording**

```ts
  test('states the saving against the product on screen', () => {
    expect(impactLine(cited)?.headline).toContain('less than buying this new')
  })
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- impactLine`
Expected: FAIL — headline still reads "Avoids ~322 kg CO₂e of manufacturing"

- [ ] **Step 3: Change the wording**

```ts
      headline: `${formatCo2(co2AvoidedKg)} less than buying this new — about ${milesDrivenEquivalent(
        co2AvoidedKg,
      )} miles driven`,
```

- [ ] **Step 4: Add the smartphone category**

In `src/categories.ts`, add to `DEPARTMENTS` above the generic rules:

```ts
  [/cell phones?|smartphones?|mobile phones?/i, 'phone'],
```

and to the keyword rules:

```ts
  { slug: 'phone', keywords: ['iphone', 'galaxy s', 'pixel', 'smartphone'] },
```

In `src/guidance.ts`:

```ts
  phone: {
    category: 'phone',
    verdict: 'check',
    checkTips: [
      'Ask for the battery health percentage.',
      'Confirm it is not carrier-locked or activation-locked.',
      'Check the IMEI is not blacklisted.',
    ],
    embodiedCo2Kg: 55,
    co2Source: 'US EPA / published smartphone LCAs — ~55 kg CO2e manufacturing, 85-95% of lifetime footprint',
    note: 'Manufacturing dominates a phone almost entirely, so a used one avoids nearly all of it.',
    bulky: false,
  },
```

- [ ] **Step 5: Verify all tests and the category/guidance parity check**

Run: `npm run typecheck && npm test`
Expected: 0 errors, all pass. Every classifier slug must have a guidance entry.

- [ ] **Step 6: Commit**

```bash
git add src/impactLine.ts src/impactLine.test.ts src/guidance.ts src/categories.ts
git commit -m "State carbon as a comparison, and cite smartphones"
```

---

## Self-Review

**Spec coverage:** Ladder framing → Task 3. CPF detection → Task 2. Named
certification → Task 2 (`readCertification`) and Task 4 (rendered). Data model
→ Task 1. Comparative wording → Task 6. Popup leading with kg → **deferred**,
noted below. Best Buy → explicitly out of scope.

**Deferred from the spec:** "popup leads with cumulative kg rather than
dollars". Small and independent; not required for the ladder to work. Worth a
follow-up task if the demo wants it.

**Scope correction against the spec:** the spec targeted twelve cited carbon
categories. Research yielded defensible figures for three. Task 6 reflects
reality rather than the aspiration.

**Type consistency:** `GreenerOption` (Task 1) is used identically in Tasks 2,
3, 4 and 5. `findGreener` and `readCertification` signatures match between
Task 2's implementation and Task 5's call site. `buildResult`'s fifth parameter
is optional, so existing four-argument calls keep compiling.
