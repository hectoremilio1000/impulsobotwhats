// src/features/reports/salesHandlers.js
import { handleReport } from "../../handlers/reports.js";

export async function handleSalesReportByDate({ to, phoneId, intent, rawText, restaurantId }) {
  const tipo = "Reporte de ventas de una fecha específica";
  await handleReport(to, tipo, intent, restaurantId);
}

export async function handleSalesReportGeneric({ to, phoneId, intent, rawText, restaurantId }) {
  const tipo = intent.tipo_mensaje || "Reporte de ventas totales (sin fechas específicas)";
  await handleReport(to, tipo, intent, restaurantId);
}
