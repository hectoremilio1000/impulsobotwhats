// src/intent/classify.js
import { chatLLM } from "../llm/client.js";
import { normalizeRelativeDates } from "../utils/date.js";

const TYPES = [
  "Reporte de ventas del mesero que vendio más, de una fecha específica",
  "Reporte de ventas del mesero que vendio más, en un rango de fechas",
  "Reporte de productos que se vendio más, de una fecha específica",
  "Reporte  de productos que se vendio más, en un rango de fechas",
  "Reporte de ventas de una fecha específica",
  "Reporte de ventas posteriores a una fecha específica",
  "Reporte de ventas posteriores o iguales a una fecha específica",
  "Reporte de ventas en un rango de fechas",
  "Reporte de ventas anteriores a una fecha específica",
  "Reporte de ventas anteriores o iguales a una fecha específica",
  "Reporte de ventas totales (sin fechas específicas)",
  "Manual de mesero",
  "Pregunta de marketing para el restaurante",
];

const FALLBACK = [
  "saludo",
  "no se entiende",
  "reporte de ventas",
  "Pregunta de marketing para el restaurante",
];

const INTENT_PROVIDER = String(process.env.INTENT_PROVIDER || process.env.LLM_PROVIDER || "vertex")
  .replace(/['"]/g, "")
  .trim()
  .toLowerCase();

export async function classifyIntent(lastIntent, message) {
  const now = new Date();
  const nowISO = now.toISOString();

  const norm = normalizeRelativeDates(message, now);
  let fecha_especifica = norm.fecha_especifica || null;
  let fecha_inicio = norm.fecha_inicio || null;
  let fecha_fin = norm.fecha_fin || null;

  const system = `Eres un asistente que CLASIFICA intents para un bot de WhatsApp de restaurantes.
Hoy es ${nowISO}. El último estado de intención es: "${lastIntent || "ninguna"}".

Debes devolver SIEMPRE y SOLO un objeto JSON válido con este shape:

{
  "tipo_mensaje": "...",
  "fecha_especifica": "YYYY-MM-DD | null",
  "fecha_inicio": "YYYY-MM-DD | null",
  "fecha_fin": "YYYY-MM-DD | null"
}

Reglas:
- "tipo_mensaje" debe ser EXACTAMENTE uno de:
  ${TYPES.join(" | ")}
- Si no encaja, usa uno de: ${FALLBACK.join(", ")}.
- Si el usuario hace preguntas sobre marketing, redes sociales, promociones,
  contenidos o tips para atraer más clientes, usa "Pregunta de marketing para el restaurante".
- Si el usuario menciona fechas relativas, conviértelas a YYYY-MM-DD asumiendo hoy = ${nowISO}.
- Si no hay fecha, usa null en los campos de fecha.
- RESPONDE SOLO EL JSON.`;

  const user = `Mensaje del usuario: """${message}"""

Fechas interpretadas hasta ahora (puedes ajustarlas si es necesario):
${JSON.stringify({ fecha_especifica, fecha_inicio, fecha_fin })}`;

  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let rawText = "";

  // Hoy usamos siempre chatLLM (Vertex/OpenAI/etc.) según LLM_PROVIDER
  rawText = await chatLLM(messages, {
    temperature: 0.1,
    max_tokens: 300,
  });

  let parsed = {};
  try {
    parsed = JSON.parse(String(rawText).trim());
  } catch (e) {
    console.warn("classifyIntent: no se pudo parsear JSON, fallback:", e.message);
    parsed = { tipo_mensaje: "no se entiende" };
  }

  if (!parsed.fecha_especifica && fecha_especifica) parsed.fecha_especifica = fecha_especifica;
  if (!parsed.fecha_inicio && fecha_inicio) parsed.fecha_inicio = fecha_inicio;
  if (!parsed.fecha_fin && fecha_fin) parsed.fecha_fin = fecha_fin;

  return parsed;
}
