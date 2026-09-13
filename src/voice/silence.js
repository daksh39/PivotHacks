/*
 * End-of-speech detection for the voice bar.
 *
 * Recording stops on its own once the person stops talking, so nobody has to
 * reach back for the button. Split in two so the decision logic can be tested
 * without a microphone:
 *
 *   createSilenceDetector  pure — fed a loudness level and a timestamp,
 *                          answers whether speech has ended
 *   watchForSilence        wires a real mic stream into the detector via the
 *                          Web Audio API
 */

export const SILENCE_MS = 1200;     // this long quiet after speaking = done
export const NO_SPEECH_MS = 6000;   // nothing said at all within this = give up
const CALIBRATE_MS = 250;           // first moments measure the room's noise
const MIN_THRESHOLD = 0.015;        // RMS; floor so a silent room still counts as quiet

/**
 * @returns {{ push(level: number, now: number): null|'speech-ended'|'no-speech' }}
 */
export function createSilenceDetector({
  silenceMs = SILENCE_MS,
  noSpeechMs = NO_SPEECH_MS,
  calibrateMs = CALIBRATE_MS,
  minThreshold = MIN_THRESHOLD,
} = {}) {
  let startedAt = null;
  let noiseFloor = 0;
  let samples = 0;
  let heardSpeech = false;
  let quietSince = null;
  let done = false;

  return {
    push(level, now) {
      if (done) return null;
      if (startedAt === null) startedAt = now;

      // Learn the background level first, so a noisy venue doesn't read as
      // someone still talking.
      if (now - startedAt < calibrateMs) {
        noiseFloor = (noiseFloor * samples + level) / (samples + 1);
        samples += 1;
        return null;
      }

      const threshold = Math.max(minThreshold, noiseFloor * 2.5);

      if (level > threshold) {
        heardSpeech = true;
        quietSince = null;
        return null;
      }

      if (!heardSpeech) {
        if (now - startedAt >= noSpeechMs) {
          done = true;
          return 'no-speech';
        }
        return null;
      }

      if (quietSince === null) quietSince = now;
      if (now - quietSince >= silenceMs) {
        done = true;
        return 'speech-ended';
      }
      return null;
    },
  };
}

/**
 * Watches a live mic stream and calls `onEnd('speech-ended' | 'no-speech')`
 * once. Returns a cleanup function. Where the Web Audio API is missing it
 * does nothing, and the manual button and the hard time cap still apply.
 */
export function watchForSilence(stream, onEnd, options) {
  const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AudioCtx) return () => {};

  const context = new AudioCtx();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);

  const detector = createSilenceDetector(options);
  const buffer = new Float32Array(analyser.fftSize);

  const interval = setInterval(() => {
    analyser.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
    const verdict = detector.push(Math.sqrt(sum / buffer.length), Date.now());
    if (verdict) {
      cleanup();
      onEnd(verdict);
    }
  }, 50);

  function cleanup() {
    clearInterval(interval);
    source.disconnect();
    context.close().catch(() => {});
  }

  return cleanup;
}
