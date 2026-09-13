/* ---------------------------------------------------------------------------
 * The answer, computed in the extension, when the proxy is not answering.
 *
 * WHY THIS EXISTS
 *
 * The proxy was introduced to hold a credential: §08 is emphatic that the eBay
 * secret cannot live in a content script. That reason is gone. Listings are now
 * read from the retailer's own page and frontend API by the content script
 * itself, same-origin, with no credential anywhere — so what /lookup does today
 * is classify a title, look up a category, rank some options and do arithmetic.
 * All of it pure, none of it secret.
 *
 * So when the proxy is unreachable the honest thing is not to disappear. It is
 * to do the same work here. Loading dist/ into Chrome now produces a working
 * extension on its own, with no second terminal — which is what "demo ready"
 * actually means.
 *
 * The proxy is still the source of truth whenever it answers, and it has to
 * stay that way: lane/snowflake is moving guidance into a real database, and
 * database credentials genuinely cannot live in here. This is the fallback,
 * not the plan.
 *
 * WHAT IS DUPLICATED, AND WHAT GUARDS IT
 *
 * The category table is copied out of proxy/snowflake.ts, which we cannot
 * import — it reaches for snowflake-sdk, which has no business in a service
 * worker. But the copy is GENERATED, never retyped: src/offline-guidance.ts
 * comes from `npx tsx proxy/offline.gen.ts`, the same arrangement main already
 * uses for data/category-guidance.sql. offline.test.ts fails if it drifts.
 *
 * Everything else is shared outright. The result itself is built by
 * src/result.ts, which the proxy also calls, so the two cannot disagree about
 * savings, carbon, or which reasons mean "nothing here is usable".
 * ------------------------------------------------------------------------- */

import type { BuyerContext, CategoryGuidance, ProductContext, UsedOption, VerteResult } from './types'
import { classify } from '../proxy/categories'
import { buildResult } from './result'
import { OFFLINE_GUIDANCE } from './offline-guidance'

export { OFFLINE_GUIDANCE }

/**
 * Null means the same thing it means at the proxy: we have nothing useful to
 * say about this product, so render no card. A wrong verdict is far worse than
 * no verdict.
 */
export function resolveLocally(
  product: ProductContext,
  context: BuyerContext,
  options: UsedOption[],
): VerteResult | null {
  const category = product.category || classify(product.title)
  if (!category) return null

  const guidance = OFFLINE_GUIDANCE[category]
  if (!guidance) return null

  /* Identical to what the proxy would have returned — same builder. */
  return buildResult(product, guidance, options, context)
}
