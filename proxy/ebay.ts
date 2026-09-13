/* ---------------------------------------------------------------------------
 * eBay Browse API.  Layer 1, the live one (verte-plan.md §03).  Owned by lane/proxy.
 *
 * ┌─ HOUR ZERO ───────────────────────────────────────────────────────────┐
 * │ Start the eBay developer account signup FIRST, before writing any of  │
 * │ this. OAuth approval "is the kind of thing that quietly eats ninety   │
 * │ minutes" (§03).  https://developer.ebay.com                           │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * The client secret lives here and NOWHERE ELSE. Credentials in a content
 * script are both readable by anyone who opens the bundle and blocked by
 * CORS (§08). This is why the proxy exists at all.
 * ------------------------------------------------------------------------- */

import type { UsedOption } from '../src/types'

/**
 * Which eBay site to ask. A CAD product wants CAD listings; querying the US
 * marketplace for it returns prices we cannot legitimately compare.
 */
const MARKETPLACES: Record<string, string> = {
  USD: 'EBAY_US',
  CAD: 'EBAY_CA',
  GBP: 'EBAY_GB',
  AUD: 'EBAY_AU',
  EUR: 'EBAY_DE',
  JPY: 'EBAY_JP',
}

export function marketplaceForCurrency(currency: string): string {
  return MARKETPLACES[currency?.toUpperCase()] ?? 'EBAY_US'
}

/** Conservative default when eBay returns no delivery estimate at all. */
export const ASSUMED_SHIPPING_DAYS = 7

type ShippingOption = { maxEstimatedDeliveryDate?: string }

/**
 * Days until the buyer actually has it — the field the whole deadline ranking
 * turns on, so it is read from eBay rather than guessed.
 *
 * Rounds up: telling someone "2 days" for something landing late on day three
 * is how they miss a move-in date.
 */
export function deliveryDays(
  item: { shippingOptions?: ShippingOption[] },
  now: Date = new Date(),
): number {
  const estimates = (item.shippingOptions ?? [])
    .map((option) => option.maxEstimatedDeliveryDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => Math.ceil((new Date(value).getTime() - now.getTime()) / 86_400_000))
    .filter((days) => Number.isFinite(days) && days > 0)

  return estimates.length ? Math.min(...estimates) : ASSUMED_SHIPPING_DAYS
}

const HOSTS = {
  production: { auth: 'https://api.ebay.com', api: 'https://api.ebay.com' },
  sandbox: { auth: 'https://api.sandbox.ebay.com', api: 'https://api.sandbox.ebay.com' },
} as const

function hosts() {
  return HOSTS[(process.env.EBAY_ENV as keyof typeof HOSTS) ?? 'production'] ?? HOSTS.production
}

/* --- OAuth: client credentials grant, cached until just before expiry ---- */

let token: { value: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (token && Date.now() < token.expiresAt) return token.value

  const id = process.env.EBAY_CLIENT_ID
  const secret = process.env.EBAY_CLIENT_SECRET
  if (!id || !secret) {
    throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET missing — see .env.example')
  }

  const response = await fetch(`${hosts().auth}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  })

  if (!response.ok) {
    throw new Error(`eBay token request failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  token = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return token.value
}

/* --- search -------------------------------------------------------------- */

/** You will hit the same three demo products hundreds of times (§08). */
const cache = new Map<string, { at: number; options: UsedOption[] }>()
const TTL_MS = 15 * 60 * 1000

/** Used conditions only — that is the entire point of the product. */
const USED_CONDITIONS = '{USED_EXCELLENT|USED_VERY_GOOD|USED_GOOD|USED_ACCEPTABLE}'

export async function searchEbay(
  query: string,
  currency = 'USD',
  limit = 3,
): Promise<UsedOption[]> {
  const marketplace = marketplaceForCurrency(currency)
  const key = `${marketplace}:${query}:${limit}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.options

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    filter: `conditions:${USED_CONDITIONS}`,
    sort: 'price',
    /* Asks eBay to include shippingOptions, which is where the delivery
     * estimate deliveryDays() needs actually lives. */
    fieldgroups: 'EXTENDED',
  })

  const response = await fetch(`${hosts().api}/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      'X-EBAY-C-MARKETPLACE-ID': marketplace,
    },
  })

  if (!response.ok) {
    throw new Error(`eBay search failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as { itemSummaries?: EbayItem[] }
  const options: UsedOption[] = (data.itemSummaries ?? [])
    .map((item) => toUsedOption(item))
    .filter((o): o is UsedOption => o !== null)

  cache.set(key, { at: Date.now(), options })
  return options
}

export type EbayItem = {
  title?: string
  itemWebUrl?: string
  condition?: string
  price?: { value?: string; currency?: string }
  image?: { imageUrl?: string }
  shippingOptions?: ShippingOption[]
}

export function toUsedOption(item: EbayItem, now?: Date): UsedOption | null {
  const price = Number.parseFloat(item.price?.value ?? '')
  if (!item.title || !item.itemWebUrl || !Number.isFinite(price)) return null
  return {
    source: 'ebay',
    title: item.title,
    price,
    currency: item.price?.currency ?? 'USD',
    url: item.itemWebUrl,
    imageUrl: item.image?.imageUrl ?? null,
    condition: item.condition ?? 'Pre-owned',
    daysToHand: deliveryDays(item, now),
  }
}
