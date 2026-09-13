/*global chrome*/
/*
 * Verte service worker. MV3.
 *
 * The only thing that talks to the proxy. A content script fetching
 * localhost from amazon.com would be subject to the retailer's connect-src
 * CSP; the worker is not, and it holds the host permission.
 */

const PROXY = 'http://localhost:8787';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'verte:lookup') return false;

  fetch(`${PROXY}/lookup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ product: message.product, listings: message.listings || [] }),
  })
    .then(async (response) => {
      if (response.status === 404) return sendResponse({ ok: true, result: null });
      if (!response.ok) return sendResponse({ ok: false, error: `proxy ${response.status}` });
      sendResponse({ ok: true, result: await response.json() });
    })
    .catch((error) => {
      // Almost always "proxy isn't running". The card stays hidden.
      sendResponse({ ok: false, error: error.message });
    });

  return true; // keep the message channel open for the async reply
});
