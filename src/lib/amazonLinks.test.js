import fs from 'fs';
import path from 'path';
import { parseResults, bestMatch, closestMatch, resolveLink, resolveAll, withExactLinks, clearResolved } from './amazonLinks';

beforeEach(clearResolved);

// Real Amazon search results for "Acer Aspire 5 laptop", trimmed.
const html = fs.readFileSync(path.join(__dirname, '__fixtures__/amazon-search.html'), 'utf8');

test('reads real products out of an Amazon search page', () => {
  const results = parseResults(html);
  expect(results.length).toBe(4);
  expect(results[0]).toMatchObject({ asin: 'B0D45Z3KSJ', sponsored: false });
  expect(results[0].title).toMatch(/^Aspire 5 Touchscreen Laptop/);
  expect(results[0].brand).toBe('Acer');
  expect(results[1].sponsored).toBe(true);
});

test('never links to a sponsored result', () => {
  const results = parseResults(html);
  const match = bestMatch(results, 'Aspire Go 16 AI Ready Laptop');   // only exists as the ad
  expect(match).toBeNull();
});

test('matches the named product and ignores unrelated ones', () => {
  const results = parseResults(html);
  expect(bestMatch(results, 'Aspire 5 Touchscreen Laptop').asin).toBe('B0D45Z3KSJ');
  expect(bestMatch(results, 'Dell XPS 13')).toBeNull();
});

test('a different model number is a different product', () => {
  const results = parseResults(html);
  expect(bestMatch(results, 'Aspire Go 15 AI Ready Laptop')).not.toBeNull();
  expect(bestMatch(results, 'Aspire Go 14 AI Ready Laptop')).toBeNull();
});

test('swaps a search link for the exact product page', async () => {
  const fakeFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => html });
  const resolved = await resolveLink(
    { title: 'Aspire 5 Touchscreen Laptop', url: 'https://www.amazon.com/s?k=Acer%20Aspire%205' },
    fakeFetch
  );
  expect(resolved.url).toBe('https://www.amazon.com/dp/B0D45Z3KSJ');
  expect(resolved.exact).toBe(true);
  expect(resolved.searchUrl).toBe('https://www.amazon.com/s?k=Acer%20Aspire%205');
});

test('brand can come from its own heading, as on Amazon.ca', () => {
  const results = parseResults(html);
  expect(bestMatch(results, 'Acer Aspire 5 Touchscreen Laptop').asin).toBe('B0D45Z3KSJ');
});

test('when the exact model is not listed, links the closest real product under its own name', async () => {
  const fakeFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => html });
  const resolved = await resolveLink(
    { title: 'Acer Aspire 7 Touchscreen Laptop', url: 'https://www.amazon.ca/s?k=Acer%20Aspire%207' },
    fakeFetch
  );
  expect(resolved.exact).toBe(false);
  expect(resolved.url).toBe('https://www.amazon.ca/dp/B0D45Z3KSJ');
  expect(resolved.title).toMatch(/^Acer Aspire 5 Touchscreen Laptop/);   // real name, not the guess
  expect(closestMatch(parseResults(html), 'Dell XPS 13')).toBeNull();
});

test('the budget is checked against the real price, not the estimate', async () => {
  const page = (price) => `<div data-component-type="s-search-result" data-asin="B000000001">
    <h2 class="a-size-mini"><span>Hamilton Beach</span></h2>
    <h2 aria-label="Electric Kettle 1.7L"><span>Electric Kettle 1.7L</span></h2>
    <span class="a-offscreen">$${price}</span></div>`;
  const alt = { title: 'Hamilton Beach Electric Kettle', typicalPriceCad: 29,
                url: 'https://www.amazon.ca/s?k=Hamilton%20Beach%20Kettle' };

  const cheap = await resolveAll([alt], { budget: 60, fetchImpl: jest.fn().mockResolvedValue({ ok: true, text: async () => page('39.98') }) });
  expect(cheap).toHaveLength(1);
  expect(cheap[0].livePrice).toBe(39.98);

  clearResolved();   // the same kettle, now listed at a different price
  const pricey = await resolveAll([alt], { budget: 60, fetchImpl: jest.fn().mockResolvedValue({ ok: true, text: async () => page('89.99') }) });
  expect(pricey).toHaveLength(0);
});

test('keeps the search link when nothing matches or the fetch fails', async () => {
  const alt = { title: 'Dell XPS 13', url: 'https://www.amazon.com/s?k=Dell%20XPS%2013' };
  expect(await resolveLink(alt, jest.fn().mockResolvedValue({ ok: true, text: async () => html }))).toBe(alt);
  expect(await resolveLink(alt, jest.fn().mockRejectedValue(new Error('offline')))).toBe(alt);
});

test('reads Canadian prices, however Amazon writes them', () => {
  expect(parseResults(html).map((r) => r.price)).toEqual([null, 1248.08, 549.99, null]);
});

test('a whole essentials result gets exact links, and over-budget real prices drop out', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: async () => html });
  const laptop = parseResults(html)[2];                       // organic, CA$549.99
  const essentials = [
    { item: 'Laptop', alternative: { title: laptop.title.split(',')[0], url: 'https://www.amazon.ca/s?k=laptop' } },
    { item: 'Kettle', alternative: null },
  ];

  const open = await withExactLinks({ kind: 'essentials', context: null, essentials }, fetchImpl);
  expect(open.essentials[0].alternative.url).toBe(`https://www.amazon.ca/dp/${laptop.asin}`);
  expect(open.essentials[0].alternative.livePrice).toBe(549.99);
  expect(open.essentials[1]).toEqual({ item: 'Kettle', alternative: null });

  // Under CA$200 the real price rules it out: dropped, not faked.
  const capped = await withExactLinks({ kind: 'essentials', context: { budget: 200 }, essentials }, fetchImpl);
  expect(capped.essentials[0]).toEqual({ item: 'Laptop', alternative: null });
});

test('an accessory "for" the product is not the product', () => {
  const results = [
    { asin: 'B000000001', sponsored: false, brand: 'TREE.NB', price: 43.99,
      title: 'C41N1904 Battery for ASUS Zenbook 14 UX425 13 UX363EA UX325JA' },
    { asin: 'B000000002', sponsored: false, brand: 'Smatree', price: 70.6,
      title: 'Hard EVA Protective Sleeve Compatible for 14 inch ASUS Zenbook 14 UX425/UM425QA' },
    { asin: 'B000000003', sponsored: false, brand: 'Asus', price: 1499,
      title: 'ZenBook 14 Laptop (2025), 14” WUXGA OLED Touch, Intel Core Ultra 5' },
  ];
  expect(bestMatch(results, 'ASUS ZenBook 14 (UX425)')).toBeNull();
  expect(closestMatch(results, 'ASUS ZenBook 14 (UX425)').asin).toBe('B000000003');
});

test('a listing far cheaper than the usual price is skipped as a part', async () => {
  const page = html.split('549.99').join('49.99');
  const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: async () => page });
  const laptop = parseResults(html)[2];
  const out = await resolveLink({ title: laptop.title.split(',')[0], typicalPriceCad: 550,
                                  url: 'https://www.amazon.ca/s?k=laptop' }, fetchImpl);
  expect(out.url).not.toBe(`https://www.amazon.ca/dp/${laptop.asin}`);
});

test('no product name, no lookup', async () => {
  const fetchImpl = jest.fn();
  const alt = { title: null, url: 'https://www.amazon.ca/s?k=null' };
  expect(await resolveLink(alt, fetchImpl)).toBe(alt);
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('the same pick resolves once and shows the same listing every time', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: true, text: async () => html });
  const laptop = parseResults(html)[2];
  const alt = () => ({ title: laptop.title.split(',')[0], url: 'https://www.amazon.ca/s?k=laptop' });

  const first = await resolveLink(alt(), fetchImpl);
  const second = await resolveLink(alt(), fetchImpl);
  expect(second).toEqual(first);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});
