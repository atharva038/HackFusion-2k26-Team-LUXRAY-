import { openai } from '../config/openai.js';
import { getTTSVoice } from '../services/multilingual.service.js';
import { getCachedTTS, setCachedTTS } from '../services/cache.service.js';

const MAX_TEXT_LENGTH = 1000;

/**
 * POST /api/tts
 * Generates speech audio from text using OpenAI TTS (SDK).
 * Returns audio/mpeg binary. No streaming.
 */
export const generateSpeech = async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.` });
    }

    const voice = getTTSVoice(language);

    // ── TTS Cache lookup ─────────────────────────────────────────
    const cachedBuffer = await getCachedTTS(language, text.trim());
    if (cachedBuffer) {
      console.log(`[TTS] CACHE HIT — ${cachedBuffer.length} bytes (lang=${language})`);
      res.set('Content-Type', 'audio/mpeg');
      res.set('Content-Length', String(cachedBuffer.length));
      res.set('X-Cache', 'HIT');
      return res.send(cachedBuffer);
    }

    console.log(`[TTS] Generating speech for ${text.length} chars (lang=${language}, voice=${voice})...`);

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text.trim(),
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    console.log(`[TTS] Success — ${buffer.length} bytes`);

    // ── TTS Cache store ──────────────────────────────────────────
    setCachedTTS(language, text.trim(), buffer);

    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', String(buffer.length));
    res.set('X-Cache', 'MISS');
    return res.send(buffer);
  } catch (err) {
    console.error('[TTS] Error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate speech.' });
    }
  }
};

/**
 * POST /api/tts/stream
 * Streams speech audio directly from OpenAI → client using chunked transfer.
 * Uses opus format for lower latency & smaller size.
 * The client can start playing as soon as the first chunk arrives.
 */
export const generateSpeechStream = async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.` });
    }

    const voice = getTTSVoice(language);

    // ── TTS Cache lookup (stream endpoint) ───────────────────────
    const cachedBuffer = await getCachedTTS(language, text.trim());
    if (cachedBuffer) {
      console.log(`[TTS-Stream] CACHE HIT — ${cachedBuffer.length} bytes (lang=${language})`);
      res.set('Content-Type', 'audio/mpeg');
      res.set('Transfer-Encoding', 'chunked');
      res.set('X-Cache', 'HIT');
      res.write(cachedBuffer);
      return res.end();
    }

    console.log(`[TTS-Stream] Generating speech for ${text.length} chars (lang=${language}, voice=${voice})...`);

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text.trim(),
      response_format: 'mp3',
    });

    // Set streaming headers
    res.set('Content-Type', 'audio/mpeg');
    res.set('Transfer-Encoding', 'chunked');
    res.set('Cache-Control', 'no-cache');
    res.set('Connection', 'keep-alive');
    res.set('X-Cache', 'MISS');

    // Pipe the OpenAI response body (ReadableStream) directly to our response
    const nodeStream = response.body;
    const chunks = [];

    // Handle client disconnect
    req.on('close', () => {
      console.log('[TTS-Stream] Client disconnected');
      if (nodeStream && typeof nodeStream.destroy === 'function') {
        nodeStream.destroy();
      }
    });

    // Collect chunks into buffer AND stream to client simultaneously
    let totalBytes = 0;
    for await (const chunk of nodeStream) {
      totalBytes += chunk.length;
      chunks.push(chunk);
      res.write(chunk);
    }

    console.log(`[TTS-Stream] Done — ${totalBytes} bytes streamed`);
    res.end();

    // ── TTS Cache store (fire-and-forget) ──────────────────────
    setCachedTTS(language, text.trim(), Buffer.concat(chunks));
  } catch (err) {
    console.error('[TTS-Stream] Error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate speech stream.' });
    } else {
      res.end();
    }
  }
};
