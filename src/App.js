/*global chrome*/
import './App.css';
import { useEffect, useState } from "react";
import AlternativesScreen from './screens/AlternativesScreen';
import StatusScreen from './screens/StatusScreen';

/*
 * Verte popup.
 *
 * The inline card is the product; this is a second window onto the same
 * answer. The content script stores what it rendered — or why it didn't —
 * keyed by page, and the popup reports that rather than running its own
 * lookup and inventing a second source of truth.
 */
function App() {
  const [state, setState] = useState(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0] && tabs[0].url ? tabs[0].url.split('?')[0] : '';
      if (!url) return setState({ status: 'none' });

      chrome.storage.local.get([`verte:${url}`], (stored) => {
        setState(stored[`verte:${url}`] || { status: 'none' });
      });
    });
  }, []);

  if (!state) return <div className="verte-app" />;
  if (state.status !== 'ok' || !state.result) {
    return <div className="verte-app"><StatusScreen status={state.status} /></div>;
  }

  return (
    <div className="verte-app">
      <AlternativesScreen result={state.result} />
    </div>
  );
}

export default App;
