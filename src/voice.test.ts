/* ---------------------------------------------------------------------------
 * Turning what someone said into buying context.
 *
 * This is the whole point of the voice feature: the chips can express four
 * budgets and three deadlines, and speech can express any number and any day.
 * Voice here is strictly MORE expressive than the form it replaces, which is
 * the difference between a feature and a gimmick.
 *
 * The parser is pure — transcript in, context out — so nearly all of the
 * behaviour is testable without a microphone.
 * ------------------------------------------------------------------------- */

import { describe, expect, test } from 'vitest'
import { parseSpoken } from './voice'

/* A Sunday, so "by Friday" is unambiguously five days away. */
const SUNDAY = new Date('2026-09-13T10:00:00')

describe('budget', () => {
  test('hears a spoken number', () => {
    expect(parseSpoken('I can spend about eighty dollars', SUNDAY).context.budgetCap).toBe(80)
  })

  test('hears a transcribed digit', () => {
    expect(parseSpoken('I can spend about 80 dollars', SUNDAY).context.budgetCap).toBe(80)
  })

  test('hears a dollar sign', () => {
    expect(parseSpoken('keep it under $65', SUNDAY).context.budgetCap).toBe(65)
  })

  test('hears informal wording', () => {
    expect(parseSpoken('no more than 40 bucks', SUNDAY).context.budgetCap).toBe(40)
  })

  test('hears compound spoken numbers', () => {
    expect(parseSpoken('up to one hundred and fifty dollars', SUNDAY).context.budgetCap).toBe(150)
  })

  test('understands having no limit', () => {
    const parsed = parseSpoken('money is no object', SUNDAY)
    expect(parsed.context.budgetCap).toBeNull()
    expect(parsed.understood).toContain('budget')
  })

  test('reports nothing when no budget was mentioned', () => {
    const parsed = parseSpoken('I need it by tomorrow', SUNDAY)
    expect(parsed.understood).not.toContain('budget')
    expect(parsed.context.budgetCap).toBeUndefined()
  })
})

describe('deadline', () => {
  test('hears tomorrow', () => {
    expect(parseSpoken('I need it by tomorrow', SUNDAY).context.needInDays).toBe(1)
  })

  test('hears today', () => {
    expect(parseSpoken('I need it today', SUNDAY).context.needInDays).toBe(0)
  })

  test('hears a number of days', () => {
    expect(parseSpoken('I need it in three days', SUNDAY).context.needInDays).toBe(3)
  })

  test('hears a week', () => {
    expect(parseSpoken('sometime within a week', SUNDAY).context.needInDays).toBe(7)
  })

  test('hears a named weekday and counts forward to it', () => {
    /* From a Sunday, Friday is five days away. A weekday name is exactly the
     * kind of thing the chips cannot express at all. */
    expect(parseSpoken('I need it by Friday', SUNDAY).context.needInDays).toBe(5)
  })

  test('treats the current weekday as a week away, not zero', () => {
    /* "by Sunday" said on a Sunday means next Sunday. Zero would be wrong and
     * would silently tell the user nothing can arrive in time. */
    expect(parseSpoken('by Sunday', SUNDAY).context.needInDays).toBe(7)
  })

  test('understands having no deadline', () => {
    const parsed = parseSpoken('no rush at all', SUNDAY)
    expect(parsed.context.needInDays).toBeNull()
    expect(parsed.understood).toContain('deadline')
  })

  test('reports nothing when no deadline was mentioned', () => {
    const parsed = parseSpoken('under fifty dollars', SUNDAY)
    expect(parsed.understood).not.toContain('deadline')
    expect(parsed.context.needInDays).toBeUndefined()
  })
})

describe('both at once', () => {
  test('hears a deadline and a budget in one sentence', () => {
    const parsed = parseSpoken(
      'I need it by Friday and I can spend about eighty dollars',
      SUNDAY,
    )
    expect(parsed.context).toEqual({ needInDays: 5, budgetCap: 80 })
    expect(parsed.understood.sort()).toEqual(['budget', 'deadline'])
  })

  test('does not mistake the deadline number for the budget', () => {
    /* "in three days ... fifty dollars" has two numbers and they must not
     * cross over. */
    const parsed = parseSpoken('in three days, under fifty dollars', SUNDAY)
    expect(parsed.context.needInDays).toBe(3)
    expect(parsed.context.budgetCap).toBe(50)
  })
})

describe('when nothing is understood', () => {
  test('reports understanding nothing rather than guessing', () => {
    const parsed = parseSpoken('what is the weather like', SUNDAY)
    expect(parsed.understood).toEqual([])
    expect(parsed.context).toEqual({})
  })

  test('handles an empty transcript', () => {
    expect(parseSpoken('', SUNDAY).understood).toEqual([])
  })
})
