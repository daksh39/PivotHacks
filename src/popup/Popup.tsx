/* The closing beat (verte-plan.md §10, step 6): total avoided this term.
 * First on the cut list after multi-retailer (§11) — keep it cheap.
 * Owned by lane/ui. */

import { useEffect, useState } from 'react'
import type { BuyerContext } from '../types'
import { DEADLINE_CHOICES, DEFAULT_CONTEXT, loadContext, saveContext } from '../context'
import { formatCo2, formatUsd, milesDrivenEquivalent } from '../carbon'
import { Leaf } from '../components/Skeleton'

type Impact = { co2Kg: number; usd: number; seen: number }

export function Popup() {
  const [impact, setImpact] = useState<Impact>({ co2Kg: 0, usd: 0, seen: 0 })
  const [context, setContext] = useState<BuyerContext>(DEFAULT_CONTEXT)

  useEffect(() => {
    void chrome.storage.local
      .get('impact')
      .then(({ impact }) => impact && setImpact(impact as Impact))
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
        <div className="verte__price">
          <span className="verte__price-now">{formatUsd(impact.usd)}</span>
          <span className="verte__save">saved</span>
        </div>
        <hr className="verte__rule" />
        <p className="verte__carbon">
          {formatCo2(impact.co2Kg)} of manufacturing avoided{' '}
          <span className="verte__carbon-eq">
            — about {milesDrivenEquivalent(impact.co2Kg)} miles driven
          </span>
        </p>
        <p className="verte__note">
          Across {impact.seen} {impact.seen === 1 ? 'product' : 'products'} this term.
        </p>

        <hr className="verte__rule" />

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

          <label className="verte__ctx-check">
            <input
              type="checkbox"
              checked={context.hasCar}
              onChange={(e) => update({ hasCar: e.target.checked })}
            />
            <span>I can collect bulky things by car</span>
          </label>

          <p className="verte__ctx-help">
            These change which listing Verte recommends, not just what it shows.
          </p>
        </fieldset>
      </div>
    </div>
  )
}
