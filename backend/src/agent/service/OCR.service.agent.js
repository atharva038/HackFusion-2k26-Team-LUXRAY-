import fs from 'node:fs';
import path from 'node:path';

// const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export function getBase64Image(filePath) {
    const fileData = fs.readFileSync(filePath);
    const extension = path.extname(filePath).replace('.', '');

    return `data:image/${extension};base64,${fileData.toString('base64')}`;
}

    