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

  test('credits the suggestions to Verte AI', () => {
    expect(cardHtml(base)).toContain('Picked by Verte AI from energy use, certifications and lifespan.');
  });

  test('says so plainly when there is no better option', () => {
    const html = cardHtml({ ...base, alternatives: [] });
    expect(html).toContain('Nothing here is meaningfully lower-carbon');
    expect(html).not.toContain('Picked by Verte AI');
  });
});

describe('card placement', () => {
  beforeEach(() => {
    jest.resetModules();
    global.chrome = {
      runtime: { sendMessage: jest.fn(), lastError: null },
      storage: { local: { set: jest.fn() } },
    };
  });

  function page(buyArea) {
    // JSON-LD, because the test page runs on localhost where the Amazon
    // title adapter doesn't apply.
    document.head.innerHTML = `<script type="application/ld+json">${JSON.stringify({
      '@type': 'Product', name: 'Dell 24 inch Monitor', offers: { price: '179' },
    })}</script>`;
    document.body.innerHTML = buyArea;
  }

  test('sits directly above the buy box', () => {
    page('<div id="rightCol"><div id="buybox">Add to cart</div></div>');
    jest.isolateModules(() => require('./index'));
    const host = document.getElementById('verte-card-host');
    expect(host.nextElementSibling.id).toBe('buybox');
  });

  test('goes to the top of the right column when there is no buy box', () => {
    page('<div id="rightCol"><div id="other">Seller info</div></div>');
    jest.isolateModules(() => require('./index'));
    expect(document.getElementById('rightCol').firstElementChild.id).toBe('verte-card-host');
  });
});

describe('collapsing the card', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    global.chrome = {
      runtime: { sendMessage: jest.fn(), lastError: null },
      storage: { local: { set: jest.fn() } },
    };
    document.head.innerHTML = `<script type="application/ld+json">${JSON.stringify({
      '@type': 'Product', name: 'Dell 24 inch Monitor', offers: { price: '179' },
    })}</script>`;
    document.body.innerHTML = '<div id="rightCol"><div id="buybox">Add to cart</div></div>';
  });

  const shadow = () => document.getElementById('verte-card-host').shadowRoot;

  test('the header folds and unfolds the card, and remembers it', () => {
    jest.isolateModules(() => require('./index'));
    const card = shadow().querySelector('.verte');
    const toggle = shadow().querySelector('.toggle');

    expect(card.classList.contains('collapsed')).toBe(false);
    toggle.click();
    expect(card.classList.contains('collapsed')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem('verte:collapsed')).toBe('1');

    toggle.click();
    expect(card.classList.contains('collapsed')).toBe(false);
  });

  test('a card on the next page starts folded if you folded the last one', () => {
    localStorage.setItem('verte:collapsed', '1');
    jest.isolateModules(() => require('./index'));
    expect(shadow().querySelector('.verte').classList.contains('collapsed')).toBe(true);
  });

  test('a folded card still says what is inside it', () => {
    const html = cardHtml({
      product: { title: 'x' }, guidance: { co2Source: '', note: '' },
      alternatives: [{ title: 'a', why: 'b', url: 'https://a' }, { title: 'c', why: 'd', url: 'https://c' }],
      embodiedCo2Kg: null,
    });
    expect(html).toContain('2 lower-carbon options');
  });
});
