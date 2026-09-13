/* ---------------------------------------------------------------------------
 * The buyer's situation, persisted.  Pivot 03.
 *
 * Two questions, asked once, stored locally. The popup writes them, the
 * content script reads them, the proxy ranks with them.
 *
 * Defaults are deliberately the pessimistic case — no deadline, no car —
 * because that is the median first-year and because an optimistic default
 * would quietly recommend a pickup they cannot actually make.
 * ------------------------------------------------------------------------- */

import type { BuyerContext } from './types'

export const DEFAULT_CONTEXT: BuyerContext = {
  needInDays: null,
  hasCar: false,
  budgetCap: null,
}

const KEY = 'verte:context'

export async function loadContext(): Promise<BuyerContext> {
  try {
    const stored = await chrome.storage.local.get(KEY)
    return { ...DEFAULT_CONTEXT, ...(stored[KEY] as Partial<BuyerContext> | undefined) }
  } catch {
    /* No extension APIs — the dev preview page. Defaults are fine. */
    return DEFAULT_CONTEXT
  }
}

export async function saveContext(context: BuyerContext): Promise<void> {
  try {
    await chrome.storage.local.set({ [KEY]: context })
  } catch {
    /* Preview page. Nothing to persist to. */
  }
}

/** The choices the popup offers. Kept here so popup and card cannot drift. */
export const DEADLINE_CHOICES: { label: string; value: number | null }[] = [
  { label: 'No rush', value: null },
  { label: 'Within 3 days', value: 3 },
  { label: 'By tomorrow', value: 1 },
]

/** Round numbers a student actually thinks in, plus "no limit". */
export const BUDGET_CHOICES: { label: string; value: number | null }[] = [
  { label: 'No limit', value: null },
  { label: 'Under 50', value: 50 },
  { label: 'Under 100', value: 100 },
  { label: 'Under 200', value: 200 },
]

export function deadlineLabel(needInDays: number | null): string {
  return DEADLINE_CHOICES.find((c) => c.value === needInDays)?.label ?? `In ${needInDays} days`
}
