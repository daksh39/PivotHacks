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
import { formatUsd } from '../carbon'
import { impactLine } from '../impactLine'
import { Verdict } from './Verdict'
import { Empty } from './Empty'
import { Greener } from './Greener'
import { VoiceContext } from './VoiceContext'
import { Leaf } from './Skeleton'

/** "Tomorrow" reads better than "1 day" and is what they actually care about. */
function arrival(days: number): string {
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

/** Why this particular listing doesn't work for them, or null if it does. */
function blockedReason(o: UsedOption, result: VerteResult): string | null {
  const { context, guidance } = result
  if (context.budgetCap !== null && o.price > context.budgetCap) return 'Over budget'
  if (o.pickup && guidance?.bulky && !context.hasCar) return 'Needs a car'
  if (context.needInDays != null && o.daysToHand > context.needInDays) {
    return `${arrival(o.daysToHand)} · too late`
  }
  return null
}

type Props = {
  result: VerteResult
  /** Re-rank from a spoken context. Voice must change the answer, not a label. */
  onContext?: (context: Partial<VerteResult['context']>) => void
  onDismiss?: () => void
  /** Start expanded — the dev preview page uses this. */
  defaultExpanded?: boolean
}

export function Card({ result, onDismiss, onContext, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)


  const { product, guidance, options, savingsUsd, co2AvoidedKg, reason, passedOver, context, greener } =
    result

  /* options[0] is the RECOMMENDATION, already ranked against the buyer's
   * context by proxy/rank.ts. It is not necessarily the cheapest listing,
   * and the card must never quietly substitute the cheapest for it. */
  const recommended: UsedOption | null = options[0] ?? null
  const unusable = reason === 'nothing-arrives-in-time' || reason === 'nothing-in-budget'
  const impact = impactLine(result)

  /* One source per page now — you are on Amazon or you are on Best Buy, and
   * the listings are that retailer's own. There is nothing to switch between,
   * so the two-tab control is gone and the list stands on its own. */
  const sourceLabel = recommended?.source === 'bestbuy' ? 'Best Buy open box' : 'used on Amazon'

  if (!expanded) {
    return (
      <div className="verte verte--collapsed">
        <button className="verte__strip" onClick={() => setExpanded(true)}>
          <Leaf />
          {recommended && savingsUsd && !unusable ? (
            <span>
              <strong>{formatUsd(recommended.price, recommended.currency)}</strong> used
              {' '}— save{' '}
              <strong>{formatUsd(savingsUsd, product.currency)}</strong>
            </span>
          ) : guidance?.verdict === 'avoid' ? (
            <span>Verte suggests buying this one new</span>
          ) : unusable ? (
            <span>{explainReason(reason, context)}</span>
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
        <span className="verte__tagline">the greenest one already exists</span>
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
                {formatUsd(recommended.price, recommended.currency)}
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
                Skipped {formatUsd(passedOver.option.price, passedOver.option.currency)} — {passedOver.why}
              </p>
            )}
          </>
        )}

        {/* Context made everything unreachable. Say so and stop selling. */}
        {unusable && (
          <div className="verte__blocked">
            <p className="verte__blocked-head">{explainReason(reason, context)}</p>
            <p className="verte__blocked-sub">
              {passedOver
                ? `${options.length} listing${options.length === 1 ? '' : 's'} found, but ${passedOver.why}.`
                : `${options.length} listing${options.length === 1 ? '' : 's'} found, but none work for you today.`}
            </p>
          </div>
        )}

        {options.length === 0 && guidance?.verdict !== 'avoid' ? (
          <Empty result={result} />
        ) : (
          <>
            {(recommended || unusable) && <hr className="verte__rule" />}

            {/* 2 — the verdict */}
            {/* No verdict when we could not classify the product. The saving
              * still stands on its own — inventing a verdict would be worse. */}
            {guidance && <Verdict guidance={guidance} />}

            {/* 4 — where to actually get it */}
            {options.length > 0 && (
              <>
                <p className="verte__routes-label">
                  {options.length} {sourceLabel}
                </p>
                <ul className="verte__listings">
                  {options.map((o) => (
                    <li key={o.url}>
                      <a
                        className="verte__listing"
                        href={o.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <span className="verte__listing-price">
                          {formatUsd(o.price, o.currency)}
                        </span>
                        <span className="verte__listing-title">{o.title}</span>
                        <span className="verte__listing-meta">
                          {blockedReason(o, result) ? (
                            <span className="verte__eta verte__eta--late">
                              {blockedReason(o, result)}
                            </span>
                          ) : (
                            <span className="verte__eta">{arrival(o.daysToHand)}</span>
                          )}
                          {o.distanceMi != null && (
                            <span className="verte__listing-dist">{o.distanceMi} mi</span>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {/* The environmental claim, rendered for EVERY card — including the
          * no-listings one, which is the most common of all. It lived inside
          * the has-listings branch, so the card that most needed the argument
          * was the one card that carried none of it. */}
        <Greener options={greener} />

        {onContext && <VoiceContext onHeard={onContext} />}

        {impact && (
          <div className="verte__impact">
            <Leaf />
            <p className="verte__impact-text">
              {impact.headline}
              {impact.source && (
                <span className="verte__carbon-src" title={impact.source}>
                  source
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
