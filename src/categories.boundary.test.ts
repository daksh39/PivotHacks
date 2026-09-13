/* ---------------------------------------------------------------------------
 * Whole-word matching.
 *
 * classify() used a plain substring `includes`, which reads "environment" as an
 * iron, "drug" as a rug, "open" as a pen and "ceramic" as RAM. That is why the
 * short obvious keywords — "tv", "mouse", "plate", "pen" — could not be added:
 * each would have misfired somewhere. These are the cases that forced the
 * change, kept so nobody quietly reverts to includes().
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest'
import { classify } from './categories'

describe('keywords match whole words, not substrings', () => {
  const cases: [string, string | null][] = [
    ['Environmentally Friendly Bamboo Cutlery Set', 'cutlery'],
    ['Drugstore Beauty Organizer Tray', null],
    ['Open Ear Bone Conduction Headphones', 'headphones'],
    ['Ceramic Non-Stick Frying Pan 10 inch', 'non-stick-pan'],
    ['Artisanal Sourdough Starter Culture', null],
  ]
  for (const [title, want] of cases) {
    it(`${title.slice(0, 40)} -> ${want ?? 'no category'}`, () => {
      expect(classify(title)).toBe(want)
    })
  }
})

describe('a regular plural is still the same word', () => {
  /* The boundary broke every plural title the first time it was added:
   * "Dumbbells" stopped being a dumbbell. */
  const plurals: [string, string][] = [
    ['Adjustable Dumbbells 55 lb Pair', 'weights'],
    ['Dinner Plates Set of 6', 'tableware'],
    ['Gel Pens Fine Point 12 Pack', 'pen'],
    ['Bath Towels Cotton 4 Pack', 'towels'],
  ]
  for (const [title, want] of plurals) {
    it(`${title} -> ${want}`, () => expect(classify(title)).toBe(want))
  }
})

describe('order inside the rules is load-bearing', () => {
  it('paper towels are a consumable, not a towel', () => {
    expect(classify('Bounty Paper Towels 12 Rolls')).toBe('paper-towel')
  })

  it('a console table is furniture, not a games console', () => {
    expect(classify('Console Table Entryway Narrow')).toBe('bedside-table')
  })

  it('cast iron is cookware, not a clothes iron', () => {
    expect(classify('Lodge Cast Iron Skillet 12 Inch')).toBe('cookware')
  })
})
