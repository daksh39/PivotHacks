/* The trust-builder (verte-plan.md §06). It proves we know something they
 * don't, and it is why they keep Verte installed. No all-caps alarm language. */

import type { CategoryGuidance } from '../types'
import { verdictColor } from '../tokens'

const GLYPH = { safe: '✓', check: '!', avoid: '✕' } as const

export function Verdict({ guidance }: { guidance: CategoryGuidance }) {
  const v = verdictColor[guidance.verdict]
  return (
    <div className="verte__verdict">
      <span className={`verte__verdict-badge verte__verdict--${guidance.verdict}`}>
        <span aria-hidden="true">{GLYPH[guidance.verdict]}</span>
        {v.label}
      </span>
      {guidance.checkTips.length > 0 && (
        <ul className="verte__tips">
          {guidance.checkTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      {guidance.note && <p className="verte__note">{guidance.note}</p>}
    </div>
  )
}
