import "dotenv/config";
import express from "express";
import { router as whatsappRouter } from "./routes/whatsapp.js";

const app = express();

// Webhook de WhatsApp
app.use("/webhook", whatsappRouter);

// Healthcheck simple
app.get("/", (req, res) => {
  res.send("nodejswhatsapp ok");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`servidor listo: ${PORT}`);
  console.log(`Webhook URL: ${process.env.APP_BASE_URL}/webhook/whatsapp`);
});
