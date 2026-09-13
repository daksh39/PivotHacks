/* ---------------------------------------------------------------------------
 * "Tell Verte what you need."
 *
 * Speaking replaces the chips, and it can say things the chips cannot: any
 * amount, and any day of the week. That is why voice is here — it is more
 * expressive than the control it stands in for, not a slower way to press it.
 *
 * What it changes is real: the parsed context feeds proxy-side ranking, so a
 * spoken budget can flip the recommendation from a listing to "nothing
 * secondhand is within your budget", live, without a reload.
 * ------------------------------------------------------------------------- */

import { useState } from 'react'
import { listenOnce, speechSupported } from '../contentScript/speech'
import { parseSpoken } from '../voice'
import type { BuyerContext } from '../types'

type Phase = 'idle' | 'listening' | 'heard' | 'failed'

const MESSAGE: Record<string, string> = {
  unsupported: 'This browser has no speech recognition',
  denied: 'Microphone blocked — allow it in the address bar',
  'no-speech': "Didn't catch that — try again",
  failed: 'Could not listen just now',
}

export function VoiceContext({ onHeard }: { onHeard: (context: Partial<BuyerContext>) => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [said, setSaid] = useState('')
  const [note, setNote] = useState('')

  /* Hidden rather than broken on a browser that cannot do this. */
  if (!speechSupported()) return null

  async function listen() {
    setPhase('listening')
    setSaid('')
    setNote('')

    const result = await listenOnce()
    if (!result.ok) {
      setPhase('failed')
      setNote(MESSAGE[result.reason] ?? MESSAGE.failed)
      return
    }

    setSaid(result.transcript)
    const parsed = parseSpoken(result.transcript)

    if (!parsed.understood.length) {
      /* Heard the words, understood no instruction. Saying so is better than
       * silently changing nothing and looking broken. */
      setPhase('failed')
      setNote('No budget or deadline in that — try "by Friday, under $80"')
      return
    }

    setPhase('heard')
    setNote(
      parsed.understood.length === 2
        ? 'Deadline and budget updated'
        : `${parsed.understood[0] === 'budget' ? 'Budget' : 'Deadline'} updated`,
    )
    onHeard(parsed.context)
  }

  return (
    <div className="verte__voice">
      <button
        type="button"
        className="verte__voice-btn"
        onClick={() => void listen()}
        disabled={phase === 'listening'}
        aria-label="Set your budget and deadline by speaking"
      >
        <Mic active={phase === 'listening'} />
        {phase === 'listening' ? 'Listening…' : 'Tell Verte what you need'}
      </button>

      {said && <p className="verte__voice-said">“{said}”</p>}
      {note && (
        <p className={phase === 'failed' ? 'verte__voice-miss' : 'verte__voice-note'}>{note}</p>
      )}
    </div>
  )
}

function Mic({ active }: { active: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
        fill="currentColor"
        opacity={active ? 1 : 0.85}
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
