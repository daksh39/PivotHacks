/* ---------------------------------------------------------------------------
 * Where the secondhand listings come from.  Owned by lane/extension.
 *
 * Two sources, both real, neither needing an API key or an approved developer
 * account. Both work because the content script is already running ON the
 * retailer's origin, so these are same-origin reads of the site's own page and
 * its own frontend API. Nothing is proxied and no credential exists to leak.
 *
 *   Amazon   — the used buybox sits in the page DOM (#usedAccordionRow).
 *              Verified live: a textbook listed new at CAD243.63 carried
 *              "Used - Very Good" at CAD69.26 in that row.
 *
 *   Best Buy — /api/v2/json/search returns JSON their own storefront uses.
 *              Verified live: "Sony WH-CH720N" returned 101 results including
 *              11 Open Box variants at real prices ($180, $174).
 *
 * Both are undocumented internals and can change without notice. That is the
 * same fragility as the DOM selectors in extract.ts, and it is why every
 * function here fails soft: no listings is a normal outcome, never an error.
 * ------------------------------------------------------------------------- */

import type { UsedOption } from '../types'
import { currencyForUrl, parsePrice } from './extract'

/**
 * Days until the buyer has it.
 *
 * A single honest constant for now. Neither source reports a delivery estimate
 * we can trust yet, so this is NOT real data — and while every listing carries
 * the same value, the deadline rule in proxy/rank.ts cannot distinguish
 * between them. Wiring Best Buy's availability endpoint is what makes that
 * rule mean something.
 */
export const UNKNOWN_DELIVERY_DAYS = 7

/* --- amazon: the used buybox on the page --------------------------------- */

/** The ASIN, which is all we need to build a link to the offer listing. */
function asinFrom(url: string): string | null {
  return (url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/) ?? [])[1] ?? null
}

/**
 * Amazon's used buybox, if this product has one.
 *
 * Returns at most one offer: the buybox winner. Amazon's full offer list loads
 * through an endpoint that 404s when requested directly, so a list is not
 * available to us — one real offer is, and that is enough to make the claim.
 */
export function usedFromAmazonPage(url: string): UsedOption[] {
  const row = document.querySelector('#usedAccordionRow')
  if (!row) return []

  const priceText = row.querySelector('.a-price .a-offscreen')?.textContent
  const parsed = parsePrice(priceText, currencyForUrl(url))
  if (!parsed) return []

  /* Amazon injects <style> blocks inside this row, so read the labelled
   * element rather than the row's whole textContent — otherwise the condition
   * comes out as "Used - Very Good .savingPriceOverride { color:#CC0C39 }". */
  const condition =
    row.querySelector('.a-text-bold, .a-size-base-plus')?.textContent?.replace(/\s+/g, ' ').trim() ??
    'Used'

  const asin = asinFrom(url)

  return [
    {
      source: 'amazon',
      title: condition,
      price: parsed.amount,
      currency: parsed.currency,
      url: asin ? `https://www.amazon.com/gp/offer-listing/${asin}/?condition=used` : url,
      imageUrl: null,
      condition,
      daysToHand: UNKNOWN_DELIVERY_DAYS,
    },
  ]
}

/* --- best buy: open-box variants from the storefront's own search --------- */

type BestBuyProduct = {
  sku?: string
  name?: string
  salePrice?: number
  regularPrice?: number
  productUrl?: string
  thumbnailImage?: string | null
}

/** Best Buy has no condition field; the open-box variants are named for it. */
const OPEN_BOX = /open box/i

export async function bestBuyOpenBox(
  title: string,
  url: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<UsedOption[]> {
  const doFetch = options.fetchImpl ?? fetch
  const origin = originOf(url)
  const currency = currencyForUrl(url)

  /* Their search does better with the model than with the full marketing
   * title, which runs to a dozen words of adjectives. */
  const query = encodeURIComponent(title.split(/[,|–—-]/)[0].trim().slice(0, 80))

  try {
    const response = await doFetch(
      `${origin}/api/v2/json/search?query=${query}&pageSize=60&lang=en-CA`,
      { credentials: 'include', headers: { accept: 'application/json' } },
    )
    if (!response.ok) return []

    const body = (await response.json()) as { products?: BestBuyProduct[] }
    return (body.products ?? [])
      .filter((product) => OPEN_BOX.test(product.name ?? ''))
      .map((product) => toOption(product, origin, currency))
      .filter((option): option is UsedOption => option !== null)
  } catch {
    /* Offline, blocked, or the shape changed. No listings is a normal
     * outcome — the card renders its empty state and says so. */
    return []
  }
}

function originOf(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return 'https://www.bestbuy.ca'
  }
}

function toOption(
  product: BestBuyProduct,
  origin: string,
  currency: string,
): UsedOption | null {
  const price = product.salePrice ?? product.regularPrice
  if (!product.name || !product.productUrl || typeof price !== 'number') return null

  return {
    source: 'bestbuy',
    title: product.name,
    price,
    currency,
    url: product.productUrl.startsWith('http') ? product.productUrl : origin + product.productUrl,
    imageUrl: product.thumbnailImage ?? null,
    condition: 'Open box',
    daysToHand: UNKNOWN_DELIVERY_DAYS,
  }
}

/* --- dispatch ------------------------------------------------------------ */

/** Whichever source belongs to the page we are on. */
export async function findUsedListings(title: string, url: string): Promise<UsedOption[]> {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return []
  }

  if (/(^|\.)amazon\./i.test(host)) return usedFromAmazonPage(url)
  if (/(^|\.)bestbuy\./i.test(host)) return bestBuyOpenBox(title, url)
  return []
}
