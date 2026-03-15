import { franc } from "franc";
import langs from "langs";
import { Agent, run } from "@openai/agents";

function detectLanguage(text) {
  // Use first 300 chars for speed; franc needs enough text to be accurate
  const code = franc((text || "").substring(0, 300));
  const lang = langs.where("3", code);
  return lang ? lang.name : "English";
}

export default async function enforceLanguage(inputText, outputText) {
  const inputLang = detectLanguage(inputText);
  console.log("[enforceLanguage] Detected input language:", inputLang);

  // If user wrote in English, no enforcement needed
  if (inputLang === "English" || inputLang === "und") {
    return outputText;
  }

  // For any non-English input, ALWAYS translate the full output —
  // don't check output language because mixed responses fool franc.
  const translator = new Agent({
    name: "Language_Enforcer",
    instructions: `
You are a translation assistant.
Translate the following text ENTIRELY into ${inputLang}.
Rules:
- Keep medicine names, brand names, and drug names in their original form (do not translate them).
- Keep Order ID, Invoice ID, Razorpay ID, and numeric values unchanged.
- Keep markdown formatting (**, *, |, -, #) intact.
- For key:value lines like "Order ID: abc123", only translate the key if appropriate, never the value.
- Return ONLY the translated text. No explanations.
    `.trim(),
  });

  try {
    const translation = await run(translator, [
      { role: "user", content: outputText },
    ]);
    return translation.finalOutput || outputText;
  } catch (err) {
    console.warn("[enforceLanguage] Translation failed, returning original:", err.message);
    return outputText;
  }
}
