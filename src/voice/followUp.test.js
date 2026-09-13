import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceButton from '../components/VoiceButton';
import Essentials from '../components/Essentials';
import { useVoiceLookup } from './useVoiceLookup';

function Harness() {
  const v = useVoiceLookup();
  return (
    <>
      <VoiceButton state={v.state} transcript={v.transcript} error={v.error}
                   onStart={v.start} onStop={v.stop} onSubmitText={v.submitText}>
        <Essentials standing={v.standing} onShowAll={v.showEssentials} onClearStanding={v.clearStanding} />
      </VoiceButton>
      <div data-testid="title">{v.result ? v.result.product.title : ''}</div>
    </>
  );
}

const ok = (title) => ({ ok: true, json: async () => ({ product: { title } }) });
const needsProduct = { ok: false, status: 422, json: async () => ({ error: 'No product named', code: 'needs-product' }) };

async function type(text) {
  const input = screen.getByLabelText("Type what you're buying");
  fireEvent.change(input, { target: { value: text } });
  await act(async () => { fireEvent.submit(input.closest('form')); });
}

const sentTitles = () => global.fetch.mock.calls.map(([, init]) => JSON.parse(init.body).product.title);

test('context on its own is kept and shown, and nothing is invented', async () => {
  global.fetch = jest.fn().mockResolvedValue(needsProduct);
  render(<Harness />);

  await type('under $200');

  expect(screen.getByText('under $200')).toBeInTheDocument();          // standing context pill
  expect(screen.getByTestId('title')).toHaveTextContent('');           // no product invented
  expect(screen.queryByText(/What are you shopping for/)).not.toBeInTheDocument();
});

test('the essentials button asks for the whole set, with the standing context', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(needsProduct)
    .mockResolvedValueOnce(ok('university essentials, under $200'));
  render(<Harness />);

  await type('under $200');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'University essentials' })); });

  await waitFor(() => expect(screen.getByTestId('title')).toHaveTextContent('university essentials'));
  expect(sentTitles()[1]).toBe('university essentials, under $200');
});

test('clearing the context stops applying it', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(needsProduct)
    .mockResolvedValueOnce(ok('university essentials'));
  render(<Harness />);

  await type('under $200');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Clear “under $200”' })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'University essentials' })); });

  await waitFor(() => expect(sentTitles()[1]).toBe('university essentials'));
});

test('context said after a product refines that product', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(ok('a laptop for college'))
    .mockResolvedValueOnce(needsProduct)
    .mockResolvedValueOnce(ok("a laptop for college, i dont have a car"));
  render(<Harness />);

  await type('a laptop for college');
  await type("i dont have a car");

  await waitFor(() => expect(screen.getByTestId('title')).toHaveTextContent("a laptop for college, i dont have a car"));
  expect(sentTitles()).toEqual(['a laptop for college', 'i dont have a car', 'a laptop for college, i dont have a car']);
  expect(screen.getByText('You said: “i dont have a car”')).toBeInTheDocument();
});
