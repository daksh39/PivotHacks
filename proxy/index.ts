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
import type { BuyerContext, ProductContext, VerteResult } from '../src/types'
import { mockFor } from '../src/mocks'
import { classify } from './categories'
import { searchEbay } from './ebay'
import { getCampusListings, getCategoryGuidance, logImpact } from './snowflake'
import { DEFAULT_CONTEXT, rank } from './rank'

const MOCK = process.env.VERTE_MOCK === '1'
const PORT = Number(process.env.PORT ?? 8787)

const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, mock: MOCK, service: 'verte-proxy' })
})

app.post('/lookup', async (req, res) => {
  const { product, context } = req.body as { product: ProductContext; context?: BuyerContext }
  const ctx: BuyerContext = context ?? DEFAULT_CONTEXT

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
    const base = mockFor(category)
    /* Built through assemble() like every other response. A second path here
     * meant mock mode skipped the currency guard and happily reported a CAD
     * saving against USD fixtures — the exact bug assemble() exists to stop.
     * One place builds a VerteResult. Keep it that way. */
    res.json(assemble({ ...product, category }, base.guidance, base.options, ctx))
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
            ...(await searchEbay(product.title, product.currency).catch((e) => {
              console.warn('[verte] eBay search failed, continuing:', e.message)
              return []
            })),
          ]

    res.json(assemble(product, guidance, options, ctx))
    if (guidance.verdict !== 'avoid') void logImpact(category, guidance.embodiedCo2Kg)
  } catch (error) {
    console.error('[verte] lookup failed:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'lookup failed' })
  }
})

/** The only place a VerteResult is built. Keep it that way. */
/**
 * Listings we can legitimately compare against this product.
 *
 * eBay is asked for the product's own marketplace, so a mismatch should be
 * rare — but "rare" is not "never", and a CAD price minus a USD price is not
 * a saving, it is a wrong number rendered with total confidence. We would
 * rather show fewer listings than invent arithmetic.
 */
function sameCurrency(options: VerteResult['options'], currency: string): VerteResult['options'] {
  const kept = options.filter((option) => option.currency === currency)
  const dropped = options.length - kept.length
  if (dropped) {
    console.warn(`[verte] dropped ${dropped} listing(s) not priced in ${currency}`)
  }
  return kept
}

function savingsFor(
  product: ProductContext,
  options: VerteResult['options'],
  reason: VerteResult['reason'],
): number | null {
  /* Against the RECOMMENDED option, not the cheapest one. If context pushed us
   * to a pricier listing, the saving we advertise has to be the one they'd
   * actually get. Quoting the cheap listing's saving would be a lie.
   *
   * And if nothing is usable, there is no saving to advertise at all — a card
   * reading "nothing arrives in time" beside "save $61" is a contradiction a
   * judge will catch in the first ten seconds. */
  if (reason === 'nothing-arrives-in-time') return null
  const recommended = options[0]?.price ?? null
  return product.price != null && recommended != null && product.price > recommended
    ? Math.round(product.price - recommended)
    : null
}

function assemble(
  product: ProductContext,
  guidance: Awaited<ReturnType<typeof getCategoryGuidance>>,
  options: VerteResult['options'],
  ctx: BuyerContext,
): VerteResult {
  const comparable = sameCurrency(options, product.currency)
  const ranked = rank(comparable, ctx, guidance!)
  const savingsUsd = savingsFor(product, ranked.options, ranked.reason)

  return {
    product: { ...product, category: guidance!.category },
    guidance: guidance!,
    options: ranked.options,
    context: ctx,
    reason: ranked.reason,
    passedOver: ranked.passedOver,
    savingsUsd,
    /* We only claim avoided manufacturing if they actually have something to
     * buy instead. No listings, no claim. */
    /* Only claim avoided manufacturing if they have something they can
     * actually buy instead. Nothing viable, no claim. */
    co2AvoidedKg:
      ranked.options.length && ranked.reason !== 'nothing-arrives-in-time'
        ? guidance!.embodiedCo2Kg
        : null,
  }
}

app.listen(PORT, () => {
  console.log(`[verte] proxy on http://localhost:${PORT}  ${MOCK ? '(MOCK DATA)' : '(live)'}`)
})
