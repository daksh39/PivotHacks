import { render, screen } from '@testing-library/react';
import VerteHeader from './VerteHeader';

test('renders the Verte wordmark', () => {
  render(<VerteHeader isSmall={true} />);
  expect(screen.getByText('Verte')).toBeInTheDocument();
});
