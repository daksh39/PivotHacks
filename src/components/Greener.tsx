/* ---------------------------------------------------------------------------
 * Rung 2: a certified NEW product, shown only when nothing secondhand exists.
 *
 * Labelled "new" without exception. A new product still carries its whole
 * manufacturing footprint, so this is the second-best answer and the card must
 * never let it read as the best one.
 *
 * The certification is quoted from the retailer. We never author a green claim
 * ourselves — a claim with no named certifier behind it is indistinguishable
 * from greenwashing, and the module upstream drops any product whose
 * certification it could not read.
 * ------------------------------------------------------------------------- */

import { formatUsd } from '../carbon'
import type { GreenerOption } from '../types'

export function Greener({ options }: { options: GreenerOption[] }) {
  if (!options.length) return null

  return (
    <div className="verte__greener">
      <p className="verte__greener-label">No secondhand — greenest new option</p>

      <ul className="verte__listings">
        {options.slice(0, 2).map((option) => (
          <li key={option.url}>
            <a
              className="verte__listing"
              href={option.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="verte__listing-price">
                {formatUsd(option.price, option.currency)}
              </span>
              <span className="verte__listing-title">{option.title}</span>
              <span className="verte__listing-meta">
                <span className="verte__cert">new</span>
              </span>
            </a>
            <p className="verte__cert-detail">{option.certification}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
