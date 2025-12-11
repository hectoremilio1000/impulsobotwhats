// /Users/hectorvelasquez/proyectos/growthsuite/nodejswhatsapp/src/llm/client.js
import OpenAI from "openai";
import { GoogleAuth } from "google-auth-library";
import { logCostUSD } from "./cost.js";

const PROVIDER = String(process.env.LLM_PROVIDER || "openai")
  .replace(/['"]/g, "")
  .trim()
  .toLowerCase();

const DEFAULT_BASES = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  together: "https://api.together.xyz/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
  ollama: "http://localhost:11434/v1",
};

let BASE_URL =
  String(process.env.LLM_BASE_URL || DEFAULT_BASES[PROVIDER] || "").trim() || undefined;

let API_KEY =
  process.env.LLM_API_KEY ||
  process.env.OPENAI_API_KEY ||
  (PROVIDER === "ollama" ? "ollama" : undefined);

// Caso especial: Vertex
if (PROVIDER === "vertex") {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || "us-central1";

  if (!projectId) {
    throw new Error("[LLM client] GCP_PROJECT_ID es obligatorio cuando LLM_PROVIDER=vertex");
  }

  BASE_URL =
    process.env.LLM_BASE_URL ||
    `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/endpoints/openapi`;

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const adcClient = await auth.getClient();
  const { token } = await adcClient.getAccessToken();

  if (!token) {
    throw new Error("[LLM client] No se pudo obtener access token de Google (ADC).");
  }

  API_KEY = token;
  console.log(
    `[LLM client] Usando Vertex OpenAI endpoint → ${BASE_URL} | proyecto=${projectId} | loc=${location}`
  );
}

const DEFAULTS = {
  TEMP: Number(process.env.LLM_TEMP ?? 0.3),
  MAX_TOKENS: Number(process.env.LLM_MAX_TOKENS ?? 300),
  MODEL: String(process.env.LLM_MODEL || process.env.GPT_MODEL || "gpt-4o-mini")
    .replace(/['"]/g, "")
    .trim(),
};

const client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });

console.log(`LLM provider: ${PROVIDER} | baseURL: ${BASE_URL || "(sdk default)"}`);

function makeAbort(ms) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  const cancel = () => clearTimeout(timer);
  return { ac, cancel };
}

export async function chatLLM(messages, opts = {}) {
  const temperature = opts.temperature ?? DEFAULTS.TEMP;
  const max_tokens = opts.max_tokens ?? DEFAULTS.MAX_TOKENS;
  const model = String(opts.model ?? DEFAULTS.MODEL);
  const timeoutMs = opts.timeoutMs ?? 12000;

  const DEFAULT_TIER = String(process.env.OPENAI_SERVICE_TIER || "")
    .replace(/['"]/g, "")
    .trim()
    .toLowerCase();
  const requestedTier = String(opts.service_tier || DEFAULT_TIER || "")
    .trim()
    .toLowerCase();

  const providerIsOpenAI = PROVIDER === "openai";

  // 1) Responses API
  if (providerIsOpenAI && (requestedTier === "flex" || requestedTier === "priority")) {
    const instructions =
      messages
        .filter((m) => String(m.role).toLowerCase() === "system")
        .map((m) => String(m.content ?? ""))
        .join("\n\n") || undefined;

    const inputText =
      messages
        .filter((m) => String(m.role).toLowerCase() !== "system")
        .map((m) => String(m.content ?? ""))
        .join("\n\n")
        .trim() || "Hola";

    const body = {
      model,
      input: inputText,
      temperature,
      service_tier: requestedTier,
    };
    if (Number.isFinite(max_tokens)) body.max_output_tokens = max_tokens;
    if (instructions) body.instructions = instructions;

    const { ac, cancel } = makeAbort(timeoutMs);
    try {
      const r = await client.responses.create(body, { signal: ac.signal });
      cancel();

      if (r.service_tier) console.log("Service tier usado →", r.service_tier);

      const usage = {
        prompt_tokens: r.usage?.input_tokens ?? 0,
        completion_tokens: r.usage?.output_tokens ?? 0,
      };
      console.log("LLM usage →", usage);
      logCostUSD(usage, { provider: PROVIDER, tier: requestedTier, model });

      return String(r.output_text || "");
    } catch (e) {
      cancel();
      console.warn(
        "Responses API falló; fallback a Chat Completions:",
        e?.status || e?.code || e?.message
      );
    }
  }

  // 2) Chat Completions
  const bodyCC = { model, messages, temperature };
  if (Number.isFinite(max_tokens)) bodyCC.max_tokens = max_tokens;
  if (providerIsOpenAI && requestedTier === "auto") bodyCC.service_tier = "auto";

  const { ac: ac2, cancel: cancel2 } = makeAbort(timeoutMs);
  const r = await client.chat.completions.create(bodyCC, { signal: ac2.signal }).finally(cancel2);

  if (r.service_tier) console.log("Service tier usado →", r.service_tier);

  const usage = r.usage || {};
  console.log("LLM usage →", usage);

  const tierForCost = providerIsOpenAI && requestedTier === "auto" ? "standard" : "standard";
  logCostUSD(usage, { provider: PROVIDER, tier: tierForCost, model });

  return r.choices?.[0]?.message?.content || "";
}
