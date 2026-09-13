/* ---------------------------------------------------------------------------
 * The proxy.  Lane B (verte-plan.md §04).  Owned by lane/proxy.
 *
 * One endpoint. Takes a ProductContext, returns a VerteResult. Everything
 * that can pivot lives behind this line; the card never moves (§02).
 *
 *     npm run proxy:mock    # no credentials needed at all
 *     npm run proxy         # real eBay + Snowflake
 *     npm run smoke         # prove it works
 *
 * Local for now. Plain Express, so deploying later is a config file rather
 * than a rewrite — update host_permissions in manifest.config.ts and
 * VITE_PROXY_URL when that happens.
 * ------------------------------------------------------------------------- */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import type { ProductContext, VerteResult } from '../src/types'
import { mockFor } from '../src/mocks'
import { classify } from './categories'
import { searchEbay } from './ebay'
import { getCampusListings, getCategoryGuidance, logImpact } from './snowflake'

const MOCK = process.env.VERTE_MOCK === '1'
const PORT = Number(process.env.PORT ?? 8787)

const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, mock: MOCK, service: 'verte-proxy' })
})

app.post('/lookup', async (req, res) => {
  const product = req.body as ProductContext

  if (!product?.title) {
    res.status(400).json({ error: 'ProductContext.title is required' })
    return
  }

  const category = product.category || classify(product.title)
  if (!category) {
    res.status(404).json({ error: 'no category match', title: product.title })
    return
  }

  /* Mock mode: serve the shared fixtures. Same bytes the extension falls back
   * to and the same bytes the preview page renders, so every lane is building
   * against exactly what ships. */
  if (MOCK) {
    res.json(mockFor(category))
    return
  }

  try {
    const guidance = await getCategoryGuidance(category)
    if (!guidance) {
      res.status(404).json({ error: 'no guidance for category', category })
      return
    }

    /* Nothing to search for if we are telling them to buy it new. */
    const options =
      guidance.verdict === 'avoid'
        ? []
        : [
            ...(await getCampusListings(category)),
            ...(await searchEbay(product.title).catch((e) => {
              console.warn('[verte] eBay search failed, continuing:', e.message)
              return []
            })),
          ].sort((a, b) => a.price - b.price)

    res.json(assemble(product, guidance, options))
    if (guidance.verdict !== 'avoid') void logImpact(category, guidance.embodiedCo2Kg)
  } catch (error) {
    console.error('[verte] lookup failed:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'lookup failed' })
  }
})

/** The only place a VerteResult is built. Keep it that way. */
function assemble(
  product: ProductContext,
  guidance: Awaited<ReturnType<typeof getCategoryGuidance>>,
  options: VerteResult['options'],
): VerteResult {
  const cheapest = options.length ? Math.min(...options.map((o) => o.price)) : null
  const savingsUsd =
    product.price != null && cheapest != null && product.price > cheapest
      ? Math.round(product.price - cheapest)
      : null

  return {
    product: { ...product, category: guidance!.category },
    guidance: guidance!,
    options,
    savingsUsd,
    /* We only claim avoided manufacturing if they actually have something to
     * buy instead. No listings, no claim. */
    co2AvoidedKg: options.length ? guidance!.embodiedCo2Kg : null,
  }
}

app.listen(PORT, () => {
  console.log(`[verte] proxy on http://localhost:${PORT}  ${MOCK ? '(MOCK DATA)' : '(live)'}`)
})
