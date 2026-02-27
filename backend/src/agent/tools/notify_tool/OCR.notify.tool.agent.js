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
            
            const response = await fetch(imageUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            
            const mimeType = contentType.split(';')[0].trim() || 'image/jpeg';
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUri = `data:${mimeType};base64,${base64Data}`;

            // 3. Send to Mistral OCR
            const ocrResponse = await mistral.ocr.process({
                model: "mistral-ocr-latest",
                document: {
                    type: "image_url",
                    imageUrl: dataUri,
                },
            });
            console.log("this is ocrtool extract: ", ocrResponse.pages.map(p => p.markdown).join('\n'));
            return ocrResponse.pages.map(p => p.markdown).join('\n');
        } catch (error) {
            console.error("OCR Tool Error:", error.message);
            return `Error extracting text: ${error.message}`;
        }
    },
});