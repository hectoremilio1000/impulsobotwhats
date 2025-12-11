// /Users/hectorvelasquez/proyectos/growthsuite/nodejswhatsapp/src/services/qa.js
import { chatLLM } from "../llm/client.js";
import { chat as openaiChat } from "./openai.js"; // 👈 NUEVO
import { QA_ROLE, buildQAContext } from "../prompts/qa.js";

function clamp(str = "", max = 1200) {
  return String(str).slice(0, max);
}

/**
 * qaAnswer
 *  - Por defecto usa tu LLM principal (Llama 3.3 en Vertex).
 *  - Si opts.provider="openai" o el model empieza con "gpt-" / "o4-",
 *    usa el cliente OpenAI (services/openai.js).
 */
export async function qaAnswer({ role, context, question, opts = {} }) {
  const system = role || QA_ROLE;
  const ctx = (context ?? buildQAContext()).trim();
  const user = `CONTEXT:\n${ctx}\n\nUSER:\n${clamp(question)}`;

  const baseOpts = { temperature: 0.3, max_tokens: 300, ...opts };

  const provider = String(baseOpts.provider || "").toLowerCase();
  const modelName = String(baseOpts.model || "").toLowerCase();

  // Señales de que el usuario quiere OpenAI
  const wantsOpenAI =
    provider === "openai" || modelName.startsWith("gpt-") || modelName.startsWith("o4-");

  // Si quiere OpenAI pero no especificó modelo, damos default gpt-4o-mini
  if (wantsOpenAI && !baseOpts.model) {
    baseOpts.model = "gpt-4o-mini";
  }

  let answer;

  if (wantsOpenAI) {
    // 🔹 OpenAI directo (usa OPENAI_API_KEY + OPENAI_SERVICE_TIER)
    answer = await openaiChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      baseOpts
    );
  } else {
    // 🔹 Cliente genérico (hoy: Vertex Llama 3.3, según tu .env)
    answer = await chatLLM(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      baseOpts
    );
  }

  return String(answer || "").trim();
}
