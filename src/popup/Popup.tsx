/* The closing beat (verte-plan.md §10, step 6): total avoided this term.
 * First on the cut list after multi-retailer (§11) — keep it cheap.
 * Owned by lane/ui. */

import { useEffect, useState } from 'react'
import { formatCo2, formatUsd, milesDrivenEquivalent } from '../carbon'
import { Leaf } from '../components/Skeleton'

type Impact = { co2Kg: number; usd: number; seen: number }

export function Popup() {
  const [impact, setImpact] = useState<Impact>({ co2Kg: 0, usd: 0, seen: 0 })

  useEffect(() => {
    void chrome.storage.local
      .get('impact')
      .then(({ impact }) => impact && setImpact(impact as Impact))
  }, [])

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
      </div>
    </div>
  )
}
