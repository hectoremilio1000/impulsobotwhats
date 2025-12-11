// /Users/hectorvelasquez/proyectos/growthsuite/nodejswhatsapp/src/services/excel.js
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export function buildSalesWorkbook(rows, meta = {}) {
  // rows es array de objetos SQL (ventas_softs)
  const safe = rows.map((r) => ({
    apertura: r.apertura ? new Date(r.apertura).toISOString() : "",
    folio: r.folio ?? "",
    total_cuenta: Number(r.total_cuenta ?? 0),
    cajero: r.cajero ?? "",
    cierre: r.cierre ?? "",
    name_mesero: r.name_mesero ?? "",
    name_producto: r.name_producto ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(safe);

  // autofiltros y ancho de columnas
  const range = XLSX.utils.decode_range(ws["!ref"]);
  ws["!autofilter"] = { ref: ws["!ref"] };
  ws["!cols"] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "ventas");

  // hoja resumen opcional
  const resumen = [
    ["reporte", meta.reporte || "ventas"],
    ["fecha_especifica", meta.fecha_especifica || ""],
    ["fecha_inicio", meta.fecha_inicio || ""],
    ["fecha_fin", meta.fecha_fin || ""],
    ["generado_en", new Date().toISOString()],
    ["total_filas", rows.length],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(resumen);
  XLSX.utils.book_append_sheet(wb, ws2, "resumen");

  return wb;
}

export function writeWorkbookTemp(wb, suggestedName = "reporte.xlsx") {
  const filename = suggestedName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  const outDir = "/tmp";
  const outPath = path.join(outDir, filename);
  XLSX.writeFile(wb, outPath, { bookType: "xlsx" });
  if (!fs.existsSync(outPath)) throw new Error("No se pudo crear el archivo XLSX");
  return outPath;
}
