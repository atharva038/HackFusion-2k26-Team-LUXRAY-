import { openai } from '../config/openai.js';
import logger from '../utils/logger.js';

/**
 * Supported languages and their metadata.
 */
export const SUPPORTED_LANGUAGES = {
    en: { label: 'English', sttCode: 'en-US', ttsVoice: 'nova' },
    hi: { label: 'Hindi', sttCode: 'hi-IN', ttsVoice: 'nova' },
    mr: { label: 'Marathi', sttCode: 'mr-IN', ttsVoice: 'nova' },
};

/**
 * Medical-safe translation system prompt.
 * Preserves medicine names, dosage units, brand names, numbers, and dates.
 */
const TRANSLATION_SYSTEM_PROMPT = `You are a precise medical translator. Your ONLY job is to translate the user's text.

CRITICAL SAFETY RULES — violations could harm patients:
• NEVER change numbers (quantities, dosages, prices)
• NEVER translate medicine/drug names — keep them exactly as-is (e.g. Amlodipine, Paracetamol)
• NEVER translate brand names
• NEVER change dosage units: mg, ml, mcg, strips, tablets, capsules — keep them in English
• NEVER translate structured JSON or code
• Preserve date formats exactly
• Maintain a calm, professional healthcare tone
• If a term is ambiguous, prefer the original medical term

OUTPUT: Return ONLY the translated text. No explanations, no quotes, no markdown.`;

/**
 * translateToEnglish — Translates user input from a source language to English.
 * If the source language is English, returns the text unchanged.
 *
 * @param {string} text - The text to translate
 * @param {string} sourceLanguage - Language code ('en', 'hi', 'mr')
 * @returns {Promise<{translatedText: string, originalText: string, latencyMs: number}>}
 */
export async function translateToEnglish(text, sourceLanguage) {
    if (!text || sourceLanguage === 'en') {
        return { translatedText: text, originalText: text, latencyMs: 0 };
    }

    const langLabel = SUPPORTED_LANGUAGES[sourceLanguage]?.label || sourceLanguage;
    const start = Date.now();

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.1,
            max_tokens: 500,
            messages: [
                { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
                { role: 'user', content: `Translate the following ${langLabel} text to English:\n\n${text}` },
            ],
        });

        const translatedText = response.choices[0]?.message?.content?.trim() || text;
        const latencyMs = Date.now() - start;

        logger.info(`[Multilingual] ${langLabel} → English in ${latencyMs}ms: "${text.substring(0, 50)}…" → "${translatedText.substring(0, 50)}…"`);

        return { translatedText, originalText: text, latencyMs };
    } catch (err) {
        logger.error(`[Multilingual] translateToEnglish failed:`, err.message);
        // Fallback: send original text to agent (best-effort)
        return { translatedText: text, originalText: text, latencyMs: Date.now() - start };
    }
}

/**
 * translateFromEnglish — Translates agent English response to the target language.
 * If the target language is English, returns the text unchanged.
 *
 * @param {string} text - The English text to translate
 * @param {string} targetLanguage - Language code ('en', 'hi', 'mr')
 * @returns {Promise<{translatedText: string, originalText: string, latencyMs: number}>}
 */
export async function translateFromEnglish(text, targetLanguage) {
    if (!text || targetLanguage === 'en') {
        return { translatedText: text, originalText: text, latencyMs: 0 };
    }

    const langLabel = SUPPORTED_LANGUAGES[targetLanguage]?.label || targetLanguage;
    const start = Date.now();

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.1,
            max_tokens: 1000,
            messages: [
                { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
                { role: 'user', content: `Translate the following English text to ${langLabel}:\n\n${text}` },
            ],
        });

        const translatedText = response.choices[0]?.message?.content?.trim() || text;
        const latencyMs = Date.now() - start;

        logger.info(`[Multilingual] English → ${langLabel} in ${latencyMs}ms: "${text.substring(0, 50)}…" → "${translatedText.substring(0, 50)}…"`);

        return { translatedText, originalText: text, latencyMs };
    } catch (err) {
        logger.error(`[Multilingual] translateFromEnglish failed:`, err.message);
        // Fallback: return English response (better than nothing)
        return { translatedText: text, originalText: text, latencyMs: Date.now() - start };
    }
}

/**
 * Get the TTS voice for a given language code.
 * @param {string} language - Language code ('en', 'hi', 'mr')
 * @returns {string} - OpenAI TTS voice name
 */
export function getTTSVoice(language) {
    return SUPPORTED_LANGUAGES[language]?.ttsVoice || 'nova';
}
