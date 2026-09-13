/* ---------------------------------------------------------------------------
 * What someone said, turned into buying context.
 *
 * The chips on the card can express four budgets and three deadlines. Speech
 * can express any amount and any day — "sixty-five dollars", "by Thursday",
 * "end of the week". That is the reason voice is here: it is strictly more
 * expressive than the control it replaces, not a slower way to click it.
 *
 * Deterministic and pure: transcript in, context out. No model call, no key,
 * no network — the same constraint the rest of the extension runs under, and
 * it means the demo works on conference wifi.
 * ------------------------------------------------------------------------- */

import type { BuyerContext } from './types'

export type ParsedVoice = {
  /** Only the fields actually heard. Absent means "not mentioned". */
  context: Partial<BuyerContext>
  /** What we understood, so the card can say what it missed. */
  understood: ('deadline' | 'budget')[]
}

/* --- numbers ------------------------------------------------------------- */

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
}

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
}

/**
 * Reads a number written either as digits or as words.
 *
 * Speech recognition is inconsistent about which it produces — "80 dollars"
 * and "eighty dollars" both occur for the same utterance — so both have to
 * work. Handles compounds such as "one hundred and fifty".
 */
export function readNumber(text: string): number | null {
  const digits = text.match(/\d+/)
  if (digits) return Number.parseInt(digits[0], 10)

  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  let total = 0
  let current = 0
  let seen = false

  for (const word of words) {
    if (word in ONES) {
      current += ONES[word]
      seen = true
    } else if (word in TENS) {
      current += TENS[word]
      seen = true
    } else if (word === 'hundred') {
      current = (current || 1) * 100
      seen = true
    } else if (word === 'thousand') {
      total += (current || 1) * 1000
      current = 0
      seen = true
    } else if (word !== 'and') {
      /* A non-number word ends the run. "three days" must not absorb what
       * follows it. */
      if (seen) break
    }
  }

  return seen ? total + current : null
}

/* --- budget -------------------------------------------------------------- */

const NO_BUDGET = /\b(no (limit|budget|max)|money is no object|any (budget|price)|doesn'?t matter)\b/i

/** Money words, so a number is only read as a budget when money is meant. */
const BUDGET_PHRASE =
  /(?:\$\s*)?((?:[a-z]+[\s-]+){0,4}\d+|\$\s*\d+|(?:[a-z]+[\s-]+){0,4}[a-z]+)\s*(?:dollars?|bucks|quid|euros?)|(?:under|below|less than|at most|no more than|up to|max(?:imum)?|around|about|spend)\s+\$?\s*([\w\s-]{1,24}?)(?=\s*(?:dollars?|bucks|$|,|\.|and\b))/i

function readBudget(text: string): { value: number | null } | null {
  if (NO_BUDGET.test(text)) return { value: null }

  /* A currency symbol or a money word is required. Without one, "three days"
   * would be read as a three dollar budget. */
  const withMoneyWord = text.match(
    /(\$\s*[\d,]+(?:\.\d+)?)|((?:[\w-]+\s+){0,3}[\w-]+)\s*(?:dollars?|bucks)\b/i,
  )
  if (withMoneyWord) {
    const amount = readNumber(withMoneyWord[1] ?? withMoneyWord[2] ?? '')
    if (amount !== null) return { value: amount }
  }

  return null
}

/* --- deadline ------------------------------------------------------------ */

const NO_DEADLINE = /\b(no rush|whenever|no hurry|not urgent|any ?time|in no hurry)\b/i

const WEEKDAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
]

function readDeadline(text: string, now: Date): { value: number | null } | null {
  if (NO_DEADLINE.test(text)) return { value: null }
  if (/\btoday\b|\bright now\b/i.test(text)) return { value: 0 }
  if (/\btomorrow\b/i.test(text)) return { value: 1 }

  /* "in a week", "within two weeks" */
  const weeks = text.match(/(?:in|within|inside)\s+((?:a|an|one|two|three|\d+))\s+weeks?\b/i)
  if (weeks) {
    const count = /a|an/i.test(weeks[1]) ? 1 : (readNumber(weeks[1]) ?? 1)
    return { value: count * 7 }
  }

  /* "in three days", "within 2 days" */
  const days = text.match(/(?:in|within|inside)\s+([\w-]+)\s+days?\b/i)
  if (days) {
    const count = readNumber(days[1])
    if (count !== null) return { value: count }
  }

  /* "by Friday" — the kind of thing the chips cannot express at all. */
  const weekday = text.toLowerCase().match(
    /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  )
  if (weekday) {
    const target = WEEKDAYS.indexOf(weekday[1])
    const diff = (target - now.getDay() + 7) % 7
    /* Naming today's own weekday means next week, not zero. Zero would tell
     * the user nothing can possibly arrive in time. */
    return { value: diff === 0 ? 7 : diff }
  }

  return null
}

/* --- public -------------------------------------------------------------- */

/**
 * Never guesses. A field is set only when it was actually heard, so the card
 * can report honestly what it caught and what it missed.
 */
export function parseSpoken(transcript: string, now: Date = new Date()): ParsedVoice {
  const text = (transcript ?? '').trim()
  if (!text) return { context: {}, understood: [] }

  const context: Partial<BuyerContext> = {}
  const understood: ('deadline' | 'budget')[] = []

  const deadline = readDeadline(text, now)
  if (deadline) {
    context.needInDays = deadline.value
    understood.push('deadline')
  }

  const budget = readBudget(text)
  if (budget) {
    context.budgetCap = budget.value
    understood.push('budget')
  }

  return { context, understood }
}
