/* ---------------------------------------------------------------------------
 * The microphone.
 *
 * Uses the browser's built-in SpeechRecognition — no API key, no server, no
 * audio ever leaving the page for us to handle. That is the same constraint
 * the rest of the extension runs under.
 *
 * This lives in the content script rather than the popup on purpose. An MV3
 * popup closes the moment a permission prompt takes focus, which makes asking
 * for a microphone there unreliable. The page keeps its permission and stays
 * open, and the user watches the card re-rank in front of them — which is also
 * the better demonstration that voice changed something real.
 *
 * Verified in the page context: SpeechRecognition present, secure context,
 * microphone permission in the "prompt" state.
 * ------------------------------------------------------------------------- */

type RecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

function constructor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** False on browsers without the API, so the button can stay hidden. */
export function speechSupported(): boolean {
  return constructor() !== null
}

export type ListenResult =
  | { ok: true; transcript: string }
  | { ok: false; reason: 'unsupported' | 'denied' | 'no-speech' | 'failed' }

/**
 * Listens once and resolves with what was said.
 *
 * Never throws and never hangs: every failure path resolves with a reason the
 * card can show, because a microphone that silently does nothing is worse
 * than no microphone at all.
 */
export function listenOnce(timeoutMs = 10_000): Promise<ListenResult> {
  const Recognition = constructor()
  if (!Recognition) return Promise.resolve({ ok: false, reason: 'unsupported' })

  return new Promise((resolve) => {
    const recognition = new Recognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    let settled = false
    const finish = (result: ListenResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        recognition.abort()
      } catch {
        /* already stopped */
      }
      resolve(result)
    }

    const timer = setTimeout(() => finish({ ok: false, reason: 'no-speech' }), timeoutMs)

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? ''
      finish(transcript ? { ok: true, transcript } : { ok: false, reason: 'no-speech' })
    }

    recognition.onerror = (event) => {
      const denied = event.error === 'not-allowed' || event.error === 'service-not-allowed'
      finish({ ok: false, reason: denied ? 'denied' : event.error === 'no-speech' ? 'no-speech' : 'failed' })
    }

    recognition.onend = () => finish({ ok: false, reason: 'no-speech' })

    try {
      recognition.start()
    } catch {
      finish({ ok: false, reason: 'failed' })
    }
  })
}
