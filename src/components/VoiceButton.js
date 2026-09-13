import { useState } from 'react';
import './styles/VoiceButton.css';

const LABEL = {
  idle: "Tell Verte what you're buying",
  listening: 'Listening… just stop talking when done',
  thinking: 'Thinking…',
  done: 'Ask about something else',
  error: 'Try again',
};

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/*
 * The voice bar: one mic button, its status, what we heard, and a typed
 * fallback. Presentational — all behaviour comes from useVoiceLookup.
 */
function VoiceButton({ state, transcript, error, onStart, onStop, onSubmitText, standalone, children }) {
  const [text, setText] = useState('');
  const listening = state === 'listening';
  const busy = state === 'thinking';

  return (
    <div className={standalone ? 'voice voice--standalone' : 'voice'}>
      <button
        type="button"
        className={`voice-btn${listening ? ' voice-btn--live' : ''}`}
        onClick={listening ? onStop : onStart}
        disabled={busy}
        aria-pressed={listening}
      >
        <MicIcon />
        <span>{LABEL[state] || LABEL.idle}</span>
      </button>

      <div className="voice-status" aria-live="polite">
        {error ? <span className="voice-error">{error}</span>
          : transcript ? <span>You said: “{transcript}”</span>
          : <span>Say what you need, or add context like “under $200”</span>}
      </div>

      <form
        className="voice-type"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitText(text);
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="or type it"
          aria-label="Type what you're buying"
          disabled={busy || listening}
        />
      </form>

      {children}
    </div>
  );
}

export default VoiceButton;
