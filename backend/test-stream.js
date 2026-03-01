import https from 'http'; // local dev server
import fs from 'fs';

const TEST_TOKEN = process.argv[2] || ''; // Pass a valid token here
const BASE_URL = 'http://localhost:5000/api';

const prompts = [
    // Simple info queries (Parent Agent Native)
    { lang: 'en', message: 'Hi! What medicines do you have for a headache?' },
    // Missing info order query (Order Agent - Missing info prompt)
    { lang: 'mr', message: 'मला एक पॅरासिटामोल पाहिजे' },
    // Complete order query (Order Agent -> Tool Call)
    { lang: 'hi', message: 'मैं 35 साल की महिला हूँ, मुझे 10 पैरासिटामोल की गोलियां चाहिए जो मैं दिन में दो बार खा सकूं' },
    // Prescription required query (Order Agent -> Needs Prescription tool)
    { lang: 'en', message: 'Can I order Amoxicillin?' }
];

async function testStream(prompt) {
    console.log(`\n\n=== Testing [${prompt.lang.toUpperCase()}] ===`);
    console.log(`Prompt: "${prompt.message}"`);

    const startTime = Date.now();
    let firstByteTime = null;
    let chunkCount = 0;

    return new Promise((resolve) => {
        const postData = JSON.stringify({
            message: prompt.message,
            language: prompt.lang
        });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/chat/stream',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            res.on('data', (d) => {
                if (!firstByteTime) {
                    firstByteTime = Date.now();
                    console.log(`\n⏱️  Time To First Byte (TTFB): ${firstByteTime - startTime}ms`);
                }

                const text = d.toString();
                // Extract the value from the SSE format: data: {"value":"hello"}\n\n
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.value && !data.isCompleted) {
                                process.stdout.write(data.value);
                                chunkCount++;
                            } else if (data.isCompleted) {
                                console.log(`\n\n✅ Stream Finished. Total chunks: ${chunkCount}. Total time: ${Date.now() - startTime}ms`);
                                resolve();
                            }
                        } catch (e) {
                            // Ignore ping or malformed
                        }
                    }
                }
            });

            res.on('end', () => {
                // Fallback resolve if it disconnects early
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error('API Error:', error);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    if (!TEST_TOKEN) {
        console.log("⚠️ Please provide a valid JWT token as the first argument.");
        process.exit(1);
    }

    for (const prompt of prompts) {
        await testStream(prompt);
        // short delay between tests
        await new Promise(r => setTimeout(r, 1000));
    }
}

runTests();
