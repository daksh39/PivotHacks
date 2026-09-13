import { useState } from 'react';
import './Options.css';
import VerteMark from '../components/VerteMark';
import { BRAND } from '../config';

/*
 * Options page, and the place microphone permission gets granted.
 *
 * An extension popup can't show Chrome's permission prompt, so the voice bar
 * sends people here the first time. Granting it on this page grants it for
 * the whole extension, and the popup mic works from then on.
 */
function MicPermission() {
  const [status, setStatus] = useState('idle');

  async function enable() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setStatus('granted');
    } catch {
      setStatus('denied');
    }
  }

  return (
    <div className="verte-options-mic">
      <button type="button" className="verte-options-button" onClick={enable}>
        {status === 'granted' ? 'Microphone enabled' : 'Enable microphone'}
      </button>
      <p className="verte-options-mic-note" aria-live="polite">
        {status === 'granted'
          ? 'Done. Close this tab and use the mic in the Verte popup.'
          : status === 'denied'
          ? 'Blocked. Click the icon at the left of the address bar, allow the microphone, and try again.'
          : 'Needed once, so you can tell Verte what you are buying.'}
      </p>
    </div>
  );
}

function Options() {
  return (
    <div className="verte-options">
      <header className="verte-options-header">
        <VerteMark height={44} />
        <h1 className="verte-options-wordmark">{BRAND.name}</h1>
        <p className="verte-options-thesis">{BRAND.thesis}</p>
        <p className="verte-options-tagline">{BRAND.tagline}</p>
        <MicPermission />
      </header>
    </div>
  );
}

export default Options;
