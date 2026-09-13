import { createSilenceDetector } from './silence';

/* Feeds the detector a level every 50ms, like the real mic loop. */
function run(detector, segments) {
  let now = 0;
  for (const [level, ms] of segments) {
    for (let t = 0; t < ms; t += 50) {
      const verdict = detector.push(level, now);
      now += 50;
      if (verdict) return { verdict, at: now };
    }
  }
  return { verdict: null, at: now };
}

const QUIET = 0.002;
const TALKING = 0.12;

test('ends shortly after the person stops talking', () => {
  const { verdict, at } = run(createSilenceDetector(), [
    [QUIET, 300], [TALKING, 1500], [QUIET, 3000],
  ]);
  expect(verdict).toBe('speech-ended');
  expect(at).toBeGreaterThanOrEqual(300 + 1500 + 1200);
  expect(at).toBeLessThan(300 + 1500 + 1500);
});

test('a short pause between words does not end it', () => {
  const { verdict } = run(createSilenceDetector(), [
    [QUIET, 300], [TALKING, 800], [QUIET, 600], [TALKING, 800],
  ]);
  expect(verdict).toBeNull();
});

test('gives up when nothing is said at all', () => {
  const { verdict, at } = run(createSilenceDetector(), [[QUIET, 10000]]);
  expect(verdict).toBe('no-speech');
  expect(at).toBeLessThanOrEqual(6100);
});

test('a noisy room is not mistaken for someone still talking', () => {
  const NOISE = 0.03;   // above the fixed floor, so only calibration saves it
  const { verdict } = run(createSilenceDetector(), [
    [NOISE, 300], [TALKING, 1000], [NOISE, 2000],
  ]);
  expect(verdict).toBe('speech-ended');
});

test('reports only once', () => {
  const detector = createSilenceDetector();
  run(detector, [[QUIET, 300], [TALKING, 500], [QUIET, 1500]]);
  expect(detector.push(QUIET, 99999)).toBeNull();
});
