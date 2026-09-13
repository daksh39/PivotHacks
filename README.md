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
    +---> eBay Browse API      (live used listings)
    +---> Snowflake            (campus listings, category knowledge base)
    |
    v
Card injected back into the page
```

The content script reads the product off the page, preferring the JSON-LD product block over CSS selectors since retail markup changes constantly. It sends that to a small proxy service, which is also where the eBay credentials live. They cannot go in the extension itself, both because the bundle is readable by anyone and because the browser blocks the request on CORS.

The proxy queries eBay for used listings, looks up the category guidance and any nearby campus listings in Snowflake, and returns a single object. The card renders from that object and nothing else, which keeps the UI independent of where the data came from.

Everything is injected into a shadow root so the host page's stylesheet cannot reach it.

## Stack

- React 18 and Vite, with CRXJS for the extension build
- Manifest V3
- Snowflake for the category knowledge base and campus listings
- eBay Browse API for live secondhand listings
- A thin proxy service for credentials and data access

## Running it locally

You will need a Snowflake account and an eBay developer account with Browse API access.

```bash
git clone https://github.com/daksh39/PivotHacks.git
cd PivotHacks
npm install
```

Copy the example environment file and fill in your own credentials:

```bash
cp .env.example .env
```

```
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
SNOWFLAKE_ACCOUNT=
SNOWFLAKE_USER=
SNOWFLAKE_PASSWORD=
SNOWFLAKE_DATABASE=
SNOWFLAKE_WAREHOUSE=
```

Then run the proxy and build the extension:

```bash
npm run proxy
npm run dev
```

To load it in Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select the `dist` folder. Open any supported product page and the card should appear near the buy button.

## Project structure

```
src/
  types.ts              shared types, everything is built against these
  mocks.ts              shared fixtures, so no one is blocked on anyone
  tokens.ts             design system
  carbon.ts             CO2 formatting and the miles-driven equivalence
  contentScript/        page detection, product extraction, shadow root
  background/           service worker, the only thing that calls the proxy
  components/           the card and its states
  popup/                extension popup
  dev/preview.html      the card alone, every state, in a plain page
proxy/
  index.ts              the one endpoint, POST /lookup
  ebay.ts               Browse API, OAuth, caching
  snowflake.ts          campus listings and the category knowledge base
  categories.ts         title to category classification
  smoke.sh              proves the proxy returns a well-formed VerteResult
data/
  category-guidance.sql knowledge base seed
site/                   landing page
```

## A note on the data

The eBay listings are live. The campus listings are seeded, because the places students actually buy and sell secondhand locally are Facebook groups and GroupMe chats with no API to read from. We would rather say that plainly than imply otherwise.

The carbon figures are published embodied carbon estimates by product category, not anything we calculated ourselves. Each one is stored with its source alongside it, and the interface shows them as approximate because that is what they are. We were more interested in having a number we could defend than a number that looked impressive.

## Team

Aaryan, Siddharth, Shaurya, and Daksh.

## Status

Built during a 12 hour hackathon, so treat it accordingly. It currently works on a limited set of retailers and the category knowledge base covers around twenty product types, weighted toward the things you buy when you move into student accommodation.

Things we would do next, roughly in order:

- More retailers, since right now coverage is narrow
- A real ingestion path for local listings instead of seeded data
- Better category classification, currently keyword rules
- Price history so you can tell whether a used listing is actually a good deal
