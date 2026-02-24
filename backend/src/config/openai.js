const { OpenAI } = require('openai');

/**
 * Singleton OpenAI client configured from environment variables.
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = { openai };
