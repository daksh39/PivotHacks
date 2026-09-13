/*
 * Verte configuration.
 *
 * Every outbound URL lives here so swapping the data layer is a one-file
 * change. Values come from `.env` (see `.env.example`); the fallbacks keep the
 * popup working before anyone has filled one in.
 *
 * Only REACT_APP_* variables reach this file — and everything here is compiled
 * into the bundle, so nothing secret belongs in it. The eBay and Snowflake
 * credentials are read by the proxy, server-side, and never travel to the
 * extension.
 */

export const BRAND = {
  name: 'Verte',
  thesis: 'The greenest product is the one that already exists.',
  tagline: 'Tell it what you are buying, and it shows you the lower-carbon choice.',
};

// Our own proxy. The original Bubble backend is gone — its API returns 401
// ("this application does not expose an API"), so nothing points at it.
export const API_BASE = process.env.REACT_APP_VERTE_API_BASE || 'http://localhost:8787';

export const ENDPOINTS = {
  health: `${API_BASE}/health`,
  lookup: `${API_BASE}/lookup`,
  voice: `${API_BASE}/voice`,
};

