/* ---------------------------------------------------------------------------
 * Service worker (Manifest V3).  Lane A (verte-plan.md §04).
 *
 * The ONLY part of the extension that talks to the proxy. The content script
 * asks, this fetches. Keeping it here means one host permission, one place to
 * change the endpoint when we deploy, and no CORS surprises (§08).
 *
 * Owned by lane/extension.
 * ------------------------------------------------------------------------- */

import type { LookupRequest, LookupResponse, VerteResult } from '../types'

const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? 'http://localhost:8787'

/** You will hit the same three demo products hundreds of times (§08). */
const cache = new Map<string, { at: number; result: VerteResult }>()
const TTL_MS = 10 * 60 * 1000

chrome.runtime.onMessage.addListener((message: LookupRequest, _sender, sendResponse) => {
  if (message?.type !== 'VERTE_LOOKUP') return false

  void (async () => {
    /* Cache key includes the context — the same product under a different
     * deadline is a genuinely different answer, not a cache hit. */
    const key = `${message.product.sourceUrl}|${message.context.needInDays}|${message.context.hasCar}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < TTL_MS) {
      sendResponse({ ok: true, result: hit.result } satisfies LookupResponse)
      return
    }

    try {
      const response = await fetch(`${PROXY_URL}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: message.product, context: message.context }),
      })

      if (!response.ok) {
        sendResponse({
          ok: false,
          error: `proxy returned ${response.status}`,
        } satisfies LookupResponse)
        return
      }

      const result = (await response.json()) as VerteResult
      cache.set(key, { at: Date.now(), result })
      void recordImpact(result)
      sendResponse({ ok: true, result } satisfies LookupResponse)
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'proxy unreachable',
      } satisfies LookupResponse)
    }
  })()

  /* Keep the message channel open for the async sendResponse above. */
  return true
})

/** Running avoided-emissions total for the popup (§04 lane C). */
async function recordImpact(result: VerteResult): Promise<void> {
  if (!result.co2AvoidedKg) return
  const { impact = { co2Kg: 0, usd: 0, seen: 0 } } = await chrome.storage.local.get('impact')
  await chrome.storage.local.set({
    impact: {
      co2Kg: impact.co2Kg + result.co2AvoidedKg,
      usd: impact.usd + (result.savingsUsd ?? 0),
      seen: impact.seen + 1,
    },
  })
}
