// src/services/whatsappApi.js
import fetch from "node-fetch";

const BASE_URL = "https://graph.facebook.com/v20.0";

function buildUrl(path, phoneNumberId) {
  const id = phoneNumberId || process.env.WA_PHONE_NUMBER_ID;
  return `${BASE_URL}/${id}/${path}`;
}

/**
 * Envía un texto por WhatsApp Cloud API
 */
export async function sendText(to, text, phoneNumberId) {
  const url = buildUrl("messages", phoneNumberId);

  console.log("[WA] sendText →", {
    url,
    to,
    text,
    phoneIdUsed: phoneNumberId || process.env.WA_PHONE_NUMBER_ID,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error(
      "WA sendText error:",
      res.status,
      t,
      "→ phone_number_id usado:",
      phoneNumberId || process.env.WA_PHONE_NUMBER_ID
    );
  }
}
