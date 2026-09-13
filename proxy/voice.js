/* ---------------------------------------------------------------------------
 * Speech to text for the voice workflow.
 *
 * The popup records audio and posts it here; this sends it to OpenAI's
 * transcription endpoint. The key stays on this side — it never ships in the
 * extension bundle.
 * ------------------------------------------------------------------------- */

class VoiceError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const EXTENSION = { 'audio/webm': 'webm', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mpeg': 'mp3',
                    'audio/mp4': 'm4a', 'audio/ogg': 'ogg' };

/**
 * @param {Buffer} buffer    raw audio
 * @param {string} mimeType  e.g. "audio/webm;codecs=opus"
 * @returns {Promise<string>} the transcript, trimmed
 */
async function transcribe(buffer, mimeType = 'audio/webm') {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new VoiceError('Voice needs OPENAI_API_KEY in .env', 503);
  if (!buffer || !buffer.length) throw new VoiceError('No audio received', 400);

  const type = String(mimeType).split(';')[0].trim() || 'audio/webm';
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), `speech.${EXTENSION[type] || 'webm'}`);
  form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1');
  form.append('language', 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.warn(`[verte] transcription HTTP ${response.status}: ${detail.slice(0, 200)}`);
    throw new VoiceError('Transcription failed', 502);
  }

  const data = await response.json();
  return String(data.text || '').trim();
}

/* Whisper fills silence with stock phrases rather than returning nothing.
 * Treat those, and anything too short to name a product, as not heard. */
const SILENCE_PHRASES = new Set([
  'you', 'thank you', 'thanks', 'thank you for watching', 'thanks for watching',
  'bye', 'okay', 'ok', 'um', 'uh', 'hmm', 'so',
]);

function isHeard(transcript) {
  const words = String(transcript || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  if (!words || words.length < 3) return false;
  return !SILENCE_PHRASES.has(words.replace(/\s+/g, ' '));
}

module.exports = { transcribe, isHeard, VoiceError };
