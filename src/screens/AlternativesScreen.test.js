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
