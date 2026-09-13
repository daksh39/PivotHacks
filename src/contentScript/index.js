/*global chrome*/
/*
 * Verte content script. BUILD_PLAN.md §01, §08.
 *
 * Detect a product page, read the product and any secondhand offers already on
 * it, ask the proxy what we know about the category, and inject the card near
 * the buy button — inside a shadow root so the retailer's CSS can't reach it.
 *
 * Everything here fails quietly. A card that doesn't appear is a
 * disappointment; a broken retailer page is a catastrophe.
 */

import { extractProduct } from './extract';
import { readListings } from './listings';
import { cardHtml, skeletonHtml, TOKENS } from './card';

const HOST_ID = 'verte-card-host';

/* Where the card belongs: next to the buy button, in reading order, not
 * floating over the page. Falls back down the list until something exists. */
const ANCHORS = [
  '#buybox',
  '#rightCol',
  '#addToCart',
  '#desktop_buybox',
  '.fulfillment-add-to-cart-button',
  '.priceView-hero-price',
  '#price_inside_buybox',
];

function dismissKey(product) {
  return `verte:dismissed:${product.sourceUrl}`;
}

function alreadyDismissed(product) {
  try {
    return sessionStorage.getItem(dismissKey(product)) === '1';
  } catch {
    return false;
  }
}

function remember(product) {
  try {
    sessionStorage.setItem(dismissKey(product), '1');
  } catch {
    /* private window, blocked storage — dismissal just won't persist */
  }
}

function mount() {
  const existing = document.getElementById(HOST_ID);
  if (existing) return existing.shadowRoot;

  const anchor = ANCHORS.map((s) => document.querySelector(s)).find(Boolean);
  if (!anchor) return null;

  const host = document.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = TOKENS;
  shadow.appendChild(style);

  const slot = document.createElement('div');
  shadow.appendChild(slot);

  anchor.parentNode.insertBefore(host, anchor.nextSibling);
  return shadow;
}

function render(shadow, html, product) {
  shadow.lastChild.innerHTML = html;
  const close = shadow.querySelector('.x');
  if (close) {
    close.addEventListener('click', () => {
      const host = document.getElementById(HOST_ID);
      if (host) host.remove();
      if (product) remember(product);
    });
  }
}

/* Every exit path records WHY, so the popup can say something true and the
 * console names the step that stopped. "Not a product page" was previously the
 * message for four different failures, which made it useless for debugging. */
function report(status, detail) {
  console.log(`[verte] ${status}${detail ? ': ' + detail : ''}`);
  try {
    chrome.storage.local.set({ [`verte:${window.location.href.split('?')[0]}`]: { status, detail } });
  } catch {
    /* storage unavailable */
  }
}

function lookup(product, listings) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'verte:lookup', product, listings }, (response) => {
      if (chrome.runtime.lastError) {
        return resolve({ ok: false, error: chrome.runtime.lastError.message });
      }
      resolve(response || { ok: false, error: 'no response from the service worker' });
    });
  });
}

async function run() {
  const product = extractProduct();
  if (!product) return report('no-product', 'could not read a title, price or JSON-LD block');
  if (alreadyDismissed(product)) return report('dismissed', product.title);

  const shadow = mount();
  if (!shadow) return report('no-anchor', 'found the product but nowhere to put the card');

  render(shadow, skeletonHtml(), product);

  const listings = readListings(product);
  const response = await lookup(product, listings);

  const host = document.getElementById(HOST_ID);

  if (!response.ok) {
    if (host) host.remove();
    return report('offline', response.error);
  }
  if (!response.result) {
    if (host) host.remove();
    return report('unknown-category', product.title);
  }

  const result = response.result;
  render(shadow, cardHtml(result), product);

  // Hand the popup the same VerteResult, so clicking the toolbar icon shows
  // what the card shows rather than asking the page all over again.
  try {
    chrome.storage.local.set({ [`verte:${product.sourceUrl}`]: { status: 'ok', result } });
  } catch {
    /* storage unavailable — the card still stands on its own */
  }
}

run();
