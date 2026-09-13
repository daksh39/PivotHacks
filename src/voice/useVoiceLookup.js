/*global chrome*/
import { useCallback, useEffect, useRef, useState } from 'react';
import { ENDPOINTS } from '../config';
import { watchForSilence } from './silence';
import { withExactLinks } from '../lib/amazonLinks';

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
  // Context said on its own ("under $200") that keeps applying to everything
  // asked next, including the university essentials, until cleared.
  const [standing, setStandingState] = useState('');
  const standingRef = useRef('');
  const setStanding = useCallback((value) => {
    standingRef.current = value;
    setStandingState(value);
  }, []);
  const discard = useRef(false);
  // Only the newest answer may be upgraded with exact links.
  const shown = useRef(0);

  /* Show the answer straight away with search links, then swap in exact
   * product pages as they resolve. */
  const show = useCallback((body) => {
    const id = ++shown.current;
    setResult(body);
    withExactLinks(body)
      .then((exact) => { if (id === shown.current) setResult(exact); })
      .catch(() => {});   // the search links already on screen still work
  }, []);

  const fail = useCallback((err) => {
    setError(describeError(err));
    setState('error');
    if (err && err.name === 'NotAllowedError' && typeof chrome !== 'undefined' && chrome.runtime) {
      // A popup can't show the permission prompt; the options page can.
      chrome.runtime.openOptionsPage();
    }
  }, []);

  const lookupText = useCallback(async (request, heard) => {
    const extra = standingRef.current;
    const title = extra && !request.includes(extra) ? `${request}, ${extra}` : request;
    setState('thinking');
    const body = await post(ENDPOINTS.lookup, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        product: { title, price: null, currency: 'CAD', category: '', imageUrl: null,
                   sourceUrl: 'https://www.amazon.ca/', spoken: true },
      }),
    });
    // "University essentials" isn't a product later context can refine.
    lastRequest.current = body.kind === 'essentials' ? '' : title;
    setTranscript(heard);
    show(body);
    setState('done');
  }, [show]);

  /* Context on its own ("under $500", "I don't have a car") refines the last
   * product when there is one; with nothing to refine, the user is asked. */
  const refineOrAsk = useCallback(async (err, heard) => {
    if (err.code !== 'needs-product') throw err;

    // Context on its own becomes standing context either way.
    const extra = standingRef.current ? `${standingRef.current}, ${heard}` : heard;
    setStanding(extra);

    if (lastRequest.current) {
      const product = lastRequest.current.split(', ')[0];
      return lookupText(`${product}, ${extra}`, heard);
    }
    // Nothing to refine yet: keep it, and let the essentials use it.
    setTranscript(heard);
    setResult(null);
    setState('idle');
  }, [lookupText, setStanding]);

  /* University essentials: one tap shows the whole set, one pick per item. */
  const showEssentials = useCallback(async () => {
    setError('');
    setTranscript('University essentials');
    try {
      await lookupText('university essentials', 'University essentials');
    } catch (err) {
      fail(err);
    }
  }, [fail, lookupText]);

  const clearStanding = useCallback(() => setStanding(''), [setStanding]);

  const send = useCallback(async (blob) => {
    setState('thinking');
    try {
      let body;
      try {
        const headers = { 'content-type': blob.type || 'audio/webm' };
        if (standingRef.current) headers['x-verte-context'] = standingRef.current;
        body = await post(ENDPOINTS.voice, {
          method: 'POST',
          headers,
          body: blob,
        });
      } catch (err) {
        if (err.transcript) setTranscript(err.transcript);
        return await refineOrAsk(err, err.transcript || '');
      }
      lastRequest.current = body.result && body.result.kind === 'essentials' ? '' : body.transcript;
      setTranscript(body.transcript);
      show(body.result);
      setState('done');
    } catch (err) {
      fail(err);
    }
  }, [fail, refineOrAsk, show]);

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

  return { state, transcript, result, error, start, stop, submitText, standing, clearStanding, showEssentials };
}
