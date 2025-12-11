// /Users/hectorvelasquez/proyectos/growthsuite/nodejswhatsapp/src/routes/whatsapp.js
import express from "express";
import axios from "axios";

import { sendText } from "../services/whatsappApi.js";
import { classifyIntent } from "../intent/classify.js";
import { dispatchIntent } from "../intents/router.js";

export const router = express.Router();

const BOT_GATEWAY_BASE = process.env.BOT_GATEWAY_BASE;
const BOT_SHARED_SECRET = process.env.BOT_SHARED_SECRET;

// 1) Verificación (GET)
router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2) Recepción de mensajes (POST)
router.post("/whatsapp", express.json(), async (req, res) => {
  res.sendStatus(200); // responder rápido al webhook

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const phoneId = value?.metadata?.phone_number_id;
    const msg = value?.messages?.[0];
    if (!msg) return;

    const from = msg?.from; // E.164 sin '+'
    const type = msg?.type;

    // normalizar texto según tipo
    let text = "";
    if (type === "text") {
      text = msg?.text?.body?.trim() || "";
    } else if (type === "interactive") {
      const i = msg?.interactive;
      text = i?.button_reply?.title || i?.list_reply?.title || "";
    } else {
      await sendText(from, "Envíame tu pregunta en texto y con gusto te respondo 🙂", phoneId);
      return;
    }

    if (!from || !text) return;

    /* 1) Resolver restaurantId vía pos-bot-api */
    let restaurantId = null;

    try {
      const companyRes = await axios.get(`${BOT_GATEWAY_BASE}/bot/company-by-phone`, {
        params: { phone: from },
        headers: {
          "x-bot-secret": BOT_SHARED_SECRET,
        },
      });
      const company = companyRes.data || null;

      if (company) {
        restaurantId = company.restaurantId ?? company.restaurant_id ?? company.id ?? null;
      }

      if (!restaurantId) {
        console.warn("No restaurantId en company-by-phone para", from, company);
      }
    } catch (err) {
      console.error(
        "Error consultando empresa por teléfono (BotService):",
        err.response?.data || err.message
      );
    }

    if (!restaurantId) {
      await sendText(
        from,
        "Hola 👋, no te encontramos registrado como cliente.\n👉 https://impulsorestaurantero.com/",
        phoneId
      );
      return;
    }

    /* 2) Leer conversación previa (lastIntent) */
    let lastIntent = null;
    let conversationId = null;

    try {
      const convRes = await axios.get(`${BOT_GATEWAY_BASE}/bot/conversations/by-phone`, {
        params: { phone: from, restaurantId },
        headers: {
          "x-bot-secret": BOT_SHARED_SECRET,
        },
      });

      const conv = convRes.data || null;
      if (conv) {
        conversationId = conv.id;
        lastIntent = conv.lastIntent || conv.last_intent || null;
      }
    } catch (err) {
      console.error("Error consultando conversación previa:", err.response?.data || err.message);
    }

    /* 3) Clasificar intención (IA) */
    const rompe = [
      "hola",
      "buenos días",
      "buenas tardes",
      "quiero otra cosa",
      "quiero información",
      "quiero hacer otra consulta",
      "no entendí",
      "me equivoqué",
      "gracias",
    ];
    const isBreak = rompe.some((k) => text.toLowerCase().includes(k));
    const effectiveLastIntent = isBreak ? null : lastIntent;

    const intentObj = await classifyIntent(effectiveLastIntent, text);
    const tipo = (intentObj.tipo_mensaje || "").trim();

    console.log("Intent detectado:", intentObj);

    /* 4) Ejecutar feature correspondiente */
    await dispatchIntent({
      tipo_mensaje: tipo,
      intentObj,
      from,
      text,
      phoneId,
      restaurantId,
    });

    /* 5) Guardar conversación + mensaje en pos-bot-api */
    try {
      const convPayload = {
        phone: from,
        restaurantId,
        state: tipo,
        lastIntent: tipo,
        lastMessage: text,
      };

      // upsert conversación
      const convUpsertRes = await axios.post(`${BOT_GATEWAY_BASE}/bot/conversations`, convPayload, {
        headers: {
          "x-bot-secret": BOT_SHARED_SECRET,
        },
      });

      const conv = convUpsertRes.data || null;
      conversationId = conv?.id ?? conversationId;

      // registrar mensaje del usuario
      if (conversationId) {
        await axios.post(
          `${BOT_GATEWAY_BASE}/bot/conversations/${conversationId}/messages`,
          {
            role: "user",
            content: text,
            intent: tipo,
            intentPayload: intentObj,
          },
          {
            headers: {
              "x-bot-secret": BOT_SHARED_SECRET,
            },
          }
        );
      }
    } catch (err) {
      console.error("Error guardando conversación/mensaje:", err.response?.data || err.message);
    }
  } catch (err) {
    console.error("Webhook error:", err);
  }
});
