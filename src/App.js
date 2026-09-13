/*global chrome*/
import './App.css';
import { useEffect, useState } from "react";
import AlternativesScreen from './screens/AlternativesScreen';
import StatusScreen from './screens/StatusScreen';
import VerteHeader from './components/VerteHeader';
import VoiceButton from './components/VoiceButton';
import Essentials from './components/Essentials';
import { useVoiceLookup } from './voice/useVoiceLookup';

/*
 * Verte popup.
 *
 * Built for a university student living on their own for the first time:
 * one tap shows every university essential with a pick each, and context they give
 * ("under $200") keeps applying.
 *
 * Two ways in to the same answer. The inline card stores what it rendered for
 * the current page; the voice bar lets you say what you're buying from
 * anywhere. A spoken result takes over the popup, since it's what you just
 * asked for.
 */
function App() {
  const [state, setState] = useState(null);
  const voice = useVoiceLookup();

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0] && tabs[0].url ? tabs[0].url.split('?')[0] : '';
      if (!url) return setState({ status: 'none' });

      chrome.storage.local.get([`verte:${url}`], (stored) => {
        setState(stored[`verte:${url}`] || { status: 'none' });
      });
    });
  }, []);

  let body = null;
  if (voice.result) body = <AlternativesScreen result={voice.result} />;
  else if (state && state.status === 'ok' && state.result) body = <AlternativesScreen result={state.result} />;
  // 'none' means this page isn't a shop Verte reads (a new tab, a news site).
  // That's not a problem worth a message — the voice bar works anywhere, so
  // it stands on its own. Status screens are kept for things that went wrong.
  else if (state && state.status !== 'none') body = <StatusScreen status={state.status} />;

  return (
    <div className="verte-app">
      <div className="verte-app-header"><VerteHeader isSmall={true} /></div>
      <VoiceButton
        standalone={!body}
        state={voice.state}
        transcript={voice.transcript}
        error={voice.error}
        onStart={voice.start}
        onStop={voice.stop}
        onSubmitText={voice.submitText}
      >
        <Essentials
          standing={voice.standing}
          onShowAll={voice.showEssentials}
          onClearStanding={voice.clearStanding}
          busy={voice.state === 'thinking' || voice.state === 'listening'}
        />
      </VoiceButton>
      {body}
    </div>
  );
}

export default App;
