/* The closing beat (verte-plan.md §10, step 6): total avoided this term.
 * First on the cut list after multi-retailer (§11) — keep it cheap.
 * Owned by lane/ui. */

import { useCallback, useEffect, useState } from 'react'
import type { BuyerContext } from '../types'
import type { StatusRequest, VerteStatus } from '../status'
import { describeStatus } from '../status'
import {
  BUDGET_CHOICES,
  DEADLINE_CHOICES,
  DEFAULT_CONTEXT,
  loadContext,
  saveContext,
} from '../context'
import { formatCo2, formatUsd, milesDrivenEquivalent } from '../carbon'
import { Leaf } from '../components/Skeleton'

type Impact = { co2Kg: number; usd: number; seen: number }

/**
 * Ask the tab in front of them what Verte is doing there.
 *
 * A tab with no content script — Walmart, a settings page, a new tab — throws
 * rather than replying, and that silence is itself the answer: we do not run
 * there. Reporting that plainly is the whole point of this; "nothing happened"
 * was the bug.
 */
async function askActiveTab(message: StatusRequest): Promise<VerteStatus> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return { state: 'unsupported-site' }
    const reply = (await chrome.tabs.sendMessage(tab.id, message)) as VerteStatus | undefined
    return reply ?? { state: 'unsupported-site' }
  } catch {
    return { state: 'unsupported-site' }
  }
}

export function Popup() {
  const [impact, setImpact] = useState<Impact>({ co2Kg: 0, usd: 0, seen: 0 })
  const [context, setContext] = useState<BuyerContext>(DEFAULT_CONTEXT)
  const [status, setStatus] = useState<VerteStatus | null>(null)

  const refresh = useCallback(() => {
    void askActiveTab({ type: 'VERTE_STATUS' }).then(setStatus)
  }, [])

  useEffect(refresh, [refresh])

  useEffect(() => {
    try {
      void chrome.storage.local
        .get('impact')
        .then(({ impact }) => impact && setImpact(impact as Impact))
    } catch {
      /* No extension APIs — previewing in a plain tab. Zeroes are fine. */
    }
    void loadContext().then(setContext)
  }, [])

  /* Writing here is what changes the recommendation on the next page load —
   * these two answers are inputs to proxy/rank.ts, not display preferences. */
  function update(patch: Partial<BuyerContext>) {
    const next = { ...context, ...patch }
    setContext(next)
    void saveContext(next)
  }

  return (
    <div className="verte">
      <header className="verte__header">
        <Leaf />
        <span className="verte__wordmark">Verte</span>
      </header>
      <div className="verte__body">
        {/* Context leads. It is the thing that changes what Verte does, and on
          * a fresh install the impact tally is all zeroes — opening on "$0
          * saved, across 0 products" is a poor first impression and buries
          * the only control the popup has. */}
        <fieldset className="verte__ctx">
          <legend className="verte__ctx-legend">When do you need things?</legend>
          <div className="verte__ctx-row" role="radiogroup" aria-label="When do you need things?">
            {DEADLINE_CHOICES.map((choice) => (
              <button
                key={String(choice.value)}
                type="button"
                role="radio"
                aria-checked={context.needInDays === choice.value}
                className="verte__chip"
                onClick={() => update({ needInDays: choice.value })}
              >
                {choice.label}
              </button>
            ))}
          </div>

          <div className="verte__ctx-legend verte__ctx-legend--spaced">What can you spend?</div>
          <div className="verte__ctx-row" role="radiogroup" aria-label="What can you spend?">
            {BUDGET_CHOICES.map((choice) => (
              <button
                key={String(choice.value)}
                type="button"
                role="radio"
                aria-checked={context.budgetCap === choice.value}
                className="verte__chip"
                onClick={() => update({ budgetCap: choice.value })}
              >
                {choice.label}
              </button>
            ))}
          </div>


          <p className="verte__ctx-help">
            These change which listing Verte recommends, not just what it shows.
          </p>
          {/* There is no "can you collect it by car" control here on purpose.
            * The ranking rule for it exists and is correct, but no source
            * reports local pickup yet — so the control could not change
            * anything, and a switch that provably does nothing is worse than
            * no switch. It comes back with real pickup data. */}
        </fieldset>

        {/* What is happening on the page in front of them, right now. The card
          * lives on the page, not in here — so when there is no card, this is
          * the only surface that can explain why. */}
        <hr className="verte__rule" />
        <Status status={status} onReshow={() => void askActiveTab({ type: 'VERTE_RESHOW' }).then(setStatus)} />

        {impact.seen > 0 ? (
          <>
            <hr className="verte__rule" />
            <div className="verte__price">
              <span className="verte__price-now">{formatUsd(impact.usd)}</span>
              <span className="verte__save">saved</span>
            </div>
            <p className="verte__carbon">
              {formatCo2(impact.co2Kg)} of manufacturing avoided{' '}
              <span className="verte__carbon-eq">
                — about {milesDrivenEquivalent(impact.co2Kg)} miles driven
              </span>
            </p>
            <p className="verte__note">
              Across {impact.seen} {impact.seen === 1 ? 'product' : 'products'} this term.
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}

function Status({ status, onReshow }: { status: VerteStatus | null; onReshow: () => void }) {
  if (!status) return <p className="verte__note">Checking this page…</p>

  const { head, sub } = describeStatus(status)

  /* The good case leads with the money, the same way the card does — the
   * popup should not restate a win in flat prose. */
  if (status.state === 'showing') {
    return (
      <>
        {status.savings != null && (
          <div className="verte__price">
            <span className="verte__price-now">{formatUsd(status.savings, status.currency)}</span>
            <span className="verte__save">to save here</span>
          </div>
        )}
        <p className="verte__note">
          {status.count} secondhand {status.count === 1 ? 'listing' : 'listings'} on this page —
          the card sits next to the buy button.
        </p>
      </>
    )
  }

  return (
    <>
      <p className="verte__blocked-head">{head}</p>
      {sub && <p className="verte__blocked-sub">{sub}</p>}
      {status.state === 'dismissed' && (
        <button type="button" className="verte__chip" onClick={onReshow}>
          Show it again
        </button>
      )}
    </>
  )
}
