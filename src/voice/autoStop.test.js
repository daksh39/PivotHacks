import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceButton from '../components/VoiceButton';
import { useVoiceLookup } from './useVoiceLookup';

// Capture the callback the hook gives the silence watcher, so the test can
// play the part of the microphone going quiet.
let endSpeech;
jest.mock('./silence', () => ({
  watchForSilence: (_stream, onEnd) => { endSpeech = onEnd; return () => {}; },
}));

class FakeRecorder {
  constructor() { this.state = 'inactive'; }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable({ data: new Blob(['audio'], { type: 'audio/webm' }) });
    this.onstop();
  }
}

function Harness() {
  const v = useVoiceLookup();
  return <VoiceButton state={v.state} transcript={v.transcript} error={v.error}
                      onStart={v.start} onStop={v.stop} onSubmitText={v.submitText} />;
}

beforeEach(() => {
  global.MediaRecorder = FakeRecorder;
  global.chrome = { runtime: { openOptionsPage: jest.fn() } };
  Object.defineProperty(global.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] }) },
  });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ transcript: 'a laptop for college', result: { product: { category: 'laptop' } } }),
  });
});

test('stops by itself when the person stops talking, then looks it up', async () => {
  render(<Harness />);
  await act(async () => { fireEvent.click(screen.getByRole('button')); });
  expect(screen.getByRole('button')).toHaveTextContent('Listening');

  await act(async () => { endSpeech('speech-ended'); });   // no button press

  await waitFor(() => expect(screen.getByText(/You said: “a laptop for college”/)).toBeInTheDocument());
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('if nothing was said, it stops without sending anything', async () => {
  render(<Harness />);
  await act(async () => { fireEvent.click(screen.getByRole('button')); });

  await act(async () => { endSpeech('no-speech'); });

  expect(screen.getByText("Didn't hear anything — try again.")).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
