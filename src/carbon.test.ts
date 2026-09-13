/* ---------------------------------------------------------------------------
 * Carbon figures and the rule that governs them.
 *
 * CLAUDE.md §09: "we display a figure only with a citation behind it." That was
 * a convention nobody enforced, and every co2Source in the repo still reads
 * PLACEHOLDER. These tests make the rule executable: no citation, no claim.
 * ------------------------------------------------------------------------- */

import { describe, expect, test } from 'vitest'
import {
  KG_CO2_PER_MILE_DRIVEN,
  formatCo2,
  isSourced,
  milesDrivenEquivalent,
} from './carbon'

describe('isSourced', () => {
  test('a placeholder is not a citation', () => {
    expect(isSourced('PLACEHOLDER — lane/demo to source')).toBe(false)
    expect(isSourced('PLACEHOLDER')).toBe(false)
    expect(isSourced('TODO: find a source')).toBe(false)
  })

  test('empty or missing is not a citation', () => {
    expect(isSourced('')).toBe(false)
    expect(isSourced(undefined)).toBe(false)
  })

  test('a real reference counts', () => {
    expect(isSourced('US EPA, Greenhouse Gas Emissions from a Typical Passenger Vehicle')).toBe(
      true,
    )
  })
})

describe('miles driven equivalence', () => {
  test('uses the EPA figure for an average passenger vehicle', () => {
    /* EPA: about 400 g CO2 per mile. The previous value of 0.256 understated
     * it by roughly a third, which inflated every "miles driven" number we
     * put on screen. */
    expect(KG_CO2_PER_MILE_DRIVEN).toBeCloseTo(0.4, 3)
  })

  test('converts kilograms to whole miles, rounded to the nearest ten', () => {
    expect(milesDrivenEquivalent(46)).toBe(120)
    expect(milesDrivenEquivalent(4)).toBe(10)
  })
})

describe('formatCo2', () => {
  test('keeps the tilde, because these are estimates', () => {
    expect(formatCo2(46)).toBe('~46 kg CO₂e')
  })

  test('never implies precision we do not have', () => {
    expect(formatCo2(46.237)).toBe('~46 kg CO₂e')
  })
})
