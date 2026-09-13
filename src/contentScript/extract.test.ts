/* ---------------------------------------------------------------------------
 * Extraction tests, written against DOM shapes observed on the real sites.
 *
 * Two things were confirmed by probing live pages, and both contradict the
 * assumptions the first version was built on:
 *
 *   1. Neither amazon.com nor bestbuy.ca emits a JSON-LD Product block or an
 *      og:title. On both, only DOM selectors fire. JSON-LD is a fallback for
 *      OTHER retailers, not the primary path.
 *
 *   2. amazon.com served "CAD73.54" to a browser in Canada. Stripping the
 *      letters and defaulting the currency to USD misreports the price and
 *      corrupts every savings figure computed against it.
 * ------------------------------------------------------------------------- */

import { beforeEach, describe, expect, test } from 'vitest'
import { currencyForUrl, extractProduct, looksLikeProductPage, parsePrice } from './extract'

/* The URL is passed in rather than read off `location`. jsdom refuses
 * cross-origin history rewrites, and more importantly a function that reads
 * global state is one you cannot test — the awkwardness was the design
 * telling on itself. */
const AMAZON_URL = 'https://www.amazon.com/dp/B0771S9XT8'

function setPage(html: string) {
  document.head.innerHTML = ''
  document.body.innerHTML = html
}

beforeEach(() => setPage(''))

/* --- currency, the live bug --------------------------------------------- */

describe('parsePrice', () => {
  test('reads the CAD amazon.com serves to a Canadian browser', () => {
    expect(parsePrice('CAD73.54')).toEqual({ amount: 73.54, currency: 'CAD' })
  })

  test('reads a plain dollar price as USD', () => {
    expect(parsePrice('$125.99')).toEqual({ amount: 125.99, currency: 'USD' })
  })

  test('distinguishes C$ from US$', () => {
    expect(parsePrice('C$289.99')).toEqual({ amount: 289.99, currency: 'CAD' })
    expect(parsePrice('US$19.00')).toEqual({ amount: 19, currency: 'USD' })
  })

  test('reads sterling and euro symbols', () => {
    expect(parsePrice('£20.00')).toEqual({ amount: 20, currency: 'GBP' })
    expect(parsePrice('€45,00')).toEqual({ amount: 45, currency: 'EUR' })
  })

  test('strips thousands separators', () => {
    expect(parsePrice('$1,299.00')).toEqual({ amount: 1299, currency: 'USD' })
  })

  test('returns null for text carrying no price', () => {
    expect(parsePrice('Currently unavailable')).toBeNull()
    expect(parsePrice('')).toBeNull()
  })

  /* Caught on the live bestbuy.ca page: it renders a bare "$125.99" for a
   * price that is Canadian. A lone dollar sign carries no country, so the
   * domain has to supply it. */
  test('resolves a bare dollar sign using the supplied default', () => {
    expect(parsePrice('$125.99', 'CAD')).toEqual({ amount: 125.99, currency: 'CAD' })
  })

  test('an explicit currency still beats the default', () => {
    expect(parsePrice('US$19.00', 'CAD')).toEqual({ amount: 19, currency: 'USD' })
    expect(parsePrice('CAD73.54', 'USD')).toEqual({ amount: 73.54, currency: 'CAD' })
    expect(parsePrice('£20.00', 'CAD')).toEqual({ amount: 20, currency: 'GBP' })
  })
})

describe('currency from the domain', () => {
  test('a .ca storefront means Canadian dollars', () => {
    expect(currencyForUrl('https://www.bestbuy.ca/en-ca/product/x/1')).toBe('CAD')
    expect(currencyForUrl('https://www.amazon.ca/dp/B0771S9XT8')).toBe('CAD')
  })

  test('a .co.uk storefront means sterling', () => {
    expect(currencyForUrl('https://www.amazon.co.uk/dp/B0771S9XT8')).toBe('GBP')
  })

  test('.com falls back to US dollars', () => {
    expect(currencyForUrl('https://www.amazon.com/dp/B0771S9XT8')).toBe('USD')
  })
})

/* --- amazon: selectors only --------------------------------------------- */

describe('amazon', () => {
  const AMAZON = `
    <span id="productTitle">  Cooluli Mini Fridge for Bedroom - Car, Office Desk &amp; Dorm Room  </span>
    <div id="corePrice_feature_div"><span class="a-price"><span class="a-offscreen">CAD73.54</span></span></div>
    <img id="landingImage" src="https://m.media-amazon.com/images/I/61kGyC6wWtL.jpg" />
  `

  test('extracts the title from #productTitle and collapses whitespace', () => {
    setPage(AMAZON)
    expect(extractProduct(AMAZON_URL)?.title).toBe(
      'Cooluli Mini Fridge for Bedroom - Car, Office Desk & Dorm Room',
    )
  })

  test('keeps the currency amazon actually served instead of assuming USD', () => {
    setPage(AMAZON)
    const product = extractProduct(AMAZON_URL)
    expect(product?.price).toBe(73.54)
    expect(product?.currency).toBe('CAD')
  })

  test('extracts the hero image', () => {
    setPage(AMAZON)
    expect(extractProduct(AMAZON_URL)?.imageUrl).toBe(
      'https://m.media-amazon.com/images/I/61kGyC6wWtL.jpg',
    )
  })

  test('still returns a product when the price is missing', () => {
    setPage('<span id="productTitle">Some Product</span>')
    const product = extractProduct(AMAZON_URL)
    expect(product?.title).toBe('Some Product')
    expect(product?.price).toBeNull()
  })
})

/* --- best buy: h1, and the right price among several --------------------- */

describe('best buy', () => {
  /* Observed live: hashed CSS-module classnames, and several prices on the
   * page belonging to recommended products rather than this one. */
  const BESTBUY_URL = 'https://www.bestbuy.ca/en-ca/product/costway-mini-fridge/19997287'
  /* Copied from the live page: no data-automation, no itemprop, just hashed
   * module classes. The product's own price is the first such node; $643.99
   * belongs to a recommended product further down. */
  const BESTBUY = `
    <h1>Costway 0.6 Cu.Ft Beverage Refrigerator, 24 Cans Countertop Mini Fridge</h1>
    <div><span class="screenReaderOnly__bby4Qm large__bbyg5j">$125.99</span></div>
    <div class="recommendations"><span class="screenReaderOnly__bby4Qm">$643.99</span></div>
  `

  test('extracts the title from h1', () => {
    setPage(BESTBUY)
    expect(extractProduct(BESTBUY_URL)?.title).toBe(
      'Costway 0.6 Cu.Ft Beverage Refrigerator, 24 Cans Countertop Mini Fridge',
    )
  })

  test('takes this product price, not a recommended product further down', () => {
    setPage(BESTBUY)
    expect(extractProduct(BESTBUY_URL)?.price).toBe(125.99)
  })

  test('reads the bare dollar sign on a .ca storefront as CAD', () => {
    setPage(BESTBUY)
    expect(extractProduct(BESTBUY_URL)?.currency).toBe('CAD')
  })
})

/* --- generic retailers that DO publish structured data ------------------- */

describe('generic fallback', () => {
  test('uses a JSON-LD Product block when the site publishes one', () => {
    setPage('')
    document.head.innerHTML = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Anglepoise Desk Lamp",
         "image":["https://shop.example.com/lamp.jpg"],
         "offers":{"@type":"Offer","price":"64.00","priceCurrency":"GBP"}}
      </script>`
    const product = extractProduct('https://shop.example.com/products/desk-lamp')
    expect(product?.title).toBe('Anglepoise Desk Lamp')
    expect(product?.price).toBe(64)
    expect(product?.currency).toBe('GBP')
  })

  test('falls back to og: tags when there is no JSON-LD', () => {
    setPage('')
    document.head.innerHTML = `
      <meta property="og:title" content="Stainless Kettle 1.7L" />
      <meta property="product:price:amount" content="38.50" />
      <meta property="product:price:currency" content="EUR" />`
    const product = extractProduct('https://shop.example.com/products/kettle')
    expect(product?.title).toBe('Stainless Kettle 1.7L')
    expect(product?.price).toBe(38.5)
    expect(product?.currency).toBe('EUR')
  })

  test('ignores malformed JSON-LD rather than throwing', () => {
    setPage('<h1>Fallback Title</h1>')
    document.head.innerHTML = `<script type="application/ld+json">{not valid json</script>`
    expect(() => extractProduct('https://shop.example.com/products/x')).not.toThrow()
  })
})

/* --- knowing when NOT to render ----------------------------------------- */

describe('page gating', () => {
  test('an amazon /dp/ path is a product page', () => {
    expect(looksLikeProductPage('https://www.amazon.com/dp/B0771S9XT8')).toBe(true)
  })

  test('a best buy /product/ path is a product page', () => {
    expect(
      looksLikeProductPage('https://www.bestbuy.ca/en-ca/product/costway-fridge/19997287'),
    ).toBe(true)
  })

  test('a search results page is not a product page', () => {
    setPage('<h1>Results for: mini fridge</h1>')
    expect(looksLikeProductPage('https://www.bestbuy.ca/en-ca/search')).toBe(false)
  })

  test('an amazon search page is not a product page', () => {
    expect(looksLikeProductPage('https://www.amazon.com/s')).toBe(false)
  })

  /* ---   /* --- the shapes that were being rejected ------------------------------- */

  test('a bestbuy.com /site/<slug>/<sku>.p path is a product page', () => {
    /* The US storefront does not use /product/ at all, so every bestbuy.com
     * page was skipped even though the manifest matches the domain. */
    expect(
      looksLikeProductPage(
        'https://www.bestbuy.com/site/sony-wh-ch720n-headphones/6535815.p?skuId=6535815',
      ),
    ).toBe(true)
  })

  test('a bestbuy.com URL carrying only skuId is a product page', () => {
    expect(looksLikeProductPage('https://www.bestbuy.com/site/x.p?skuId=6535815')).toBe(true)
  })

  test('an amazon mobile /gp/aw/d/ path is a product page', () => {
    expect(looksLikeProductPage('https://www.amazon.com/gp/aw/d/B0771S9XT8')).toBe(true)
  })

  test('an amazon.ca bilingual /-/en/dp/ path is a product page', () => {
    expect(looksLikeProductPage('https://www.amazon.ca/-/en/dp/B0CHW317SG')).toBe(true)
  })

  test('an unrecognised amazon URL still counts when the page has a product title', () => {
    /* Retail URL shapes churn. The URL is a fast path, not the authority. */
    setPage('<span id="productTitle">Dell S2421HS Monitor</span>')
    expect(looksLikeProductPage('https://www.amazon.com/some/new/shape')).toBe(true)
  })

  test('an unrecognised best buy URL counts when there is an add-to-cart', () => {
    setPage('<h1>Sony WH-CH720N</h1><button data-testid="add-to-cart-button">Add</button>')
    expect(looksLikeProductPage('https://www.bestbuy.ca/en-ca/whatever')).toBe(true)
  })

  test('a best buy search page has prices but no add-to-cart, so it is not one', () => {
    setPage('<h1>Results</h1><span class="screenReaderOnly">$129.99</span>')
    expect(looksLikeProductPage('https://www.bestbuy.ca/en-ca/search?q=fridge')).toBe(false)
  })

  test('an amazon page with no product title is not one', () => {
    setPage('<h1>Your Orders</h1>')
    expect(looksLikeProductPage('https://www.amazon.com/gp/css/order-history')).toBe(false)
  })

  test('another retailer counts when it declares og:type=product', () => {
  })

  test('returns null when there is no title to be found', () => {
    setPage('<div>nothing here</div>')
    expect(extractProduct('https://example.com/random')).toBeNull()
  })
})
