/*global chrome*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ENDPOINTS } from '../config';
import { watchForSilence } from './silence';

// Recording ends when the person stops talking; this is only a backstop.
const MAX_RECORDING_MS = 15000;

/*
 * Voice lookup: record what the user says they're buying, send it to the
 * proxy, get back { transcript, result }.
 *
 * States: idle → listening → thinking → done | error
 *
 * Listening ends by itself when the person stops speaking (see silence.js).
 *
 * Typed text goes through the same result path via `submitText`, as a safety
 * net for a venue where the mic won't cooperate.
 */
export function describeError(error) {
  if (!error) return '';
  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'Microphone access is needed. Allow it on the page that just opened, then try again.';
  }
  if (error.name === 'NotFoundError') return 'No microphone found.';
  if (error.status === 422) return "Didn't catch that — try again.";
  if (error.noSpeech) return "Didn't hear anything — try again.";
  if (error.status === 503) return 'Voice needs an OpenAI key in the proxy .env.';
  if (error.offline) return 'Verte is not connected. Start it with npm run proxy.';
  return error.message || 'Something went wrong. Try again.';
}

async function post(url, init) {
  let response;
  try {
    response = await fetch(url, init);
  } catch {
    throw Object.assign(new Error('offline'), { offline: true });
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || `HTTP ${response.status}`), { status: response.status });
  return body;
}

export function useVoiceLookup() {
  const [state, setState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const recorder = useRef(null);
  const timer = useRef(null);
  const stopWatching = useRef(() => {});
  const discard = useRef(false);

  const fail = useCallback((err) => {
    setError(describeError(err));
    setState('error');
    if (err && err.name === 'NotAllowedError' && typeof chrome !== 'undefined' && chrome.runtime) {
      // A popup can't show the permission prompt; the options page can.
      chrome.runtime.openOptionsPage();
    }
  }, []);

  const send = useCallback(async (blob) => {
    setState('thinking');
    try {
      const body = await post(ENDPOINTS.voice, {
        method: 'POST',
        headers: { 'content-type': blob.type || 'audio/webm' },
        body: blob,
      });
      setTranscript(body.transcript);
      setResult(body.result);
      setState('done');
    } catch (err) {
      fail(err);
    }
  }, [fail]);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    stopWatching.current();
    if (recorder.current && recorder.current.state === 'recording') recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError('');
    setTranscript('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      return fail(err);
    }

    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    rec.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    rec.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());   // release the mic
      if (discard.current) {
        // Nobody spoke. Don't spend a transcription call on silence.
        return fail(Object.assign(new Error('no speech'), { noSpeech: true }));
      }
      send(new Blob(chunks, { type: 'audio/webm' }));
    };

    discard.current = false;
    recorder.current = rec;
    rec.start();
    setState('listening');
    timer.current = setTimeout(stop, MAX_RECORDING_MS);

    stopWatching.current = watchForSilence(stream, (verdict) => {
      discard.current = verdict === 'no-speech';
      stop();
    });
  }, [fail, send, stop]);

  const submitText = useCallback(async (text) => {
    const title = String(text || '').trim();
    if (!title) return;
    setError('');
    setTranscript(title);
    setState('thinking');
    try {
      const body = await post(ENDPOINTS.lookup, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          product: { title, price: null, currency: 'USD', category: '', imageUrl: null,
                     sourceUrl: 'https://www.amazon.com/', spoken: true },
        }),
      });
      setResult(body);
      setState('done');
    } catch (err) {
      fail(err);
    }
  }, [fail]);

  useEffect(() => () => {
    clearTimeout(timer.current);
    stopWatching.current();
    if (recorder.current && recorder.current.state === 'recording') recorder.current.stop();
  }, []);

  return { state, transcript, result, error, start, stop, submitText };
}
