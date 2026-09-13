/* ---------------------------------------------------------------------------
 * eBay mapping tests.
 *
 * The network call is not under test here — these cover the pure functions
 * that decide WHICH eBay marketplace to ask and how to read a summary back.
 * That is where the correctness bugs live:
 *
 *   - A browser in Canada gets CAD prices off amazon.ca and bestbuy.ca.
 *     Asking EBAY_US returns USD listings, and "$125.99 CAD minus $40 USD"
 *     is not a saving, it is a wrong number rendered confidently.
 *
 *   - daysToHand drives the whole deadline ranking. A hardcoded 7 means the
 *     pivot-03 logic is running on a guess.
 * ------------------------------------------------------------------------- */

import { describe, expect, test } from 'vitest'
import { deliveryDays, marketplaceForCurrency, toUsedOption } from './ebay'

describe('marketplaceForCurrency', () => {
  test('asks eBay Canada for a CAD product', () => {
    expect(marketplaceForCurrency('CAD')).toBe('EBAY_CA')
  })

  test('asks eBay UK for a GBP product', () => {
    expect(marketplaceForCurrency('GBP')).toBe('EBAY_GB')
  })

  test('defaults to the US marketplace', () => {
    expect(marketplaceForCurrency('USD')).toBe('EBAY_US')
    expect(marketplaceForCurrency('ZZZ')).toBe('EBAY_US')
  })
})

describe('deliveryDays', () => {
  const now = new Date('2026-09-13T12:00:00Z')

  test('reads the estimated delivery date eBay returns', () => {
    const days = deliveryDays(
      { shippingOptions: [{ maxEstimatedDeliveryDate: '2026-09-17T12:00:00.000Z' }] },
      now,
    )
    expect(days).toBe(4)
  })

  test('rounds a partial day up, never down', () => {
    /* Promising "2 days" for something arriving late on day 3 is the kind of
     * optimism that makes someone miss a move-in date. */
    const days = deliveryDays(
      { shippingOptions: [{ maxEstimatedDeliveryDate: '2026-09-15T23:00:00.000Z' }] },
      now,
    )
    expect(days).toBe(3)
  })

  test('takes the soonest option when several are offered', () => {
    const days = deliveryDays(
      {
        shippingOptions: [
          { maxEstimatedDeliveryDate: '2026-09-20T12:00:00.000Z' },
          { maxEstimatedDeliveryDate: '2026-09-16T12:00:00.000Z' },
        ],
      },
      now,
    )
    expect(days).toBe(3)
  })

  test('falls back to a conservative week when eBay gives no estimate', () => {
    expect(deliveryDays({}, now)).toBe(7)
    expect(deliveryDays({ shippingOptions: [] }, now)).toBe(7)
  })

  test('ignores an estimate in the past rather than returning a negative', () => {
    expect(
      deliveryDays({ shippingOptions: [{ maxEstimatedDeliveryDate: '2026-09-01T12:00:00Z' }] }, now),
    ).toBe(7)
  })
})

describe('toUsedOption', () => {
  const item = {
    title: 'Midea 3.1 Cu Ft Compact Refrigerator',
    itemWebUrl: 'https://www.ebay.ca/itm/123',
    condition: 'Used',
    price: { value: '58.00', currency: 'CAD' },
    image: { imageUrl: 'https://i.ebayimg.com/x.jpg' },
  }

  test('carries the currency eBay reported', () => {
    expect(toUsedOption(item)?.currency).toBe('CAD')
  })

  test('reads price, title and condition', () => {
    const option = toUsedOption(item)
    expect(option?.price).toBe(58)
    expect(option?.title).toBe('Midea 3.1 Cu Ft Compact Refrigerator')
    expect(option?.condition).toBe('Used')
    expect(option?.source).toBe('ebay')
  })

  test('drops a listing with no usable price', () => {
    expect(toUsedOption({ ...item, price: undefined })).toBeNull()
    expect(toUsedOption({ ...item, price: { value: 'n/a', currency: 'CAD' } })).toBeNull()
  })

  test('drops a listing with no link to follow', () => {
    expect(toUsedOption({ ...item, itemWebUrl: undefined })).toBeNull()
  })
})
