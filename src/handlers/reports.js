// src/handlers/reports.js
import axios from "axios";
import { sendText } from "../services/whatsappApi.js";

const BOT_GATEWAY_BASE = process.env.BOT_GATEWAY_BASE;
const BOT_SHARED_SECRET = process.env.BOT_SHARED_SECRET;

function mapTipoToTypeReport(tipo = "") {
  const t = tipo.toLowerCase();

  if (t.includes("rango de fechas")) return "range";

  if (t.includes("fecha específica")) {
    if (t.includes("posterior") || t.includes("mayor")) return "greater_than";
    if (t.includes("anterior") || t.includes("menor")) return "less_than";
    return "specific_date";
  }

  if (t.includes("totales") || t.includes("sin fechas")) return null;

  return null;
}

function resumenTurnoMsg({ total, orderCount }) {
  const totalNumber = Number(total || 0);
  const totalText = totalNumber.toFixed(2);

  const countText = typeof orderCount === "number" ? `\n🧾 Órdenes cerradas: ${orderCount}` : "";

  return `🧾 *Resumen de ventas*\n\n💰 Total vendido: $ ${totalText}${countText}`;
}

export async function handleReport(to, tipo, fechas, restaurantId) {
  if (!restaurantId) {
    await sendText(
      to,
      "No tengo asociado un restaurante para este número. Verifica tu configuración en el panel de Impulso."
    );
    return;
  }

  const typeReport = mapTipoToTypeReport(tipo);
  if (!typeReport) {
    await sendText(
      to,
      "Por ahora este tipo de reporte todavía no está soportado. Prueba con: rango de fechas, fecha específica, mayor o menor a una fecha."
    );
    return;
  }

  const payload = { restaurantId, typeReport };
  const f = fechas || {};

  if (typeReport === "range") {
    if (!f.fecha_inicio || !f.fecha_fin) {
      await sendText(
        to,
        "Necesito una fecha inicial y una fecha final (YYYY-MM-DD) para generar el reporte."
      );
      return;
    }
    payload.dateStart = f.fecha_inicio;
    payload.dateEnd = f.fecha_fin;
  } else {
    if (!f.fecha_especifica) {
      await sendText(to, "Necesito una fecha específica (YYYY-MM-DD) para generar el reporte.");
      return;
    }
    payload.dateEspecify = f.fecha_especifica;
  }

  try {
    console.log("BOT_GATEWAY_BASE en runtime =", BOT_GATEWAY_BASE, "payload=", payload);
    const { data } = await axios.get(`${BOT_GATEWAY_BASE}/bot/sales-report`, {
      params: payload,
      headers: {
        "x-bot-secret": BOT_SHARED_SECRET,
      },
    });

    const { total, orderCount } = data || {};

    await sendText(to, resumenTurnoMsg({ total, orderCount }));
  } catch (err) {
    console.error(
      "Error llamando al bot-gateway /bot/sales-report:",
      err.response?.data || err.message
    );
    await sendText(
      to,
      "⚠️ Ocurrió un error al consultar el reporte de ventas. Intenta de nuevo más tarde."
    );
  }
}
