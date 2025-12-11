// src/intents/router.js
import { handleGreeting } from "../features/greeting/greetingHandler.js";
import { handleInterviews } from "../features/interviews/interviewsHandler.js";
import { handleWaiterManual } from "../features/waiterManual/waiterManualHandler.js";
import {
  handleSalesReportByDate,
  handleSalesReportGeneric,
} from "../features/reports/salesHandlers.js";
import { handleMarketingQA } from "../features/marketing/marketingHandler.js";
import { sendText } from "../services/whatsappApi.js";

export async function dispatchIntent({
  tipo_mensaje,
  intentObj,
  from,
  text,
  phoneId,
  restaurantId,
}) {
  const tipo = (tipo_mensaje || "").trim();

  if (tipo === "saludo") {
    await handleGreeting({ to: from, phoneId });
    return;
  }

  if (tipo === "entrevistas de trabajo") {
    await handleInterviews({ to: from, phoneId });
    return;
  }

  if (tipo === "Manual de mesero") {
    await handleWaiterManual({ to: from, phoneId });
    return;
  }

  if (tipo === "Pregunta de marketing para el restaurante") {
    await handleMarketingQA({ to: from, phoneId, text, restaurantId });
    return;
  }

  if (tipo.toLowerCase().includes("reporte de ventas")) {
    if (tipo === "Reporte de ventas de una fecha específica") {
      await handleSalesReportByDate({
        to: from,
        phoneId,
        intent: intentObj,
        rawText: text,
        restaurantId,
      });
      return;
    }

    await handleSalesReportGeneric({
      to: from,
      phoneId,
      intent: intentObj,
      rawText: text,
      restaurantId,
    });
    return;
  }

  await sendText(
    from,
    "No te entendí bien 🤖. Opciones: *Entrevistas de trabajo* | *Reporte de ventas* | *Manual de mesero*",
    phoneId
  );
}
