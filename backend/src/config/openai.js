import { OpenAI  } from 'openai';

/**
 * Singleton OpenAI client configured from environment variables.
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { openai };
