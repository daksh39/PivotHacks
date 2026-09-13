/* ---------------------------------------------------------------------------
 * Classifying the product.
 *
 * Keyword matching on the marketing title missed 5 of 12 real products, and a
 * miss means no verdict — which with no listings means no card at all. That is
 * most of "it doesn't show up for anything".
 *
 * But the retailer already knows the category and says so on the page. Amazon
 * publishes a breadcrumb ("Home & Kitchen › Kitchen & Dining › Small
 * Appliances › Compact Refrigerators") and Best Buy returns categoryName in
 * its search JSON. Reading what the site tells us beats guessing from a title
 * stuffed with adjectives.
 *
 * NOTE: an Amazon search filtered to used condition was investigated as a
 * listings source and REJECTED — `rh=p_n_condition-type` is silently ignored
 * (25 plain results vs 27 "filtered"), so it would have shown new items as
 * used. Renewed-in-the-title remains the only safe Amazon search signal.
 * ------------------------------------------------------------------------- */

import { describe, expect, test } from 'vitest'
import { classify, fromBreadcrumb } from './categories'

describe('fromBreadcrumb', () => {
  test('reads the real amazon breadcrumb for a mini fridge', () => {
    expect(
      fromBreadcrumb(['Home & Kitchen', 'Kitchen & Dining', 'Small Appliances', 'Compact Refrigerators']),
    ).toBe('mini-fridge')
  })

  test('prefers the most specific crumb, which is the last one', () => {
    /* "Electronics" is useless; "Monitors" is the answer. */
    expect(fromBreadcrumb(['Electronics', 'Computers & Accessories', 'Monitors'])).toBe('monitor')
  })

  test('matches best buy category names too', () => {
    expect(fromBreadcrumb(['Headphones & Speakers'])).toBe('headphones')
  })

  test('returns null when the department means nothing to us', () => {
    expect(fromBreadcrumb(['Grocery & Gourmet Food', 'Snack Foods'])).toBeNull()
    expect(fromBreadcrumb([])).toBeNull()
  })
})

describe('classify falls back sensibly', () => {
  test('still classifies from the title when there is no breadcrumb', () => {
    expect(classify('Cooluli Mini Fridge for Bedroom')).toBe('mini-fridge')
  })

  test('the breadcrumb wins over a misleading title', () => {
    /* "Desk" in the title, but it is a lamp. */
    expect(
      classify('LED Desk Lamp for Home Office Study', ['Home & Kitchen', 'Lamps & Shades']),
    ).not.toBe('desk')
  })

  test('classifies products whose titles defeated the keyword table', () => {
    expect(classify('Logitech MX Master 3S', ['Electronics', 'Mice'])).toBe('mouse')
    expect(classify('Apple AirPods Pro (2nd Generation)', ['Electronics', 'Earbud Headphones'])).toBe(
      'headphones',
    )
  })
})
