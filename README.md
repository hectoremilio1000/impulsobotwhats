#### nodejswhatsapp/

package.json
.env

src/
server.js

    routes/
      whatsapp.js

    intent/
      classify.js

    intents/
      router.js

    llm/
      client.js
      cost.js

    prompts/
      qa.js

    services/
      whatsappApi.js
      openai_production.js
      qa.js
      db.js
      excel.js

    features/
      greeting/
        greetingHandler.js
      interviews/
        interviewsHandler.js
      waiterManual/
        waiterManualHandler.js
      reports/
        salesHandlers.js

    handlers/
      reports.js

    utils/
      date.js

¿Qué hace cada parte?

server.js
Arranca Express, monta /webhook/whatsapp y expone un healthcheck.

routes/whatsapp.js

Maneja el webhook de Meta (GET verify + POST mensajes).

Resuelve restaurantId vía pos-bot-api (company-by-phone).

Lee conversación previa (lastIntent) desde pos-bot-api.

Llama a classifyIntent (IA).

Llama a dispatchIntent para ejecutar el feature correcto.

Guarda conversación + mensaje en pos-bot-api (conversations + messages).

intent/classify.js

Usa INTENT_PROVIDER + LLM_PROVIDER para decidir si usar OpenAI o Vertex (u otro).

Pasa el texto y lastIntent a chatLLM y devuelve un objeto JSON:

{ "tipo_mensaje": "...", "fecha_especifica": "...", ... }

intents/router.js

Recibe { tipo_mensaje, intentObj, from, text, phoneId, restaurantId }.

Decide si llamar:

handleGreeting (saludo),

handleInterviews (entrevistas),

handleWaiterManual,

handleSalesReport\*.

llm/client.js

Cliente genérico para LLM:

soporta LLM_PROVIDER=openai|vertex|openrouter|groq|ollama...

si vertex → usa google-auth-library para sacar access_token y endpoint OpenAI-compatible.

Implementa chatLLM(messages, opts):

usa Responses API (service_tier=flex|priority) cuando toca,

o Chat Completions,

loguea consumo y costos con logCostUSD.

llm/cost.js

Calcula costo aproximado en USD por tokens (prompt_tokens, completion_tokens).

Usa precios configurables por env (LLM_PRICE_IN_PER_1M, etc.).

prompts/qa.js

Define el rol/base para QA libre:

QA_ROLE (persona del bot),

buildQAContext() (contexto fijo del negocio).

services/whatsappApi.js

Cliente HTTP a WhatsApp Cloud:

Usa WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN.

Expone sendText(to, text, phoneNumberId?).

services/openai_production.js

Cliente “directo” a OpenAI (para cuando INTENT_PROVIDER=openai o provider=openai):

Expone openai (SDK),

GPT_MODEL por defecto.

services/qa.js

Abstracción qaAnswer({ role, context, question, opts }):

Si opts.provider === "openai" o modelo gpt-\* → usa openai_production.chat.

Si no → usa chatLLM (Llama / Vertex / otro).

services/db.js (opcional)

Pool MySQL con mysql2/promise, por si quieres guardar cosas en otra base (ej. entrevista de mesero).

services/excel.js (opcional)

Helpers para generar XLSX de ventas / reportes.

features/greeting/

greetingHandler.js → responde con menú de opciones.

features/interviews/

interviewsHandler.js → inicia flujo de entrevistas de trabajo.

features/waiterManual/

waiterManualHandler.js → inicia flujo de construcción de manual de mesero.

features/reports/

salesHandlers.js → traduce intents de reporte a llamadas a handleReport.

handlers/reports.js

Orquesta reportes:

Mapea tipo de intent → typeReport (range, specific_date, etc.).

Llama a pos-bot-api /bot/sales-report con restaurantId y fechas.

Construye texto para el resumen de ventas.

utils/date.js

Funciones de fecha:

todayISO(),

normalizeRelativeDates(text) → convierte “ayer”, “este mes”, “la semana pasada”, etc. a fechas YYYY-MM-DD.

### app no tiene nada de whatsapp de facebook del panel de aplicaciones

laloronacantina=577025881245620
impulsobotdesarrollo=1894044924767590 no tiene nada
impulsoBotdesarrollo=1740008216612743
impulsobot restaurantero=1053258763335579
# impulsobotwhats
