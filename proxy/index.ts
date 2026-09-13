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
import type { BuyerContext, ProductContext, UsedOption } from '../src/types'
import { classify } from './categories'
import { getCategoryGuidance, logImpact } from './snowflake'
import { DEFAULT_CONTEXT } from './rank'
import { buildResult } from '../src/result'

const PORT = Number(process.env.PORT ?? 8787)

const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'verte-proxy' })
})

app.post('/lookup', async (req, res) => {
  const { product, context, options } = req.body as {
    product: ProductContext
    context?: BuyerContext
    options?: UsedOption[]
  }
  const ctx: BuyerContext = context ?? DEFAULT_CONTEXT

  /* Listings arrive with the request. Both sources are same-origin reads of
   * the retailer's own page or frontend API, so only the content script can
   * perform them — this process could not fetch them if it tried. */
  const found: UsedOption[] = options ?? []

  if (!product?.title) {
    res.status(400).json({ error: 'ProductContext.title is required' })
    return
  }

  const category = product.category || classify(product.title)
  if (!category) {
    res.status(404).json({ error: 'no category match', title: product.title })
    return
  }


  try {
    const guidance = await getCategoryGuidance(category)
    if (!guidance) {
      res.status(404).json({ error: 'no guidance for category', category })
      return
    }

    res.json(buildResult(product, guidance, found, ctx))
    if (guidance.verdict !== 'avoid') void logImpact(category, guidance.embodiedCo2Kg)
  } catch (error) {
    console.error('[verte] lookup failed:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'lookup failed' })
  }
})

/* Building the result moved to src/result.ts, so the proxy and the extension
 * cannot drift apart on what the card receives. See the note at its top. */

app.listen(PORT, () => {
  console.log(`[verte] proxy on http://localhost:${PORT}`)
})
