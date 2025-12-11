// /Users/hectorvelasquez/proyectos/growthsuite/nodejswhatsapp/src/utils/date.js
export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lunes=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
function endOfWeek(d) {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
function startOfMonth(d) {
  const date = new Date(d.getFullYear(), d.getMonth(), 1);
  return date;
}
function endOfMonth(d) {
  const date = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return date;
}

export function normalizeRelativeDates(text, now = new Date()) {
  const t = text.toLowerCase();

  // fecha específica DD/MM o DD/MM/YYYY muy simple (opcional)
  const dateSpecific = t.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (dateSpecific) {
    const [, d, m, y] = dateSpecific;
    const year = y ? (y.length === 2 ? 2000 + parseInt(y) : parseInt(y)) : now.getFullYear();
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    return { fecha_especifica: date.toISOString().slice(0, 10) };
  }

  // palabras clave
  if (t.includes("hoy")) return { fecha_especifica: now.toISOString().slice(0, 10) };
  if (t.includes("ayer")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { fecha_especifica: d.toISOString().slice(0, 10) };
  }

  if (t.includes("esta semana")) {
    const ini = startOfWeek(now);
    const fin = endOfWeek(now);
    return {
      fecha_inicio: ini.toISOString().slice(0, 10),
      fecha_fin: fin.toISOString().slice(0, 10),
    };
  }
  if (t.includes("la semana pasada")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    const ini = startOfWeek(d);
    const fin = endOfWeek(d);
    return {
      fecha_inicio: ini.toISOString().slice(0, 10),
      fecha_fin: fin.toISOString().slice(0, 10),
    };
  }
  if (t.includes("este mes")) {
    const ini = startOfMonth(now);
    const fin = endOfMonth(now);
    return {
      fecha_inicio: ini.toISOString().slice(0, 10),
      fecha_fin: fin.toISOString().slice(0, 10),
    };
  }
  if (t.includes("mes pasado")) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ini = startOfMonth(d);
    const fin = endOfMonth(d);
    return {
      fecha_inicio: ini.toISOString().slice(0, 10),
      fecha_fin: fin.toISOString().slice(0, 10),
    };
  }

  // días de semana, ej “este miércoles” (lunes=1 … domingo=0)
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "miercoles",
    "jueves",
    "viernes",
    "sábado",
    "sabado",
  ];
  for (const name of dias) {
    if (t.includes(`este ${name}`) || t.includes(`${name} de esta semana`)) {
      const targetIdx = [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
      ].indexOf(
        name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace("miercoles", "miércoles")
          .replace("sabado", "sábado")
      );
      const start = startOfWeek(now);
      const d = new Date(start);
      d.setDate(start.getDate() + targetIdx);
      return { fecha_especifica: d.toISOString().slice(0, 10) };
    }
  }

  return {};
}
