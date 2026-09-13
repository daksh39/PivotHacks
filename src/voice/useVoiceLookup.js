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
  if (error.code === 'needs-product') return 'What are you shopping for? Try “a laptop, I don’t have a car”.';
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
  if (!response.ok) {
    throw Object.assign(new Error(body.error || `HTTP ${response.status}`), {
      status: response.status, code: body.code, transcript: body.transcript,
    });
  }
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
  // The last thing successfully looked up, so "I don't have a car" said next
  // refines that product instead of starting from nothing.
  const lastRequest = useRef('');
  const discard = useRef(false);

  const fail = useCallback((err) => {
    setError(describeError(err));
    setState('error');
    if (err && err.name === 'NotAllowedError' && typeof chrome !== 'undefined' && chrome.runtime) {
      // A popup can't show the permission prompt; the options page can.
      chrome.runtime.openOptionsPage();
    }
  }, []);

  const lookupText = useCallback(async (title, heard) => {
    setState('thinking');
    const body = await post(ENDPOINTS.lookup, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        product: { title, price: null, currency: 'USD', category: '', imageUrl: null,
                   sourceUrl: 'https://www.amazon.com/', spoken: true },
      }),
    });
    lastRequest.current = title;
    setTranscript(heard);
    setResult(body);
    setState('done');
  }, []);

  /* Context on its own ("under $500", "I don't have a car") refines the last
   * product when there is one; with nothing to refine, the user is asked. */
  const refineOrAsk = useCallback(async (err, heard) => {
    if (err.code === 'needs-product' && lastRequest.current) {
      return lookupText(`${lastRequest.current}, ${heard}`, heard);
    }
    throw err;
  }, [lookupText]);

  const send = useCallback(async (blob) => {
    setState('thinking');
    try {
      let body;
      try {
        body = await post(ENDPOINTS.voice, {
          method: 'POST',
          headers: { 'content-type': blob.type || 'audio/webm' },
          body: blob,
        });
      } catch (err) {
        if (err.transcript) setTranscript(err.transcript);
        return await refineOrAsk(err, err.transcript || '');
      }
      lastRequest.current = body.transcript;
      setTranscript(body.transcript);
      setResult(body.result);
      setState('done');
    } catch (err) {
      fail(err);
    }
  }, [fail, refineOrAsk]);

  const submitText = useCallback(async (text) => {
    const title = String(text || '').trim();
    if (!title) return;
    setError('');
    setTranscript(title);
    try {
      try {
        await lookupText(title, title);
      } catch (err) {
        await refineOrAsk(err, title);
      }
    } catch (err) {
      fail(err);
    }
  }, [fail, lookupText, refineOrAsk]);

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

  useEffect(() => () => {
    clearTimeout(timer.current);
    stopWatching.current();
    if (recorder.current && recorder.current.state === 'recording') recorder.current.stop();
  }, []);

  return { state, transcript, result, error, start, stop, submitText };
}
