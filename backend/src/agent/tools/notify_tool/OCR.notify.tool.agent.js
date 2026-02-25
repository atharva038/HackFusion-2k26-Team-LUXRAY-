// agent/tools/ocr.tool.js
import { tool } from '@openai/agents';
import { Mistral } from '@mistralai/mistralai';
import { z } from 'zod';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export const ocrTool = tool({
    name: 'extract_text_from_url',
    description: 'Downloads an image from a Cloudinary URL and extracts text.',
    parameters: z.object({
        imageUrl: z.string().describe("The secure Cloudinary URL of the prescription"),
    }),
    execute: async ({ imageUrl }) => {
        try {
            // 1. Fetch image using native Node.js fetch
            const response = await fetch(imageUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            // 2. Convert response to arrayBuffer and then to Base64
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUri = `data:image/png;base64,${base64Data}`;

            // 3. Send to Mistral OCR
            const ocrResponse = await mistral.ocr.process({
                model: "mistral-ocr-latest",
                document: {
                    type: "image_url",
                    imageUrl: dataUri,
                },
            });

            return ocrResponse.pages.map(p => p.markdown).join('\n');
        } catch (error) {
            console.error("OCR Tool Error:", error.message);
            return `Error extracting text: ${error.message}`;
        }
    },
});