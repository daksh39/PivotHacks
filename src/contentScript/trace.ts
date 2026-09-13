/* ---------------------------------------------------------------------------
 * Diagnostics.
 *
 * A content script runs in an isolated world, so nothing outside it can see
 * its variables — which meant "the card didn't appear" was indistinguishable
 * from "the script never ran", "the product never rendered", "nothing was
 * found", and "it mounted somewhere invisible". Every one of those has a
 * different fix and we were guessing between them.
 *
 * So the script publishes its progress onto <html data-verte="...">, which is
 * shared with the page and readable from devtools:
 *
 *     document.documentElement.dataset.verte
 *
 * Also mirrored to console.debug under the [verte] prefix.
 * ------------------------------------------------------------------------- */

export type Stage =
  | 'injected'
  | 'not-a-product-page'
  | 'waiting-for-product'
  | 'no-product-found'
  | 'dismissed'
  | 'reading-listings'
  | 'nothing-to-show'
  | 'mounted'
  | 'failed'

type State = {
  stage: Stage
  url: string
  title?: string
  category?: string | null
  listings?: number
  reason?: string
  error?: string
  at: string
}

let current: State | null = null

export function trace(stage: Stage, detail: Partial<Omit<State, 'stage' | 'at'>> = {}): void {
  current = {
    ...(current ?? {}),
    ...detail,
    stage,
    url: detail.url ?? current?.url ?? location.pathname,
    at: new Date().toISOString().slice(11, 23),
  }

  try {
    document.documentElement.dataset.verte = JSON.stringify(current)
  } catch {
    /* Some pages freeze the root element. The console line still lands. */
  }

  // eslint-disable-next-line no-console
  console.debug('[verte]', stage, current)
}

/** Read back what the last run did. Exposed for tests. */
export function lastTrace(): State | null {
  return current
}
