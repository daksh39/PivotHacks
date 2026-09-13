/* ---------------------------------------------------------------------------
 * Reading the product off the page.  verte-plan.md §08.
 *
 * Order matters and it is not negotiable:
 *   1. application/ld+json Product block  — structured, stable, everywhere
 *   2. og: / twitter: meta tags           — still structured
 *   3. CSS selectors                      — last resort; these rot
 *
 * Retail markup churns constantly. Hand-picked selectors are the thing that
 * breaks at hour nine. Owned by lane/extension.
 * ------------------------------------------------------------------------- */

import type { ProductContext } from '../types'

type Partial_ = { title?: string; price?: number; currency?: string; imageUrl?: string }

/* --- 1. JSON-LD ---------------------------------------------------------- */

function walk(node: unknown, out: Record<string, unknown>[]): void {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, out))
    return
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const t = obj['@type']
    const types = Array.isArray(t) ? t : [t]
    if (types.includes('Product')) out.push(obj)
    if (obj['@graph']) walk(obj['@graph'], out)
  }
}

function fromJsonLd(): Partial_ | null {
  const blocks = document.querySelectorAll('script[type="application/ld+json"]')
  const products: Record<string, unknown>[] = []

  for (const block of blocks) {
    try {
      walk(JSON.parse(block.textContent ?? ''), products)
    } catch {
      /* malformed JSON-LD is common in the wild — skip it, don't throw */
    }
  }
  if (!products.length) return null

  const p = products[0]
  const offersRaw = p.offers
  const offer = (Array.isArray(offersRaw) ? offersRaw[0] : offersRaw) as
    | Record<string, unknown>
    | undefined
  const image = Array.isArray(p.image) ? p.image[0] : p.image

  return {
    title: typeof p.name === 'string' ? p.name : undefined,
    price: offer ? toNumber(offer.price ?? offer.lowPrice) : undefined,
    currency: typeof offer?.priceCurrency === 'string' ? offer.priceCurrency : undefined,
    imageUrl: typeof image === 'string' ? image : undefined,
  }
}

/* --- 2. meta tags -------------------------------------------------------- */

function meta(...names: string[]): string | undefined {
  for (const name of names) {
    const el =
      document.querySelector(`meta[property="${name}"]`) ??
      document.querySelector(`meta[name="${name}"]`)
    const content = el?.getAttribute('content')
    if (content) return content
  }
  return undefined
}

function fromMeta(): Partial_ {
  return {
    title: meta('og:title', 'twitter:title'),
    price: toNumber(meta('product:price:amount', 'og:price:amount')),
    currency: meta('product:price:currency', 'og:price:currency'),
    imageUrl: meta('og:image', 'twitter:image'),
  }
}

/* --- 3. selectors (Amazon only for now — §11 cut list) ------------------- */

const SELECTORS = {
  title: ['#productTitle', '#title span', 'h1[data-automation-id="product-title"]'],
  price: [
    '.a-price .a-offscreen',
    '#corePrice_feature_div .a-offscreen',
    '#priceblock_ourprice',
  ],
  image: ['#landingImage', '#imgBlkFront', '#main-image'],
}

function text(selectors: string[]): string | undefined {
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const value = el?.textContent?.trim()
    if (value) return value
  }
  return undefined
}

function fromSelectors(): Partial_ {
  const img = SELECTORS.image.map((s) => document.querySelector(s)).find(Boolean)
  return {
    title: text(SELECTORS.title),
    price: toNumber(text(SELECTORS.price)),
    imageUrl: img?.getAttribute('src') ?? undefined,
  }
}

/* --- helpers ------------------------------------------------------------- */

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const cleaned = value.replace(/[^0-9.]/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : undefined
}

/* --- public -------------------------------------------------------------- */

/**
 * Returns null when this does not look like a product page, which is the
 * signal to render nothing at all. A card on a search results page is worse
 * than no card.
 *
 * NOTE: `category` is left empty here on purpose. Classification lives in the
 * proxy (proxy/categories.ts) so it can be fixed in five seconds without
 * anyone reloading an extension.
 */
export function extractProduct(): ProductContext | null {
  const merged: Partial_ = { ...fromSelectors(), ...fromMeta(), ...(fromJsonLd() ?? {}) }

  if (!merged.title) return null

  return {
    title: merged.title.replace(/\s+/g, ' ').trim(),
    price: merged.price ?? null,
    currency: merged.currency ?? 'USD',
    category: '',
    imageUrl: merged.imageUrl ?? null,
    sourceUrl: location.href,
  }
}

/** Cheap gate before we bother extracting anything. */
export function looksLikeProductPage(): boolean {
  if (/\/(dp|gp\/product)\//.test(location.pathname)) return true
  return document.querySelector('script[type="application/ld+json"]') != null
}
