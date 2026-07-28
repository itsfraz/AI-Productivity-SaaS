import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.NVIDIA_API_KEY;
if (!apiKey) {
  console.error('NVIDIA_API_KEY is missing');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const modelsToTest = [
  'meta/llama-3.1-70b-instruct',
  'google/gemma-4-31b-it'
];

const testPrompt = `
You are an AI productivity coach. Analyze the user's last 5 focus sessions:
[{"duration":25,"distractions":0,"type":"pomodoro","hourOfDay":9},{"duration":45,"distractions":1,"type":"deep_work","hourOfDay":10},{"duration":25,"distractions":2,"type":"pomodoro","hourOfDay":11},{"duration":60,"distractions":0,"type":"deep_work","hourOfDay":14},{"duration":30,"distractions":1,"type":"pomodoro","hourOfDay":15}]

Based on this data, recommend:
1. An optimal session length (duration in minutes, e.g., 25, 45, 60, 90).
2. An optimal time-of-day window (e.g., "Morning (8AM-11AM)").
3. A one-sentence explanation for your recommendation based on when they have the least distractions or longest sessions.

Return ONLY a JSON object matching this schema:
{
  "duration": Number,
  "timeOfDay": String,
  "reason": String
}
`;

async function runTest() {
  console.log('--- AI Latency and Quality Test ---');
  
  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}`);
    const startTime = Date.now();
    try {
      const isGemma = model.includes('gemma-4');
      const extra_body = isGemma ? { chat_template_kwargs: { enable_thinking: true } } : undefined;

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: testPrompt }],
        temperature: 0.9,
        extra_body
      });
      const latency = Date.now() - startTime;
      
      let content = response.choices[0].message.content;
      console.log(`[Latency] ${latency}ms`);
      
      const hasThinking = content.includes('<think>');
      console.log(`[Has Thinking Block] ${hasThinking}`);
      
      if (hasThinking) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      }
      
      console.log(`[Output]`, content);
    } catch (err) {
      console.error(`[Error]`, err.message);
    }
  }
}

runTest();
