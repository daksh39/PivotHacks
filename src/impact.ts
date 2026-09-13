/* ---------------------------------------------------------------------------
 * The running tally the popup shows.
 *
 * Kept per-browser in chrome.storage. It used to be recorded by the service
 * worker after a proxy round trip, so it only ever counted products seen while
 * a localhost server happened to be running.
 * ------------------------------------------------------------------------- */

import type { VerteResult } from './types'

export type Impact = { co2Kg: number; usd: number; seen: number }

export const EMPTY_IMPACT: Impact = { co2Kg: 0, usd: 0, seen: 0 }

const KEY = 'impact'

/** Only counts products where we had something real to add up. */
export function addToImpact(current: Impact, result: VerteResult): Impact {
  if (!result.co2AvoidedKg && !result.savingsUsd) return current
  return {
    co2Kg: current.co2Kg + (result.co2AvoidedKg ?? 0),
    usd: current.usd + (result.savingsUsd ?? 0),
    seen: current.seen + 1,
  }
}

export async function recordImpact(result: VerteResult): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(KEY)
    const current = (stored[KEY] as Impact | undefined) ?? EMPTY_IMPACT
    const next = addToImpact(current, result)
    if (next !== current) await chrome.storage.local.set({ [KEY]: next })
  } catch {
    /* No extension APIs (the dev preview page). Nothing to record. */
  }
}

export async function loadImpact(): Promise<Impact> {
  try {
    const stored = await chrome.storage.local.get(KEY)
    return (stored[KEY] as Impact | undefined) ?? EMPTY_IMPACT
  } catch {
    return EMPTY_IMPACT
  }
}
