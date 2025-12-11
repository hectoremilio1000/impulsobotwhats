// src/features/interviews/interviewsHandler.js
import { sendText } from "../../services/whatsappApi.js";

export async function handleInterviews({ to, phoneId }) {
  const txt = [
    "👋 Entendemos que quieres *entrevistas de trabajo*.",
    "Por favor especifica:",
    "1) Puesto de trabajo",
    "2) Turno (parcial / tiempo completo)",
    "3) Horario",
  ].join("\n");

  await sendText(to, txt, phoneId);
}
