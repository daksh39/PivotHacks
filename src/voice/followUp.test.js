import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceButton from '../components/VoiceButton';
import { useVoiceLookup } from './useVoiceLookup';

function Harness() {
  const v = useVoiceLookup();
  return (
    <>
      <VoiceButton state={v.state} transcript={v.transcript} error={v.error}
                   onStart={v.start} onStop={v.stop} onSubmitText={v.submitText} />
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

test('context with no product and nothing before it asks what they are shopping for', async () => {
  global.fetch = jest.fn().mockResolvedValue(needsProduct);
  render(<Harness />);

  await type("i dont have a car");

  expect(screen.getByText(/What are you shopping for\?/)).toBeInTheDocument();
  expect(screen.getByTestId('title')).toHaveTextContent('');   // nothing invented
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
