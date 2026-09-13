/* ---------------------------------------------------------------------------
 * The Verte proxy. One endpoint. BUILD_PLAN.md §04 lane B.
 *
 * The extension only ever talks to this service, and this service holds
 * anything that must not ship in a bundle — today the Snowflake key, tomorrow
 * whatever marketplace credential we end up with.
 * ------------------------------------------------------------------------- */

require('dotenv').config({ quiet: true });  // dotenv prints promo tips otherwise

const express = require('express');
const cors = require('cors');

const { lookup } = require('./lookup');
const { guidanceTable } = require('./guidance');

const app = express();
const PORT = Number(process.env.PORT || 8787);

// The extension calls from the retailer's origin, so the browser preflights.
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'verte-proxy' });
});

/** The whole API. ProductContext + page listings in, VerteResult out. */
app.post('/lookup', async (req, res) => {
  const { product, listings } = req.body || {};

  if (!product || typeof product.title !== 'string' || !product.title.trim()) {
    return res.status(400).json({ error: 'product.title is required' });
  }

  try {
    const result = await lookup(product, Array.isArray(listings) ? listings : []);
    if (!result) {
      // Unknown category. The card renders nothing rather than guessing.
      return res.status(404).json({ error: 'no guidance for this product' });
    }
    return res.json(result);
  } catch (error) {
    console.error('[verte] lookup failed:', error);
    return res.status(500).json({ error: 'lookup failed' });
  }
});

app.listen(PORT, async () => {
  console.log(`[verte] proxy on http://localhost:${PORT}`);
  await guidanceTable();   // warm the knowledge base so the first card is instant
});
