/* ---------------------------------------------------------------------------
 * Listing sources, both real, neither needing a credential.
 *
 * Verified against the live sites before these tests were written:
 *
 *   Amazon  — the used buybox is in the page DOM. On a real textbook:
 *             new CAD243.63, #usedAccordionRow "Used - Very Good" CAD69.26,
 *             #aod-ingress-link "New & Used (27) from CAD68.63".
 *
 *   Best Buy — /api/v2/json/search returns 200 application/json. For
 *             "Sony WH-CH720N": 101 results, 11 of them Open Box, with real
 *             prices ($180 reg $225, $174 reg $217.50), sku and productUrl.
 *
 * Both are reachable same-origin from the content script, which is why no
 * proxy and no API key is involved.
 * ------------------------------------------------------------------------- */

import { beforeEach, describe, expect, test } from 'vitest'
import {
  amazonRenewed,
  bestBuyOpenBox,
  modelTokens,
  sameProduct,
  usedFromAmazonPage,
} from './listings'

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})

/* --- amazon: the used buybox -------------------------------------------- */

describe('usedFromAmazonPage', () => {
  /* Shape copied off the live page. The row carries a condition label and a
   * price; Amazon injects a lot of inline CSS into it, which must not end up
   * in the condition string. */
  const USED_ROW = `
    <div id="usedAccordionRow">
      <span class="a-text-bold">Used - Very Good</span>
      <style>.savingPriceOverride { color:#CC0C39!important; }</style>
      <span class="a-price"><span class="a-offscreen">CAD69.26</span></span>
    </div>
    <a id="aod-ingress-link">New &amp; Used (27) from CAD68.63CAD68.63 + CAD 11.66 shipping</a>
  `

  test('reads the used offer off the page', () => {
    document.body.innerHTML = USED_ROW
    const [offer] = usedFromAmazonPage('https://www.amazon.com/dp/1285740629')
    expect(offer.price).toBe(69.26)
    expect(offer.currency).toBe('CAD')
    expect(offer.condition).toBe('Used - Very Good')
    expect(offer.source).toBe('amazon')
  })

  test('does not let amazon inline CSS leak into the condition', () => {
    document.body.innerHTML = USED_ROW
    const [offer] = usedFromAmazonPage('https://www.amazon.com/dp/1285740629')
    expect(offer.condition).not.toMatch(/savingPriceOverride|color:/)
  })

  test('links to the offer listing so the buyer can actually get there', () => {
    document.body.innerHTML = USED_ROW
    const [offer] = usedFromAmazonPage('https://www.amazon.com/dp/1285740629')
    expect(offer.url).toContain('1285740629')
  })

  test('returns nothing when the product has no used offer', () => {
    document.body.innerHTML = '<span id="productTitle">Brand New Thing</span>'
    expect(usedFromAmazonPage('https://www.amazon.com/dp/B0771S9XT8')).toEqual([])
  })

  test('ignores a used row that carries no price', () => {
    document.body.innerHTML = `<div id="usedAccordionRow"><span>Used</span></div>`
    expect(usedFromAmazonPage('https://www.amazon.com/dp/X')).toEqual([])
  })
})

/* --- matching the RIGHT product ------------------------------------------ */

describe('modelTokens', () => {
  /* Caught live: splitting the title on "-" to shorten the query cut
   * "Sony WH-CH720N ..." down to "Sony WH", which matched every Sony
   * headphone. The search returned WH-1000XM5 listings for a WH-CH720N page. */
  test('keeps a hyphenated model number intact', () => {
    expect(modelTokens('Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - Black'))
      .toContain('wh-ch720n')
  })

  test('finds a model number with no hyphen', () => {
    expect(modelTokens('Dell 24 Monitor - S2421HS, 1920 x 1080, IPS')).toContain('s2421hs')
  })

  test('treats a purely numeric model number as a model number', () => {
    /* Caught live: "Dell Latitude 7420" has no letters-and-digits token, so it
     * fell through to word overlap and matched a Latitude 7430 — a different
     * machine at a different price. */
    expect(modelTokens('Dell Latitude 7420 Laptop')).toContain('7420')
  })

  test('prefers an alphanumeric model over incidental numbers', () => {
    /* 1920 and 1080 are a resolution, not a model. */
    const tokens = modelTokens('Dell 24 Monitor - S2421HS, 1920 x 1080, IPS')
    expect(tokens[0]).toBe('s2421hs')
  })

  test('ignores plain words and short numbers', () => {
    const tokens = modelTokens('Sony WH-CH720N Over-Ear Headphones - Black')
    expect(tokens).not.toContain('headphones')
    expect(tokens).not.toContain('black')
  })

  test('rejects a neighbouring model number', () => {
    expect(sameProduct('Dell Latitude 7420 Laptop', 'Dell Latitude 7430 Laptop (Renewed)')).toBe(
      false,
    )
    expect(sameProduct('Dell Latitude 7420 Laptop', 'Dell Latitude 7420 Laptop (Renewed)')).toBe(
      true,
    )
  })
})

describe('sameProduct', () => {
  const page = 'Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - Black'

  test('accepts the open-box listing for the same model', () => {
    expect(
      sameProduct(page, 'Open Box - Sony WH-CH720N Over-Ear Noise Cancelling Headphones - White'),
    ).toBe(true)
  })

  test('rejects a different model from the same brand', () => {
    expect(sameProduct(page, 'Open Box - Sony WH-1000XM5 Wireless Noise Cancelling')).toBe(false)
  })

  test('falls back to word overlap when there is no model number', () => {
    expect(sameProduct('Simple Houseware Drying Rack', 'Open Box - Simple Houseware Drying Rack')).toBe(
      true,
    )
    expect(sameProduct('Simple Houseware Drying Rack', 'Open Box - Dyson Air Purifier')).toBe(false)
  })
})

/* --- best buy: open-box variants from the search JSON -------------------- */

describe('bestBuyOpenBox', () => {
  /* Field names copied from the live response. */
  const RESPONSE = {
    total: 101,
    products: [
      {
        sku: '16703135',
        name: 'Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - Black',
        salePrice: 249.99,
        regularPrice: 249.99,
        productUrl: '/en-ca/product/sony-wh-ch720n-black/16703135',
        thumbnailImage: 'https://multimedia.bbycastatic.ca/a.jpg',
      },
      {
        sku: '17718782',
        name: 'Open Box - Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - White',
        salePrice: 180,
        regularPrice: 225,
        productUrl: '/en-ca/product/open-box-sony-wh-ch720n-white/17718782',
        thumbnailImage: 'https://multimedia.bbycastatic.ca/b.jpg',
      },
      {
        sku: '19512746',
        name: 'Open Box - Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - Blue',
        salePrice: 174,
        regularPrice: 217.5,
        productUrl: '/en-ca/product/open-box-sony-wh-ch720n-blue/19512746',
        thumbnailImage: null,
      },
    ],
  }

  const fakeFetch = (body: unknown, ok = true) =>
    (async () =>
      ({
        ok,
        status: ok ? 200 : 500,
        json: async () => body,
      }) as unknown as Response) as unknown as typeof fetch

  test('never returns a different model than the page is showing', async () => {
    const offers = await bestBuyOpenBox(
      'Sony WH-CH720N Over-Ear Noise Cancelling Bluetooth Headphones - Black',
      'https://www.bestbuy.ca/en-ca/product/x/1',
      {
        fetchImpl: fakeFetch({
          products: [
            {
              sku: '1',
              name: 'Open Box - Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
              salePrice: 199.99,
              productUrl: '/en-ca/product/a/1',
            },
            {
              sku: '2',
              name: 'Open Box - Sony WH-CH720N Over-Ear Noise Cancelling Headphones - White',
              salePrice: 180,
              productUrl: '/en-ca/product/b/2',
            },
          ],
        }),
      },
    )
    expect(offers).toHaveLength(1)
    expect(offers[0].price).toBe(180)
  })

  test('keeps only the open-box listings, never the new one', async () => {
    const offers = await bestBuyOpenBox('Sony WH-CH720N', 'https://www.bestbuy.ca/en-ca/product/x/1', {
      fetchImpl: fakeFetch(RESPONSE),
    })
    expect(offers).toHaveLength(2)
    expect(offers.every((o) => /open box/i.test(o.title))).toBe(true)
  })

  test('uses the sale price, which is what the buyer actually pays', async () => {
    const offers = await bestBuyOpenBox('Sony WH-CH720N', 'https://www.bestbuy.ca/en-ca/product/x/1', {
      fetchImpl: fakeFetch(RESPONSE),
    })
    expect(offers.map((o) => o.price)).toEqual([180, 174])
  })

  test('marks the source so the card can say where it came from', async () => {
    const offers = await bestBuyOpenBox('Sony WH-CH720N', 'https://www.bestbuy.ca/en-ca/product/x/1', {
      fetchImpl: fakeFetch(RESPONSE),
    })
    expect(offers[0].source).toBe('bestbuy')
  })

  test('prices a .ca storefront in Canadian dollars', async () => {
    const offers = await bestBuyOpenBox('Sony WH-CH720N', 'https://www.bestbuy.ca/en-ca/product/x/1', {
      fetchImpl: fakeFetch(RESPONSE),
    })
    expect(offers[0].currency).toBe('CAD')
  })

  test('turns the relative productUrl into a followable link', async () => {
    const offers = await bestBuyOpenBox('Sony WH-CH720N', 'https://www.bestbuy.ca/en-ca/product/x/1', {
      fetchImpl: fakeFetch(RESPONSE),
    })
    expect(offers[0].url).toBe(
      'https://www.bestbuy.ca/en-ca/product/open-box-sony-wh-ch720n-white/17718782',
    )
  })

  test('returns nothing when no open-box variant exists', async () => {
    const offers = await bestBuyOpenBox('Something Else', 'https://www.bestbuy.ca/en-ca/product/x/1', {
      fetchImpl: fakeFetch({ total: 1, products: [RESPONSE.products[0]] }),
    })
    expect(offers).toEqual([])
  })

  test('never throws when the endpoint fails — the card just shows no listings', async () => {
    const offers = await bestBuyOpenBox('Sony', 'https://www.bestbuy.ca/en-ca/product/x/1', {
      fetchImpl: fakeFetch({}, false),
    })
    expect(offers).toEqual([])
  })
})

/* --- amazon renewed: the coverage fix ------------------------------------ */

describe('amazonRenewed', () => {
  /* Measured across 8 real product pages, only ONE had a used buybox — it is
   * mostly a books-and-media feature. Amazon Renewed is where the refurbished
   * electronics live, and a same-origin search reaches it with no credential.
   * "renewed airpods" returned 11 real listings when this was written. */
  const page = (cards: { title: string; price: string; asin?: string }[]) => `
    <div>
      ${cards
        .map(
          (c, i) => `
        <div data-asin="${c.asin ?? `B00000000${i}`}">
          <h2>${c.title}</h2>
          <span class="a-price"><span class="a-offscreen">${c.price}</span></span>
        </div>`,
        )
        .join('')}
    </div>`

  const fakeFetch = (html: string, ok = true) =>
    (async () => ({ ok, status: ok ? 200 : 500, text: async () => html }) as unknown as Response) as
      unknown as typeof fetch

  test('keeps only renewed or refurbished listings', async () => {
    const html = page([
      { title: 'Sony WH-CH720N Wireless Headphones - Black', price: 'CAD249.99' },
      { title: 'Sony WH-CH720N Wireless Headphones (Renewed)', price: 'CAD149.00' },
    ])
    const offers = await amazonRenewed(
      'Sony WH-CH720N Wireless Headphones - Black',
      'https://www.amazon.com/dp/B0000',
      { fetchImpl: fakeFetch(html) },
    )
    expect(offers).toHaveLength(1)
    expect(offers[0].price).toBe(149)
    expect(offers[0].source).toBe('amazon')
  })

  test('will not return a different model', async () => {
    const html = page([
      { title: 'Sony WH-1000XM5 Headphones (Renewed)', price: 'CAD299.00' },
      { title: 'Sony WH-CH720N Headphones (Renewed)', price: 'CAD149.00' },
    ])
    const offers = await amazonRenewed('Sony WH-CH720N Headphones - Black', 'https://www.amazon.com/dp/B0', {
      fetchImpl: fakeFetch(html),
    })
    expect(offers).toHaveLength(1)
    expect(offers[0].price).toBe(149)
  })

  test('reads the currency amazon served', async () => {
    const html = page([{ title: 'Dell S2421HS Monitor (Renewed)', price: 'CAD180.00' }])
    const offers = await amazonRenewed('Dell S2421HS Monitor', 'https://www.amazon.com/dp/B0', {
      fetchImpl: fakeFetch(html),
    })
    expect(offers[0].currency).toBe('CAD')
  })

  test('returns nothing rather than throwing when search fails', async () => {
    const offers = await amazonRenewed('anything', 'https://www.amazon.com/dp/B0', {
      fetchImpl: fakeFetch('', false),
    })
    expect(offers).toEqual([])
  })
})
