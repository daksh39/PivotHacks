/*global chrome*/
import './App.css';
import { useEffect, useState } from "react";
import AlternativesScreen from './screens/AlternativesScreen';
import StatusScreen from './screens/StatusScreen';
import VerteHeader from './components/VerteHeader';
import VoiceButton from './components/VoiceButton';
import { useVoiceLookup } from './voice/useVoiceLookup';

/*
 * Verte popup.
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
  else if (state) body = <StatusScreen status={state.status} />;

  return (
    <div className="verte-app">
      <div className="verte-app-header"><VerteHeader isSmall={true} /></div>
      <VoiceButton
        state={voice.state}
        transcript={voice.transcript}
        error={voice.error}
        onStart={voice.start}
        onStop={voice.stop}
        onSubmitText={voice.submitText}
      />
      {body}
    </div>
  );
}

export default App;
