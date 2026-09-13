import { parsePrice, extractProduct } from './extract';
import { readListings } from './listings';
import { cardHtml } from './card';

afterEach(() => { document.head.innerHTML = ''; document.body.innerHTML = ''; });

describe('parsePrice', () => {
  test.each([
    ['$89.00', 89],
    ['$1,299.99', 1299.99],
    ['34', 34],
    ['Used - Very Good $34.00', 34],
    ['', null],
    ['no digits here', null],
  ])('%s → %s', (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });
});

describe('extractProduct', () => {
  test('prefers JSON-LD over everything else', () => {
    document.head.innerHTML = `
      <meta property="og:title" content="Wrong title">
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'Product',
        name: 'Midea 3.1 Cu Ft Compact Refrigerator',
        image: ['https://x/f.jpg'],
        offers: { price: '89.00', priceCurrency: 'USD' },
      })}</script>`;
    const product = extractProduct();
    expect(product.title).toBe('Midea 3.1 Cu Ft Compact Refrigerator');
    expect(product.price).toBe(89);
    expect(product.imageUrl).toBe('https://x/f.jpg');
    expect(product.category).toBe('');   // the proxy classifies
  });

  test('falls back to og: tags', () => {
    document.head.innerHTML = `
      <meta property="og:title" content="Dell 24 inch Monitor">
      <meta property="og:price:amount" content="179.99">`;
    expect(extractProduct()).toMatchObject({ title: 'Dell 24 inch Monitor', price: 179.99 });
  });

  test('on Amazon, #productTitle beats a prefixed og:title', () => {
    document.head.innerHTML = '<meta property="og:title" content="Amazon.com: Mini Fridge">';
    document.body.innerHTML = `<span id="productTitle"> Midea Mini Fridge </span>
      <div id="corePrice_feature_div"><span class="a-offscreen">$89.00</span></div>`;
    expect(extractProduct('www.amazon.com')).toMatchObject({ title: 'Midea Mini Fridge', price: 89 });
  });

  test('strips the Amazon.com prefix when og:title is all there is', () => {
    document.head.innerHTML = '<meta property="og:title" content="Amazon.com: Desk Lamp">';
    expect(extractProduct('www.example.com').title).toBe('Desk Lamp');
  });

  test('returns null when the page is not a product', () => {
    document.body.innerHTML = '<h1>Search results</h1>';
    expect(extractProduct()).toBeNull();
  });
});

describe('readListings', () => {
  const product = { title: 'Mini Fridge', price: 89, imageUrl: null };

  test('ignores an offer priced at or above the new price', () => {
    document.body.innerHTML = `<div id="usedBuySection">
      <span class="a-price"><span class="a-offscreen">$95.00</span></span></div>`;
    expect(readListings(product, 'www.amazon.com')).toEqual([]);
  });

  test('deduplicates the same price appearing in two blocks', () => {
    document.body.innerHTML = `
      <div id="usedBuySection"><span class="a-price"><span class="a-offscreen">$34.00</span></span></div>
      <div id="usedAccordionRow"><span class="a-price"><span class="a-offscreen">$34.00</span></span></div>`;
    expect(readListings(product, 'www.amazon.com')).toHaveLength(1);
  });
});

describe('cardHtml', () => {
  const base = {
    product: { title: 'Dell 24 inch LED Monitor', price: 179 },
    guidance: { category: 'monitor', verdict: 'safe', checkTips: [],
                embodiedCo2Kg: 322, co2Source: 'Dell S2421HS Monitor PCF datasheet',
                note: '', bulky: false },
    alternatives: [{
      source: 'ai',
      title: 'Dell P2422H',
      why: 'ENERGY STAR certified at 14 kWh/year against 21 for this model.',
      co2SavingKgPerYear: 3,
      url: 'https://www.amazon.com/s?k=Dell+P2422H',
      estimated: true,
    }],
    pageOptions: [],
    embodiedCo2Kg: 322,
    co2AvoidedKg: null,
    savingsUsd: null,
  };

  test('leads with the sourced manufacturing figure and its citation', () => {
    const html = cardHtml(base);
    expect(html).toContain('~322 kg CO\u2082e to manufacture');
    expect(html).toContain('Dell S2421HS Monitor PCF datasheet');
  });

  test('shows no carbon number when the knowledge base has no citation', () => {
    const html = cardHtml({ ...base, embodiedCo2Kg: null });
    expect(html).not.toContain('to manufacture');
    expect(html).toContain('Lower-carbon options');
  });

  test('renders each alternative with its reason and a search link', () => {
    const html = cardHtml(base);
    expect(html).toContain('Dell P2422H');
    expect(html).toContain('ENERGY STAR certified at 14 kWh/year');
    expect(html).toContain('https://www.amazon.com/s?k=Dell+P2422H');
    expect(html).toContain('~3 kg CO\u2082e/year less');
  });

  test('labels the suggestions as estimates, not published figures', () => {
    expect(cardHtml(base)).toContain('AI estimates, not published figures');
  });

  test('says so plainly when there is no better option', () => {
    const html = cardHtml({ ...base, alternatives: [] });
    expect(html).toContain('Nothing here is meaningfully lower-carbon');
    expect(html).not.toContain('AI estimates');
  });
});
