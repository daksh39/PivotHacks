import { render, screen } from '@testing-library/react';
import AlternativesScreen from './AlternativesScreen';

const pick = {
  source: 'ai', title: 'Dyson Supersonic Hair Dryer',
  why: 'A digital motor dries hair faster, so it runs for less time.',
  co2SavingKgPerYear: null, url: 'https://www.amazon.com/s?k=Dyson+Supersonic', estimated: true,
};

const base = {
  product: { title: 'Find me a hairdryer.' },
  guidance: { category: 'other', co2Source: '', note: '' },
  embodiedCo2Kg: null,
};

test('when a category has few lower-carbon options, it says why and still gives a pick', () => {
  render(<AlternativesScreen result={{
    ...base,
    alternatives: [pick],
    scarcityReason: 'Most hairdryers use similar power, so models differ little.',
  }} />);

  expect(screen.getByText('Not many lower-carbon options')).toBeInTheDocument();
  expect(screen.getByText('Most hairdryers use similar power, so models differ little.')).toBeInTheDocument();
  expect(screen.getByText("Here's the best pick we found.")).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Dyson Supersonic Hair Dryer' })).toHaveAttribute('href', pick.url);
  expect(screen.queryByText('No lower-carbon option found')).not.toBeInTheDocument();
});

test('with real alternatives and no reason, it keeps the normal heading', () => {
  render(<AlternativesScreen result={{ ...base, alternatives: [pick], scarcityReason: null }} />);
  expect(screen.getByText('Lower-carbon options')).toBeInTheDocument();
  expect(screen.queryByText('Not many lower-carbon options')).not.toBeInTheDocument();
});

test('shows the context that shaped the picks, with each pick\'s price and fit', () => {
  render(<AlternativesScreen result={{
    ...base,
    scarcityReason: null,
    contextTags: ['under $500', 'by friday', 'no car'],
    alternatives: [{ ...pick, title: 'Acer Aspire 5', url: 'https://www.amazon.com/s?k=Acer',
                     typicalPriceCad: 499, fitsContext: 'Affordable and widely available' }],
  }} />);
  expect(screen.getByText('Recommended for: under $500 · by friday · no car')).toBeInTheDocument();
  expect(screen.getByText('~CA$499 · Affordable and widely available')).toBeInTheDocument();
});

test('no context, no context line', () => {
  render(<AlternativesScreen result={{ ...base, alternatives: [pick], scarcityReason: null }} />);
  expect(screen.queryByText(/Recommended for/)).not.toBeInTheDocument();
});

test('university essentials show every item, with a pick or an honest gap', () => {
  render(<AlternativesScreen result={{
    kind: 'essentials',
    product: { title: 'university essentials' },
    contextTags: ['under CA$200'],
    essentials: [
      { item: 'Kettle', alternative: { ...pick, title: 'Hamilton Beach Kettle', url: 'https://www.amazon.ca/dp/B000000001',
                                       livePrice: 39.99, typicalPriceCad: 45 } },
      { item: 'Laptop', alternative: null },
    ],
  }} />);

  expect(screen.getByText('University essentials')).toBeInTheDocument();
  expect(screen.getByText('Recommended for: under CA$200')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Hamilton Beach Kettle' }))
    .toHaveAttribute('href', 'https://www.amazon.ca/dp/B000000001');
  expect(screen.getByText('CA$39.99')).toBeInTheDocument();          // the real price wins
  expect(screen.getByText('Laptop')).toBeInTheDocument();
  expect(screen.getByText('No pick found that fits.')).toBeInTheDocument();
});
