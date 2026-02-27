import { Agent, run } from '@openai/agents';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/atharva_beast/Desktop/Coading/Hackfusion-2k26/backend/.env' });

const agent = new Agent({
    name: 'Debug',
    instructions: 'You are a helpful assistant.',
});

async function main() {
    console.log('Starting stream...');
    const result = await run(agent, 'Say hello in 3 words.', { stream: true });

    let i = 0;
    for await (const event of result) {
        i++;
        const type = event.type;
        // Print type of every event
        console.log(`\n--- Event ${i}: type=${type}`);
        // Print top-level keys
        const keys = Object.keys(event);
        console.log('  keys:', keys.join(', '));
        // Print data if present
        if (event.data !== undefined) {
            try {
                const dataStr = JSON.stringify(event.data, null, 2);
                if (dataStr.length < 600) {
                    console.log('  data:', dataStr);
                } else {
                    console.log('  data (truncated):', dataStr.substring(0, 600));
                }
            } catch (e) {
                console.log('  data: (not serializable)');
            }
        }
        if (i >= 40) {
            console.log('\n... stopping after 40 events');
            break;
        }
    }
    console.log('\n\nfinalOutput:', result.finalOutput);
}

main().catch(console.error);
