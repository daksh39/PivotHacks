/* Category is fine to buy used — we just have nothing listed right now. Say
 * that plainly rather than disappearing. */

import type { VerteResult } from '../types'
import { Verdict } from './Verdict'

export function Empty({ result }: { result: VerteResult }) {
  return (
    <>
      <p className="verte__empty">
        Nothing secondhand listed for this right now — worth checking back.
      </p>
      <hr className="verte__rule" />
      <Verdict guidance={result.guidance} />
    </>
  )
}
