/* ---------------------------------------------------------------------------
 * Rung 2: greener NEW products, for when nothing secondhand exists.
 *
 * Source is Amazon's own Climate Pledge Friendly programme, reached the same
 * way as everything else here — same-origin, no credentials, no API key.
 *
 * Verified live on 2026-09-13: every product sampled from the CPF-filtered
 * search carried #climatePledgeFriendly; no product from the plain search did.
 *
 * Two rules this module enforces, both about not overclaiming:
 *
 *   The search refinement is treated as a HINT, never as proof. Certification
 *   is confirmed on the product's own page before anything is shown. An
 *   earlier attempt at a used-condition filter taught us that Amazon silently
 *   ignores refinements it does not like, and a filter we trust blindly will
 *   eventually mislabel ordinary products.
 *
 *   Nothing is shown without a certification we can name. "Greener" with no
 *   certifier behind it is indistinguishable from greenwashing.
 * ------------------------------------------------------------------------- */

import type { GreenerOption } from '../types'
import { currencyForUrl, parsePrice } from './extract'
import { modelTokens, sameProduct } from './listings'

/** Amazon's own refinement id for Climate Pledge Friendly. */
const CPF_REFINEMENT = 'p_n_cpf_eligible%3A21512497011'

/**
 * How many product pages we will open to confirm certification.
 *
 * Each one is a real request on the user's connection, and rung 2 only ever
 * displays a couple of options, so there is nothing to gain from more.
 */
const MAX_CANDIDATES = 4

/** Shortest text we will accept as a real certification statement. */
const MIN_CERT_LENGTH = 20

/**
 * The certification text, verbatim from the retailer.
 *
 * The selector is exactly `#climatePledgeFriendly`. A looser one such as
 * `[id*="climatePledge" i]` matches a hidden container that exists on every
 * product page, certified or not, and reports everything as certified.
 */
export function readCertification(root: Document | Element): string | null {
  const node = root.querySelector('#climatePledgeFriendly')
  if (!node) return null

  const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
  return text.length > MIN_CERT_LENGTH ? text.slice(0, 220) : null
}

function originOf(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return 'https://www.amazon.com'
  }
}

export async function findGreener(
  title: string,
  url: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<GreenerOption[]> {
  const doFetch = options.fetchImpl ?? fetch
  const origin = originOf(url)
  const currency = currencyForUrl(url)

  /* Search the category rather than the exact model: the point of rung 2 is a
   * different, better-certified product, so requiring the same model would
   * return nothing by construction. */
  const models = modelTokens(title)
  const query = (models.length ? title.split(/\s+/).slice(0, 4).join(' ') : title)
    .trim()
    .slice(0, 70)

  try {
    const search = await doFetch(`${origin}/s?k=${encodeURIComponent(query)}&rh=${CPF_REFINEMENT}`, {
      credentials: 'include',
    })
    if (!search.ok) return []

    const doc = new DOMParser().parseFromString(await search.text(), 'text/html')
    const found: GreenerOption[] = []

    for (const card of [...doc.querySelectorAll('[data-asin]')].slice(0, MAX_CANDIDATES)) {
      const asin = card.getAttribute('data-asin') ?? ''
      const name = card.querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      const parsed = parsePrice(card.querySelector('.a-price .a-offscreen')?.textContent, currency)
      if (asin.length !== 10 || !name || !parsed) continue

      /* Confirm on the product's own page. The refinement is a hint. */
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
    /* Offline, blocked, or the markup moved. No alternatives is a normal
     * outcome — the card simply does not show rung 2. */
    return []
  }
}

export { sameProduct }
