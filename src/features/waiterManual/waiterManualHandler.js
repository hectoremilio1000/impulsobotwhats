// src/features/waiterManual/waiterManualHandler.js
import { sendText } from "../../services/whatsappApi.js";

const PREGUNTAS = [
  "¿Qué tipo de establecimiento eres? (cantina/restaurante/bar...)",
  "¿Qué estilo de servicio manejas? (americano, francés, al centro, etc.)",
  "¿Qué roles tiene un mesero contigo?",
  "¿Qué errores quieres evitar en nuevos meseros?",
  "¿Qué nivel de detalle esperas en el manual?",
];

export async function handleWaiterManual({ to, phoneId }) {
  // más adelante: guardar avance en DB/gateway
  await sendText(to, PREGUNTAS[0], phoneId);
}
