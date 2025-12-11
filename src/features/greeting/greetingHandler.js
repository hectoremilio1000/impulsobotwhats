// src/features/greeting/greetingHandler.js
import { sendText } from "../../services/whatsappApi.js";

export async function handleGreeting({ to, phoneId }) {
  const menu = [
    "👋 ¡Hola! ¿En qué puedo ayudarte?",
    "Elige una opción:",
    "- *Reporte de Ventas*",
    "- *Productos más vendidos*",
    "- *Mesero con más ventas*",
    "- *Pedir Manual de Mesero*",
  ].join("\n");

  await sendText(to, menu, phoneId);
}
