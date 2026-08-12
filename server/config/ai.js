import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

export const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';
export const NVIDIA_FALLBACK_MODEL = 'meta/llama-3.1-8b-instruct';

let openaiInstance = null;
export const getOpenAIClient = () => {
  if (!openaiInstance) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.warn('[AI Warning] NVIDIA_API_KEY is not defined in environment variables. AI features may fail.');
    }
    openaiInstance = new OpenAI({
      apiKey: apiKey || 'unconfigured_key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }
  return openaiInstance;
};

/**
 * Helper to call AI with fallback, reasoning config, and strip thinking logic.
 */
export const callAI = async (options) => {
  const {
    messages,
    enable_thinking = false,
    temperature,
    top_p,
    max_tokens,
    stream = false,
    tools
  } = options;

  const openai = getOpenAIClient();

  const baseConfig = {
    messages,
    stream,
    ...(temperature !== undefined && { temperature }),
    ...(top_p !== undefined && { top_p }),
    ...(max_tokens !== undefined && { max_tokens }),
    ...(tools && { tools })
  };

  if (enable_thinking) {
    baseConfig.extra_body = { chat_template_kwargs: { enable_thinking: true } };
  }

  let startTime = Date.now();
  try {
    const response = await openai.chat.completions.create({
      model: NVIDIA_MODEL,
      ...baseConfig
    });
    
    if (stream) {
      return { stream: response, model: NVIDIA_MODEL };
    }

    let content = response.choices[0]?.message?.content || "";
    // Strip thinking blocks if present
    if (enable_thinking) {
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    }
    
    // Strip markdown code block wrapping if present
    if (content.startsWith('```')) {
      content = content.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
    }
    
    response.choices[0].message.content = content;
    
    console.log(`[AI] Served by ${NVIDIA_MODEL} in ${Date.now() - startTime}ms`);
    return response;
    
  } catch (err) {
    console.warn(`[AI] Primary model ${NVIDIA_MODEL} failed: ${err.message}. Retrying with fallback...`);
    startTime = Date.now();
    
    const fallbackConfig = { ...baseConfig };
    delete fallbackConfig.extra_body;

    const response = await openai.chat.completions.create({
      model: NVIDIA_FALLBACK_MODEL,
      ...fallbackConfig
    });

    if (stream) {
      return { stream: response, model: NVIDIA_FALLBACK_MODEL };
    }
    
    console.log(`[AI] Served by ${NVIDIA_FALLBACK_MODEL} (Fallback) in ${Date.now() - startTime}ms`);
    return response;
  }
};
