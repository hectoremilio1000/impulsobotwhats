// src/features/greeting/greetingHandler.js
import { sendText } from "../../services/whatsappApi.js";

export async function handleGreeting({ to, phoneId }) {
  const menu = [
    "Hola 👋 Soy el asistente de IA de Cantina La Llorona. Puedo ayudarte con dudas del POS, operación y políticas internas. Si algo implica dinero (descuentos/cancelaciones) o datos sensibles, lo revisa un gerente.",
    "",
    "Elige una opción:",
    "- *Reporte de Ventas*",
    "- *Productos más vendidos*",
    "- *Mesero con más ventas*",
    "- *Pedir Manual de Mesero*",
  ].join("\n");

  await sendText(to, menu, phoneId);
}
