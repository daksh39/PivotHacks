import { render, screen, fireEvent } from '@testing-library/react';
import Essentials from './Essentials';

test('one button asks for the whole set of university essentials', () => {
  const onShowAll = jest.fn();
  render(<Essentials standing="" onShowAll={onShowAll} onClearStanding={() => {}} />);

  expect(screen.getAllByRole('button')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'University essentials' }));
  expect(onShowAll).toHaveBeenCalledTimes(1);
});

test('shows the standing context and clears it', () => {
  const onClear = jest.fn();
  render(<Essentials standing="under $200" onShowAll={() => {}} onClearStanding={onClear} />);

  expect(screen.getByText('under $200')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear “under $200”' }));
  expect(onClear).toHaveBeenCalled();
});

test('the button is disabled while a lookup is running', () => {
  render(<Essentials standing="" onShowAll={() => {}} onClearStanding={() => {}} busy />);
  expect(screen.getByRole('button', { name: 'University essentials' })).toBeDisabled();
});
