/* ---------------------------------------------------------------------------
 * The offline table is a copy, so the thing worth testing is that it is still
 * a faithful one.
 *
 * proxy/snowflake.ts is lane/snowflake's file and will grow a database client
 * that cannot be bundled into a service worker, which is why src/offline.ts
 * carries its own copy rather than importing it. This test is what keeps the
 * two from drifting apart quietly.
 *
 * When guidance moves to a real Snowflake table, getCategoryGuidance will stop
 * answering without credentials. The assertion below is deliberately phrased
 * as "if the proxy has an opinion, ours must match it", so that migration
 * makes this test go quiet rather than go red.
 * ------------------------------------------------------------------------- */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OFFLINE_GUIDANCE, resolveLocally } from './offline'
import { __SEED, getCategoryGuidance } from '../proxy/snowflake'
import { generate } from '../proxy/offline.gen'
import { KNOWN_CATEGORIES } from '../proxy/categories'
import type { BuyerContext, ProductContext, UsedOption } from './types'

const NO_CONTEXT: BuyerContext = { needInDays: null, hasCar: false, budgetCap: null }

const product = (over: Partial<ProductContext> = {}): ProductContext => ({
  title: 'Midea 3.1 Cu. Ft. Compact Mini Fridge',
  price: 89,
  currency: 'USD',
  category: '',
  imageUrl: null,
  sourceUrl: 'https://www.amazon.com/dp/TEST',
  ...over,
})

const option = (over: Partial<UsedOption> = {}): UsedOption => ({
  source: 'amazon',
  title: 'Used - Very Good',
  price: 52,
  currency: 'USD',
  url: 'https://example.test/a',
  imageUrl: null,
  condition: 'Used - Very Good',
  daysToHand: 7,
  ...over,
})

describe('the offline table is a faithful copy of the proxy table', () => {
  it('is exactly what the generator produces — regenerate if this fails', () => {
    /* npx tsx proxy/offline.gen.ts
     * Same guard main uses for data/category-guidance.sql: the copy is
     * generated, so the only way it drifts is by someone editing it by hand
     * or by SEED moving underneath it. */
    const onDisk = readFileSync(resolve(process.cwd(), 'src/offline-guidance.ts'), 'utf8')
    expect(onDisk).toBe(generate())
  })

  it('covers every category the proxy has guidance for', async () => {
    for (const slug of Object.keys(__SEED)) {
      expect(OFFLINE_GUIDANCE[slug], `${slug} missing offline`).toBeDefined()
      expect(OFFLINE_GUIDANCE[slug]).toEqual(await getCategoryGuidance(slug))
    }
  })

  it('covers every slug the classifier can emit', () => {
    /* Otherwise the extension recognises a product, classifies it, and then
     * goes quiet the moment the proxy is not running. */
    for (const slug of KNOWN_CATEGORIES) {
      expect(OFFLINE_GUIDANCE[slug], `${slug} classifies but has no offline guidance`).toBeDefined()
    }
  })

  it('never carries a carbon figure without a source to back it', () => {
    for (const g of Object.values(OFFLINE_GUIDANCE)) {
      if (g.embodiedCo2Kg > 0) expect(g.co2Source).not.toBe('')
    }
  })
})

describe('resolving without the proxy', () => {
  it('produces the same shape the proxy would', () => {
    const result = resolveLocally(product(), NO_CONTEXT, [option()])
    expect(result).not.toBeNull()
    expect(result!.guidance.category).toBe('mini-fridge')
    expect(result!.options).toHaveLength(1)
    expect(result!.savingsUsd).toBe(37)
    expect(result!.reason).toBe('cheapest')
  })

  it('shows nothing secondhand where the verdict is to buy new', () => {
    const result = resolveLocally(
      product({ title: 'Zinus 8 Inch Green Tea Memory Foam Mattress' }),
      NO_CONTEXT,
      [option()],
    )
    expect(result!.guidance.verdict).toBe('avoid')
    expect(result!.options).toEqual([])
    expect(result!.co2AvoidedKg).toBeNull()
  })

  it('claims no saving when nothing arrives in time', () => {
    const result = resolveLocally(product(), { needInDays: 1, hasCar: false, budgetCap: null }, [option()])
    expect(result!.reason).toBe('nothing-arrives-in-time')
    expect(result!.savingsUsd).toBeNull()
    expect(result!.co2AvoidedKg).toBeNull()
  })

  it('claims no saving when nothing is within budget', () => {
    /* The budget rule arrived with main. The offline path delegates to the
     * same rank(), so it has to come out the same way here. */
    const result = resolveLocally(product(), { needInDays: null, hasCar: false, budgetCap: 40 }, [
      option(),
    ])
    expect(result!.reason).toBe('nothing-in-budget')
    expect(result!.savingsUsd).toBeNull()
    expect(result!.co2AvoidedKg).toBeNull()
    /* Over-budget listings stay on the card — hiding them would conceal that
     * a secondhand market exists at all. */
    expect(result!.options).toHaveLength(1)
  })

  it('never subtracts one currency from another', () => {
    const result = resolveLocally(product({ currency: 'CAD' }), NO_CONTEXT, [
      option({ currency: 'USD' }),
    ])
    expect(result!.options).toEqual([])
    expect(result!.savingsUsd).toBeNull()
  })

  it('returns null for a category it has no opinion about', () => {
    expect(resolveLocally(product({ title: 'Artisanal Sourdough Starter' }), NO_CONTEXT, [])).toBeNull()
  })

})
