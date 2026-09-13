import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceButton from '../components/VoiceButton';
import { useVoiceLookup, describeError } from './useVoiceLookup';

/* A stand-in MediaRecorder: records nothing, emits one chunk on stop. */
class FakeRecorder {
  constructor(stream) { this.stream = stream; this.state = 'inactive'; }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    this.onstop();
  }
}

function Harness() {
  const voice = useVoiceLookup();
  return (
    <>
      <VoiceButton state={voice.state} transcript={voice.transcript} error={voice.error}
                   onStart={voice.start} onStop={voice.stop} onSubmitText={voice.submitText} />
      <div data-testid="category">{voice.result ? voice.result.product.category : ''}</div>
    </>
  );
}

const track = { stop: jest.fn() };

beforeEach(() => {
  global.MediaRecorder = FakeRecorder;
  global.chrome = { runtime: { openOptionsPage: jest.fn() } };
  Object.defineProperty(global.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [track] }) },
  });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      transcript: 'I need a mini fridge for my dorm',
      result: { product: { category: 'mini-fridge' } },
    }),
  });
});

test('shows the idle prompt', () => {
  render(<Harness />);
  expect(screen.getByRole('button')).toHaveTextContent("Tell Verte what you're buying");
});

test('speaking drives a real lookup: listening → thinking → result', async () => {
  render(<Harness />);

  await act(async () => { fireEvent.click(screen.getByRole('button')); });
  expect(screen.getByRole('button')).toHaveTextContent('Listening… tap to stop');

  await act(async () => { fireEvent.click(screen.getByRole('button')); });

  await waitFor(() => expect(screen.getByTestId('category')).toHaveTextContent('mini-fridge'));
  expect(screen.getByText(/You said: “I need a mini fridge for my dorm”/)).toBeInTheDocument();
  expect(track.stop).toHaveBeenCalled();                                   // mic released

  const [url, init] = global.fetch.mock.calls[0];
  expect(url).toMatch(/\/voice$/);
  expect(init.headers['content-type']).toBe('audio/webm');
});

test('denied permission explains itself and opens the options page', async () => {
  navigator.mediaDevices.getUserMedia.mockRejectedValue(Object.assign(new Error('x'), { name: 'NotAllowedError' }));
  render(<Harness />);

  await act(async () => { fireEvent.click(screen.getByRole('button')); });

  expect(screen.getByText(/Microphone access is needed/)).toBeInTheDocument();
  expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
});

test('error messages are plain English', () => {
  expect(describeError({ status: 422 })).toMatch("Didn't catch that");
  expect(describeError({ offline: true })).toMatch('npm run proxy');
  expect(describeError({ status: 503 })).toMatch('OpenAI key');
});

test('with nothing underneath, the voice bar drops its divider', () => {
  const { container } = render(
    <VoiceButton standalone state="idle" transcript="" error=""
                 onStart={() => {}} onStop={() => {}} onSubmitText={() => {}} />
  );
  expect(container.firstChild).toHaveClass('voice--standalone');
});
