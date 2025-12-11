// /Users/hectorvelasquez/proyectos/growthsuite/nodejswhatsapp/src/llm/cost.js
const OPENAI_PRICE_TABLE = {
  standard: { in: 0.15, out: 0.6 },
  flex: { in: 0.075, out: 0.3 },
  priority: { in: 0.15, out: 0.6 },
};

function getPer1MOpenAI(tier = "standard") {
  const t = String(tier || "standard").toLowerCase();
  const IN = process.env[`OPENAI_${t.toUpperCase()}_IN_PRICE_PER_1M`];
  const OUT = process.env[`OPENAI_${t.toUpperCase()}_OUT_PRICE_PER_1M`];
  const fallback = OPENAI_PRICE_TABLE[t] || OPENAI_PRICE_TABLE.standard;
  return {
    inPer1M: Number(IN ?? fallback.in),
    outPer1M: Number(OUT ?? fallback.out),
  };
}

function getPer1MGeneric() {
  const inPer1M = Number(process.env.LLM_PRICE_IN_PER_1M ?? 0);
  const outPer1M = Number(process.env.LLM_PRICE_OUT_PER_1M ?? 0);
  return { inPer1M, outPer1M };
}

export function logCostUSD(usage, { provider, tier = "standard", model = "" }) {
  const inTok = usage?.prompt_tokens ?? usage?.input_tokens ?? 0;
  const outTok = usage?.completion_tokens ?? usage?.output_tokens ?? 0;

  const { inPer1M, outPer1M } = provider === "openai" ? getPer1MOpenAI(tier) : getPer1MGeneric();

  const inUSD = inTok * (inPer1M / 1e6);
  const outUSD = outTok * (outPer1M / 1e6);
  const total = inUSD + outUSD;

  console.log(
    `LLM cost  → provider:${provider} model:${model} tier:${tier} ` +
      `inTok:${inTok} outTok:${outTok} ` +
      `≈ $${total.toFixed(6)} (in:$${inUSD.toFixed(6)} + out:$${outUSD.toFixed(6)})`
  );
}
