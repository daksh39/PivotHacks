/* ---------------------------------------------------------------------------
 * The card.  verte-plan.md §06.
 *
 * THE ORDER IS THE ARGUMENT — do not reshuffle these blocks:
 *   1. Money     — what makes them look. Largest element on the card.
 *   2. Verdict   — the trust-builder. Why they keep it installed.
 *   3. Carbon    — present, framed as avoided manufacturing, never preachy.
 *   4. Listings  — two routes: ship it, or walk to it.
 *
 * Renders from a VerteResult and nothing else. No fetching, no chrome.* calls,
 * no knowledge of where the data came from. That is what makes it survivable
 * when a lane pivots.  Owned by lane/ui.
 * ------------------------------------------------------------------------- */

import { useMemo, useState } from 'react'
import type { UsedOption, VerteResult } from '../types'
import { formatCo2, formatUsd, milesDrivenEquivalent } from '../carbon'
import { Verdict } from './Verdict'
import { Empty } from './Empty'
import { Leaf } from './Skeleton'

type Props = {
  result: VerteResult
  onDismiss?: () => void
  /** Start expanded — the dev preview page uses this. */
  defaultExpanded?: boolean
}

export function Card({ result, onDismiss, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [tab, setTab] = useState<UsedOption['source']>('ebay')

  const { product, guidance, options, savingsUsd, co2AvoidedKg } = result

  const cheapest = useMemo(
    () => options.reduce<UsedOption | null>((a, b) => (a && a.price <= b.price ? a : b), null),
    [options],
  )
  const ebay = options.filter((o) => o.source === 'ebay')
  const campus = options.filter((o) => o.source === 'campus')
  const shown = tab === 'ebay' ? ebay : campus

  if (!expanded) {
    return (
      <div className="verte verte--collapsed">
        <button className="verte__strip" onClick={() => setExpanded(true)}>
          <Leaf />
          {cheapest && savingsUsd ? (
            <span>
              <strong>{formatUsd(cheapest.price, product.currency)}</strong> used
              {cheapest.source === 'campus' ? ' nearby' : ''} — save{' '}
              <strong>{formatUsd(savingsUsd, product.currency)}</strong>
            </span>
          ) : guidance.verdict === 'avoid' ? (
            <span>Verte suggests buying this one new</span>
          ) : (
            <span>No secondhand listings right now</span>
          )}
          <span className="verte__strip-chevron" aria-hidden="true">▾</span>
        </button>
      </div>
    )
  }

  return (
    <div className="verte">
      <header className="verte__header">
        <Leaf />
        <span className="verte__wordmark">Verte</span>
        {onDismiss && (
          <button className="verte__dismiss" onClick={onDismiss} aria-label="Dismiss">
            ×
          </button>
        )}
      </header>

      <div className="verte__body">
        {/* 1 — money leads */}
        {cheapest && (
          <div className="verte__price">
            {product.price != null && (
              <>
                <span className="verte__price-was">
                  {formatUsd(product.price, product.currency)}
                </span>
                <span className="verte__price-arrow" aria-hidden="true">→</span>
              </>
            )}
            <span className="verte__price-now">
              {formatUsd(cheapest.price, product.currency)}
            </span>
            {savingsUsd != null && (
              <span className="verte__save">
                Save {formatUsd(savingsUsd, product.currency)}
              </span>
            )}
          </div>
        )}

        {options.length === 0 && guidance.verdict !== 'avoid' ? (
          <Empty result={result} />
        ) : (
          <>
            {cheapest && <hr className="verte__rule" />}

            {/* 2 — the verdict */}
            <Verdict guidance={guidance} />

            {/* 3 — carbon, framed as avoided manufacturing */}
            {co2AvoidedKg != null && co2AvoidedKg > 0 && (
              <>
                <hr className="verte__rule" />
                <p className="verte__carbon">
                  Avoids {formatCo2(co2AvoidedKg)} of manufacturing{' '}
                  <span className="verte__carbon-eq">
                    — about {milesDrivenEquivalent(co2AvoidedKg)} miles driven
                  </span>
                </p>
              </>
            )}

            {/* 4 — the two routes */}
            {options.length > 0 && (
              <>
                <div className="verte__routes">
                  <button
                    className="verte__route verte__route--fill"
                    aria-pressed={tab === 'ebay'}
                    onClick={() => setTab('ebay')}
                  >
                    {ebay.length} on eBay
                  </button>
                  <button
                    className="verte__route verte__route--outline"
                    aria-pressed={tab === 'campus'}
                    onClick={() => setTab('campus')}
                  >
                    {campus.length} near campus
                  </button>
                </div>
                <ul className="verte__listings">
                  {shown.map((o) => (
                    <li key={o.url}>
                      <a
                        className="verte__listing"
                        href={o.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <span className="verte__listing-price">
                          {formatUsd(o.price, product.currency)}
                        </span>
                        <span className="verte__listing-title">{o.title}</span>
                        <span className="verte__listing-meta">
                          {o.distanceMi != null ? `${o.distanceMi} mi` : o.condition}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
