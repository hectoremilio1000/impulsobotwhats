// src/routes/debugQa.js
import express from "express";
import { qaAnswer } from "../services/qa.js";

export const debugQaRouter = express.Router();

/**
 * GET /debug/qa?text=...
 * Prueba respuestas de marketing usando qaAnswer directamente.
 */
debugQaRouter.get("/qa", async (req, res) => {
  try {
    const text = String(req.query.text || "").trim();

    if (!text) {
      return res.status(400).json({ error: "Falta text= en la query" });
    }

    const contextoBase = `
El usuario es dueño o encargado de un restaurante/cantina/bar.
Quiere consejos de marketing, ventas, branding o redes sociales para su negocio.
Responde siempre en español, en máximo 5 bullets claros y accionables.
    `.trim();

    const answer = await qaAnswer({
      question: text,
      context: contextoBase,
      opts: { temperature: 0.4, max_tokens: 500 },
    });

    return res.json({
      ok: true,
      text,
      answer,
    });
  } catch (err) {
    console.error("Error en /debug/qa:", err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});
