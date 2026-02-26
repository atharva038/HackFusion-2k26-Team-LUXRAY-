import { openai } from '../config/openai.js';

const MAX_TEXT_LENGTH = 700;

/**
 * POST /api/tts
 * Generates speech audio from text using OpenAI TTS (SDK).
 * Returns audio/mpeg binary. No streaming.
 */
export const generateSpeech = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.` });
    }

    console.log(`[TTS] Generating speech for ${text.length} chars...`);

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text.trim(),
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    console.log(`[TTS] Success — ${buffer.length} bytes`);

    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', String(buffer.length));
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
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.` });
    }

    console.log(`[TTS-Stream] Generating speech for ${text.length} chars...`);

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text.trim(),
      response_format: 'mp3',
    });

    // Set streaming headers
    res.set('Content-Type', 'audio/mpeg');
    res.set('Transfer-Encoding', 'chunked');
    res.set('Cache-Control', 'no-cache');
    res.set('Connection', 'keep-alive');

    // Pipe the OpenAI response body (ReadableStream) directly to our response
    const nodeStream = response.body;

    // Handle client disconnect
    req.on('close', () => {
      console.log('[TTS-Stream] Client disconnected');
      if (nodeStream && typeof nodeStream.destroy === 'function') {
        nodeStream.destroy();
      }
    });

    // Pipe OpenAI stream → Express response
    let totalBytes = 0;
    for await (const chunk of nodeStream) {
      totalBytes += chunk.length;
      res.write(chunk);
    }

    console.log(`[TTS-Stream] Done — ${totalBytes} bytes streamed`);
    res.end();
  } catch (err) {
    console.error('[TTS-Stream] Error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate speech stream.' });
    } else {
      res.end();
    }
  }
};
