// /Users/hectorvelasquez/proyectos/growthsuite/nodejswhatsapp/src/services/openai.js
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = (process.env.LLM_MODEL || "gpt-4o-mini").replace(/['"]/g, "").trim();

/**
 * Wrapper sencillo para Chat Completions
 */
export async function chat(messages, opts = {}) {
  const model = opts.model || DEFAULT_MODEL;
  const temperature = opts.temperature ?? 0;

  const res = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: opts.max_tokens ?? 400,
  });

  return res.choices?.[0]?.message?.content || "";
}
