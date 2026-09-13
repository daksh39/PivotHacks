/* ---------------------------------------------------------------------------
 * Reading the product off the page.  verte-plan.md §08.  Owned by lane/extension.
 *
 * The original version put JSON-LD first on the grounds that it is "structured,
 * stable, everywhere". Probing the live sites showed that it is not: neither
 * amazon.com nor bestbuy.ca emits a JSON-LD Product block OR an og:title. On
 * both, DOM selectors are the only thing that fires.
 *
 * So the order is now: a site adapter when we have one, and structured data as
 * the generic fallback for every other retailer (plenty of them do publish it).
 *
 * Currency is read from the price string rather than assumed. amazon.com serves
 * "CAD73.54" to a browser in Canada; defaulting to USD misreports the price and
 * corrupts every saving computed against it.
 * ------------------------------------------------------------------------- */

import type { ProductContext } from '../types'

export type ParsedPrice = { amount: number; currency: string }

type Draft = { title?: string; price?: number; currency?: string; imageUrl?: string }

/* --- price + currency ---------------------------------------------------- */

/**
 * Only UNAMBIGUOUS markers live here. A bare "$" is deliberately absent: it is
 * used by at least a dozen countries, and bestbuy.ca renders Canadian prices
 * as plain "$125.99". When nothing here matches, the storefront's domain
 * decides — see currencyForUrl.
 */
const CURRENCY_RULES: [RegExp, string][] = [
  [/CAD|C\$/i, 'CAD'],
  [/US\$|USD/i, 'USD'],
  [/AUD|A\$/i, 'AUD'],
  [/£|GBP/i, 'GBP'],
  [/€|EUR/i, 'EUR'],
  [/¥|JPY/i, 'JPY'],
]

/** Longest suffix first, so ".co.uk" is tested before ".uk". */
const TLD_CURRENCY: [string, string][] = [
  ['.co.uk', 'GBP'],
  ['.com.au', 'AUD'],
  ['.co.jp', 'JPY'],
  ['.ca', 'CAD'],
  ['.uk', 'GBP'],
  ['.au', 'AUD'],
  ['.jp', 'JPY'],
  ['.de', 'EUR'],
  ['.fr', 'EUR'],
  ['.es', 'EUR'],
  ['.it', 'EUR'],
  ['.nl', 'EUR'],
  ['.ie', 'EUR'],
]

/**
 * What a bare currency symbol most likely means on this storefront.
 * amazon.ca and bestbuy.ca quote Canadian dollars with a plain "$".
 */
export function currencyForUrl(url: string): string {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return 'USD'
  }
  for (const [suffix, code] of TLD_CURRENCY) {
    if (host.endsWith(suffix)) return code
  }
  return 'USD'
}

function detectCurrency(raw: string, fallback: string): string {
  for (const [pattern, code] of CURRENCY_RULES) {
    if (pattern.test(raw)) return code
  }
  return fallback
}

/**
 * Handles both "1,299.00" (comma thousands) and "45,00" (comma decimal).
 * Whichever separator appears last is the decimal one — unless more than two
 * digits follow it, which makes it a thousands separator instead.
 */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, '')
  if (!cleaned || !/\d/.test(cleaned)) return null

  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')

  let normalized: string
  if (lastComma > lastDot && cleaned.length - lastComma - 1 <= 2) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }

  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : null
}

/**
 * Null when the text carries no price at all ("Currently unavailable").
 *
 * `fallbackCurrency` is used only when the string carries no unambiguous
 * marker. An explicit "CAD", "US$" or "£" always wins over it.
 */
export function parsePrice(
  raw: string | null | undefined,
  fallbackCurrency = 'USD',
): ParsedPrice | null {
  if (!raw) return null
  const amount = parseAmount(raw)
  if (amount === null) return null
  return { amount, currency: detectCurrency(raw, fallbackCurrency) }
}

/* --- small DOM helpers --------------------------------------------------- */

function textOf(...selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.textContent?.trim()
    if (value) return value
  }
  return undefined
}

function attrOf(attribute: string, ...selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.getAttribute(attribute)
    if (value) return value
  }
  return undefined
}

function applyPrice(draft: Draft, raw: string | undefined, fallback: string): void {
  const parsed = parsePrice(raw, fallback)
  if (!parsed) return
  draft.price = parsed.amount
  draft.currency = parsed.currency
}

/* --- site adapters ------------------------------------------------------- */

function fromAmazon(fallback: string): Draft {
  const draft: Draft = {
    title: textOf('#productTitle', '#title span'),
    imageUrl: attrOf('src', '#landingImage', '#imgBlkFront', '#main-image'),
  }
  applyPrice(
    draft,
    textOf('#corePrice_feature_div .a-offscreen', '.a-price .a-offscreen', '#priceblock_ourprice'),
    fallback,
  )
  return draft
}

function fromBestBuy(fallback: string): Draft {
  const draft: Draft = { title: textOf('h1') }

  /* Best Buy ships hashed CSS-module classnames that change every deploy, so
   * match on the stable prefix rather than the full name. Several prices sit
   * on the page — recommended products, bundles — and the product's own price
   * is the first one in document order. */
  for (const node of document.querySelectorAll('[class*="screenReaderOnly"]')) {
    const parsed = parsePrice(node.textContent, fallback)
    if (parsed) {
      draft.price = parsed.amount
      draft.currency = parsed.currency
      break
    }
  }
  return draft
}

/* --- generic: structured data, for retailers that publish it ------------- */

function collectProducts(node: unknown, found: Record<string, unknown>[]): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectProducts(child, found))
    return
  }
  if (!node || typeof node !== 'object') return

  const object = node as Record<string, unknown>
  const rawType = object['@type']
  const types = Array.isArray(rawType) ? rawType : [rawType]
  if (types.includes('Product')) found.push(object)
  if (object['@graph']) collectProducts(object['@graph'], found)
}

function fromJsonLd(): Draft | null {
  const found: Record<string, unknown>[] = []

  for (const block of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      collectProducts(JSON.parse(block.textContent ?? ''), found)
    } catch {
      /* Malformed JSON-LD is common in the wild. Skip it, never throw. */
    }
  }
  if (!found.length) return null

  const product = found[0]
  const rawOffers = product.offers
  const offer = (Array.isArray(rawOffers) ? rawOffers[0] : rawOffers) as
    | Record<string, unknown>
    | undefined
  const image = Array.isArray(product.image) ? product.image[0] : product.image

  const draft: Draft = {
    title: typeof product.name === 'string' ? product.name : undefined,
    imageUrl: typeof image === 'string' ? image : undefined,
  }

  const price = offer?.price ?? offer?.lowPrice
  if (price != null) {
    const amount = parseAmount(String(price))
    if (amount !== null) draft.price = amount
  }
  if (typeof offer?.priceCurrency === 'string') draft.currency = offer.priceCurrency

  return draft
}

function metaOf(...names: string[]): string | undefined {
  for (const name of names) {
    const element =
      document.querySelector(`meta[property="${name}"]`) ??
      document.querySelector(`meta[name="${name}"]`)
    const content = element?.getAttribute('content')
    if (content) return content
  }
  return undefined
}

function fromMeta(): Draft {
  const draft: Draft = {
    title: metaOf('og:title', 'twitter:title'),
    imageUrl: metaOf('og:image', 'twitter:image'),
  }
  const amount = parseAmount(metaOf('product:price:amount', 'og:price:amount') ?? '')
  if (amount !== null) draft.price = amount
  draft.currency = metaOf('product:price:currency', 'og:price:currency')
  return draft
}

/* --- the retailer's own category ----------------------------------------- */

/**
 * The breadcrumb trail, general → specific.
 *
 * The site already knows what this product is; guessing from the marketing
 * title is strictly worse. Amazon renders a wayfinding breadcrumb, and most
 * other retailers use a nav with a breadcrumb role.
 */
export function readBreadcrumbs(): string[] {
  const nodes = document.querySelectorAll(
    '#wayfinding-breadcrumbs_feature_div a, nav[aria-label*="readcrumb" i] a, [class*="breadcrumb" i] a',
  )
  return [...nodes]
    .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter((text) => text.length > 1 && text.length < 60)
}

/* --- site dispatch ------------------------------------------------------- */

type Site = 'amazon' | 'bestbuy' | 'generic'

function siteOf(url: string): Site {
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return 'generic'
  }
  if (/(^|\.)amazon\./i.test(host)) return 'amazon'
  if (/(^|\.)bestbuy\./i.test(host)) return 'bestbuy'
  return 'generic'
}

/** Merge order: later sources only fill gaps the earlier ones left. */
function merge(...drafts: (Draft | null)[]): Draft {
  const out: Draft = {}
  for (const draft of drafts) {
    if (!draft) continue
    for (const [key, value] of Object.entries(draft)) {
      if (value !== undefined && out[key as keyof Draft] === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(out as any)[key] = value
      }
    }
  }
  return out
}

/* --- public -------------------------------------------------------------- */

/**
 * Returns null when there is no product to be found, which is the signal to
 * render nothing. A card on a search results page is worse than no card.
 *
 * `category` is left empty on purpose: classification lives in the proxy so it
 * can be fixed without anyone reloading an extension.
 *
 * The URL is a parameter rather than a read of `location` so this is a pure
 * function of (DOM, url) and can be tested.
 */
export function extractProduct(url: string = location.href): ProductContext | null {
  const site = siteOf(url)

  const fallbackCurrency = currencyForUrl(url)

  const adapter =
    site === 'amazon'
      ? fromAmazon(fallbackCurrency)
      : site === 'bestbuy'
        ? fromBestBuy(fallbackCurrency)
        : null
  const merged = merge(adapter, fromJsonLd(), fromMeta())

  if (!merged.title) return null

  return {
    title: merged.title.replace(/\s+/g, ' ').trim(),
    price: merged.price ?? null,
    currency: merged.currency ?? fallbackCurrency,
    category: '',
    imageUrl: merged.imageUrl ?? null,
    sourceUrl: url,
  }
}

/** Cheap gate before we bother extracting anything. */
/**
 * URL shapes that are product pages beyond doubt.
 *
 * This knew two of them and missed the rest, which is most of why the card
 * "sometimes doesn't appear":
 *
 *   - bestbuy.COM does not use /product/ at all. Its product URLs are
 *     /site/<slug>/<sku>.p?skuId=… so every US Best Buy page was skipped,
 *     even though the manifest matches the domain. Only bestbuy.ca worked.
 *   - Amazon serves /gp/aw/d/<ASIN> to mobile and to some referral paths.
 *   - amazon.ca bilingual URLs carry a /-/en/ segment before /dp/.
 */
const PRODUCT_URL: Record<Exclude<Site, 'generic'>, RegExp[]> = {
  amazon: [/\/(?:dp|gp\/product|gp\/aw\/d|gp\/aw\/ol)\//i],
  bestbuy: [/\/product\//i, /\/site\/.+\.p(?:$|[?#])/i, /[?&]skuId=/i],
}

/**
 * What the page itself shows, for the URLs the list above still misses.
 *
 * Retail URL shapes churn — that is the whole reason the first version fell
 * behind — so the URL is a fast path, not the authority. When it does not
 * match, ask the DOM, using elements that exist ONLY on a product page.
 * `#productTitle` is Amazon's; an add-to-cart control beside an <h1> is Best
 * Buy's. A search results page has neither, which is what keeps this from
 * putting a card on a page full of other people's prices.
 */
function domSaysProduct(site: Site): boolean {
  switch (site) {
    case 'amazon':
      return document.querySelector('#productTitle') !== null
    case 'bestbuy':
      return (
        document.querySelector('h1') !== null &&
        document.querySelector(
          '[data-testid="add-to-cart-button"], [class*="addToCartButton"], .shop-add-to-cart, .fulfillment-add-to-cart-button',
        ) !== null
      )
    default:
      return false
  }
}

export function looksLikeProductPage(url: string = location.href): boolean {
  let path: string
  try {
    const parsed = new URL(url)
    path = parsed.pathname + parsed.search
  } catch {
    return false
  }

  const site = siteOf(url)
  if (site === 'generic') {
    /* Unknown retailer: only proceed if it says so in structured data. */
    return fromJsonLd() !== null || metaOf('og:type') === 'product'
  }

  if (PRODUCT_URL[site].some((pattern) => pattern.test(path))) return true
  return domSaysProduct(site)
}
