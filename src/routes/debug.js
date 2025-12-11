// src/routes/debug.js
import express from "express";
import { classifyIntent } from "../intent/classify.js";

export const debugRouter = express.Router();

/**
 * GET /debug/classify?text=...
 * Llama a classifyIntent con lastIntent = null y el texto que mandes por query.
 */
debugRouter.get("/classify", async (req, res) => {
  try {
    const text = String(req.query.text || "").trim();

    if (!text) {
      return res.status(400).json({ error: "Falta text= en la query" });
    }

    const intentObj = await classifyIntent(null, text);

    return res.json({
      ok: true,
      text,
      intentObj,
      env: {
        LLM_PROVIDER: process.env.LLM_PROVIDER,
        LLM_MODEL: process.env.LLM_MODEL,
        INTENT_PROVIDER: process.env.INTENT_PROVIDER || null,
      },
    });
  } catch (err) {
    console.error("Error en /debug/classify:", err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});
