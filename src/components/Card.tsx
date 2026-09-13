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

import { useState } from 'react'
import type { UsedOption, VerteResult } from '../types'
import { explainReason } from '../reason'
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

  const { product, guidance, options, savingsUsd, co2AvoidedKg, reason, passedOver, context } =
    result

  /* options[0] is the RECOMMENDATION, already ranked against the buyer's
   * context by proxy/rank.ts. It is not necessarily the cheapest listing,
   * and the card must never quietly substitute the cheapest for it. */
  const recommended: UsedOption | null = options[0] ?? null
  const unusable = reason === 'nothing-arrives-in-time'
  const ebay = options.filter((o) => o.source === 'ebay')
  const campus = options.filter((o) => o.source === 'campus')
  const shown = tab === 'ebay' ? ebay : campus

  if (!expanded) {
    return (
      <div className="verte verte--collapsed">
        <button className="verte__strip" onClick={() => setExpanded(true)}>
          <Leaf />
          {recommended && savingsUsd && !unusable ? (
            <span>
              <strong>{formatUsd(recommended.price, product.currency)}</strong> used
              {recommended.source === 'campus' ? ' nearby' : ''} — save{' '}
              <strong>{formatUsd(savingsUsd, product.currency)}</strong>
            </span>
          ) : guidance.verdict === 'avoid' ? (
            <span>Verte suggests buying this one new</span>
          ) : unusable ? (
            <span>Nothing secondhand reaches you in time</span>
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
        {recommended && !unusable && (
          <>
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
                {formatUsd(recommended.price, product.currency)}
              </span>
              {savingsUsd != null && (
                <span className="verte__save">
                  Save {formatUsd(savingsUsd, product.currency)}
                </span>
              )}
            </div>

            {/* Why THIS one. A recommendation you can't interrogate is one you
              * won't trust, and after pivot 03 the winner is frequently not
              * the cheapest listing on the card. */}
            <p className="verte__reason">{explainReason(reason, context)}</p>

            {/* What context cost them. Never truncated — the ui-ux guidance on
              * essential text is explicit that you don't clamp meaning just to
              * keep cards uniform. It wraps instead. */}
            {passedOver && (
              <p className="verte__passed">
                Skipped {formatUsd(passedOver.option.price, product.currency)}
                {passedOver.option.source === 'campus' ? ' nearby' : ' on eBay'} — {passedOver.why}
              </p>
            )}
          </>
        )}

        {/* Context made everything unreachable. Say so and stop selling. */}
        {unusable && (
          <div className="verte__blocked">
            <p className="verte__blocked-head">{explainReason(reason, context)}</p>
            <p className="verte__blocked-sub">
              {options.length} listing{options.length === 1 ? '' : 's'} exist, but none get to you
              by then. Buying new is the honest answer today.
            </p>
          </div>
        )}

        {options.length === 0 && guidance.verdict !== 'avoid' ? (
          <Empty result={result} />
        ) : (
          <>
            <hr className="verte__rule" />

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
