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
