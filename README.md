# Verte

A Chrome extension that shows you the secondhand option right when you are about to buy something new.

## The idea

Most sustainable shopping tools point you at a greener version of whatever you were already going to buy. That still means manufacturing a new product, and for durable goods manufacturing is where the majority of lifetime emissions come from. So the greener recommendation is often not that much greener.

Verte takes a different angle. The lowest impact option is usually something that already exists. Buying it used avoids the manufacturing footprint almost entirely.

It is also the cheaper option, which honestly matters more if you are a student furnishing a room for the first time. We built this for that person specifically: limited budget, no experience buying furniture or appliances, not much time, and no idea what is available nearby.

## What it does

When you land on a product page, Verte looks for the same item secondhand. If it finds something, a small card appears near the buy button showing three things:

1. The used price and what you would save
2. Whether that category is actually safe to buy secondhand, and what to check before you buy
3. The manufacturing emissions avoided by not buying new

The third one is the reason the project exists. The first one is why anyone would actually keep it installed.

## Not everything should be bought used

This is the part we think is genuinely useful and the part that took the most thought.

A used desk is a great idea. A used mattress is not. A used bike helmet is a bad idea for reasons that are not obvious unless someone has told you, which for a lot of first year students nobody has. Non-stick pans lose their coating. Smoke detectors have sensors that expire. Surge protectors quietly stop protecting anything after they have absorbed enough surges.

So Verte keeps a small knowledge base of product categories, each with a verdict (safe, check first, or buy new) and a short list of things to inspect. If you are on a mattress listing, Verte will tell you to buy it new. An app that only ever says yes is not worth trusting.

## How it works

```
Product page
    |
    | content script extracts title, price, category
    v
Proxy service
    |
    +---> Amazon used buybox   (read from the page DOM)
    +---> Best Buy open box    (their own storefront search API)
    |
    v
Card injected back into the page
```

The content script reads the product off the page. Amazon and Best Buy publish
no JSON-LD and no og: tags, so each gets a small adapter; structured data is the
fallback for other retailers.

It then reads the secondhand listings from the retailer itself. On Amazon that
is the used buybox already sitting in the page. On Best Buy it is the open-box
search their own storefront calls. Both are same-origin requests made from the
page, which is why no API key and no approval process is involved.

Product and listings go to a small local service that adds the category
guidance, ranks the options, and returns a single object. The card renders from
that object and nothing else, which keeps the UI independent of where the data
came from.

Everything is injected into a shadow root so the host page's stylesheet cannot reach it.

## Stack

- React 18 and Vite, with CRXJS for the extension build
- Manifest V3
- Snowflake for the category knowledge base (optional; falls back to a built-in table)
- No third-party listings API, and no credentials
- A thin proxy service for credentials and data access

## Running it locally

No credentials are needed to run it.

```bash
git clone https://github.com/daksh39/PivotHacks.git
cd PivotHacks
npm install
```

Then run the local service and build the extension:

```bash
npm run proxy
npm run dev
```

To load it in Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select the `dist` folder. Open any supported product page and the card should appear near the buy button.

## Project structure

```
src/
  types.ts              shared types, everything is built against these
  tokens.ts             design system
  carbon.ts             CO2 formatting and the miles-driven equivalence
  contentScript/        page detection, product extraction, shadow root
  background/           service worker, the only thing that calls the proxy
  components/           the card and its states
  popup/                extension popup
  dev/preview.html      the card alone, every state, in a plain page
proxy/
  index.ts              the one endpoint, POST /lookup
  rank.ts               context-aware ranking
  snowflake.ts          the category knowledge base
  categories.ts         title to category classification
  smoke.sh              proves the proxy returns a well-formed VerteResult
data/
  category-guidance.sql knowledge base seed
site/                   landing page
```

## A note on the data

Every listing shown comes from the retailer whose page you are on: Amazon's own
used offer, or Best Buy's own open-box listings. There is no seeded or invented
listing data anywhere in the product.

Carbon figures appear only where we have a citation. Monitors use Dell's
published product carbon footprint datasheet, laptops use Apple's Product
Environmental Report, and the miles-driven conversion uses the US EPA's figure
for a typical passenger vehicle. Categories we could not source show no carbon
figure at all rather than a number we cannot defend.

## Team

Aaryan, Siddharth, Shaurya, and Daksh.

## Status

Built during a 12 hour hackathon, so treat it accordingly. It currently works on a limited set of retailers and the category knowledge base covers around twenty product types, weighted toward the things you buy when you move into student accommodation.

Things we would do next, roughly in order:

- Real delivery estimates. Both sources currently report the same placeholder
  number of days, which means the deadline-aware ranking cannot yet tell two
  listings apart.
- More retailers, since right now coverage is Amazon and Best Buy
- Carbon citations for more categories
- Better category classification, currently keyword rules
