// src/features/marketing/marketingHandler.js
import { sendText } from "../../services/whatsappApi.js";
import { qaAnswer } from "../../services/qa.js";

export async function handleMarketingQA({ to, phoneId, text, restaurantId }) {
  const contextoBase = `
El usuario es dueño o encargado de un restaurante, cantina o bar.
Quiere consejos de marketing, ventas y comunicación específicos para su negocio.
Responde siempre en español, con máximo 5 puntos claros y accionables.
Evita respuestas genéricas; usa ejemplos concretos para restaurantes en México.
  `.trim();

  const answer = await qaAnswer({
    question: text,
    context: contextoBase,
    opts: {
      temperature: 0.4,
      max_tokens: 500,
      // Si quisieras forzar OpenAI aquí podrías hacer:
      // provider: "openai",
      // model: "gpt-4o-mini",
    },
  });

  await sendText(to, answer, phoneId);
}
