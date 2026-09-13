import React from 'react';
import { render, screen } from '@testing-library/react';
import Options from './Options';

test('renders the Verte thesis', () => {
  render(<Options />);
  expect(
    screen.getByText(/the greenest product is the one that already exists/i)
  ).toBeInTheDocument();
});
