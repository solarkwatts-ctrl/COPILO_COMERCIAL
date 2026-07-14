import Papa from "papaparse";
import * as XLSX from "xlsx";

export type HistoricalType = "ventas_historicas" | "compras_historicas" | "remisiones_historicas";
export type ParsedHistoricalFile = {
  type: HistoricalType;
  sourceFile: string;
  rows: Record<string, unknown>[];
  rejected: number;
  periodFrom: string | null;
  periodTo: string | null;
};

const DATE_RE = /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/;

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\u00a0/g, " ").trim();
}
function normalizedHeader(value: unknown): string {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
function parseNumberCo(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = cleanText(value).replace(/[$%\s]/g, "");
  if (!raw) return 0;
  if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(raw)) return Number(raw.replace(/\./g, "").replace(",", "."));
  if (/^-?\d{1,3}(,\d{3})*\.\d+$/.test(raw)) return Number(raw.replace(/,/g, ""));
  if (/^-?\d+,\d+$/.test(raw)) return Number(raw.replace(",", "."));
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function isoDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const s = cleanText(value);
  if (DATE_RE.test(s)) {
    const [y, m, d] = s.replace(/-/g, "/").split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dmY = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmY) return `${dmY[3]}-${dmY[2].padStart(2, "0")}-${dmY[1].padStart(2, "0")}`;
  if (typeof value === "number" && value > 20000) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const date = new Date(s);
  if (s && !Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return null;
}

function rowType(cells: unknown[]): HistoricalType | null {
  const joined = cells.slice(0, 20).map(cleanText).join(" ").toUpperCase();
  if (joined.includes("FACTURA VENTA POR EMPLEADO")) return "ventas_historicas";
  if (joined.includes("NOTA COMPRA") || joined.includes("FACTURA PROVEEDOR")) return "compras_historicas";
  if (joined.includes("LISTADO REMISIONES CLIENTES") || joined.includes("REMISION")) return "remisiones_historicas";
  return null;
}

function extractPeriod(rows: Record<string, unknown>[]) {
  const dates = rows.map((r) => String(r.fecha || "")).filter(Boolean).sort();
  return { from: dates[0] || null, to: dates.at(-1) || null };
}

function findHeaderRow(rawRows: unknown[][]): { index: number; headers: string[] } | null {
  const requiredCandidates = ["fecha", "factura", "remision", "proveedor", "cliente", "referencia"];
  for (let i = 0; i < Math.min(rawRows.length, 80); i++) {
    const headers = rawRows[i].map(normalizedHeader);
    const score = requiredCandidates.filter((candidate) => headers.some((h) => h === candidate || h.includes(candidate))).length;
    if (score >= 2 && headers.some((h) => h === "fecha" || h.includes("fecha"))) return { index: i, headers };
  }
  return null;
}

function pick(obj: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (obj[alias] !== undefined && cleanText(obj[alias]) !== "") return obj[alias];
  }
  const keys = Object.keys(obj);
  for (const alias of aliases) {
    const key = keys.find((k) => k.includes(alias));
    if (key && cleanText(obj[key]) !== "") return obj[key];
  }
  return "";
}

function parseFlatRows(rawRows: unknown[][], type: HistoricalType, sourceFile: string): Record<string, unknown>[] {
  const header = findHeaderRow(rawRows);
  if (!header) return [];
  const rows: Record<string, unknown>[] = [];
  for (const cells of rawRows.slice(header.index + 1)) {
    const obj: Record<string, unknown> = {};
    header.headers.forEach((h, idx) => { if (h) obj[h] = cells[idx]; });
    const fecha = isoDate(pick(obj, ["fecha", "fecha_documento", "fecha_factura", "date"]));
    if (!fecha) continue;

    if (type === "ventas_historicas") {
      const factura = cleanText(pick(obj, ["factura", "numero_factura", "documento", "nro_factura"]));
      const cliente = cleanText(pick(obj, ["cliente_limpio", "cliente", "razon_social", "nombre_cliente"]));
      if (!factura || !cliente) continue;
      rows.push({
        fecha, factura, cliente,
        vendedor: cleanText(pick(obj, ["vendedor", "empleado", "comercial", "asesor"])) || "Sin vendedor",
        almacen: cleanText(pick(obj, ["almacen", "sucursal", "bodega", "sede"])) || "Sin almacén",
        base: parseNumberCo(pick(obj, ["base", "subtotal", "valor_base"])),
        iva: parseNumberCo(pick(obj, ["iva", "impuesto"])),
        total: parseNumberCo(pick(obj, ["total", "valor_total", "valor", "neto"])),
        anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)), archivo_origen: sourceFile,
      });
    } else if (type === "compras_historicas") {
      const facturaProveedor = cleanText(pick(obj, ["factura_proveedor", "factura", "documento", "numero_factura", "nota_compra"]));
      const proveedor = cleanText(pick(obj, ["proveedor", "nombre_proveedor", "tercero", "razon_social"]));
      if (!facturaProveedor || !proveedor) continue;
      rows.push({
        fecha, factura_proveedor: facturaProveedor,
        documento_proveedor: cleanText(pick(obj, ["documento_proveedor", "nit", "identificacion", "documento_tercero"])),
        proveedor,
        valor_total: parseNumberCo(pick(obj, ["valor_total", "total", "valor", "neto"])),
        saldo: parseNumberCo(pick(obj, ["saldo", "saldo_pendiente"])),
        estado: cleanText(pick(obj, ["estado", "status"])),
        anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)), archivo_origen: sourceFile,
      });
    } else {
      const remision = cleanText(pick(obj, ["remision", "numero_remision", "n_remision", "documento"]));
      const referencia = cleanText(pick(obj, ["referencia_limpia", "referencia", "codigo", "sku", "producto_codigo"]));
      const descripcion = cleanText(pick(obj, ["descripcion_limpia", "descripcion", "producto", "nombre_producto"]));
      if (!remision || !referencia || !descripcion) continue;
      rows.push({
        fecha, remision,
        cliente: cleanText(pick(obj, ["cliente_limpio", "cliente", "nombre_cliente", "razon_social"])) || "Sin cliente",
        estado: cleanText(pick(obj, ["estado", "status"])),
        referencia, descripcion,
        cantidad: parseNumberCo(pick(obj, ["cantidad", "cant", "unidades"])),
        pendiente_facturar: parseNumberCo(pick(obj, ["pend_fact", "pendiente_facturar", "pendiente"])),
        facturada: parseNumberCo(pick(obj, ["facturada", "cantidad_facturada"])),
        devuelta: parseNumberCo(pick(obj, ["devuelta", "cantidad_devuelta"])),
        valor_unitario: parseNumberCo(pick(obj, ["valor_unitario", "precio_unitario", "precio"])),
        total: parseNumberCo(pick(obj, ["total", "valor_total", "valor"])),
        anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)), archivo_origen: sourceFile,
      });
    }
  }
  return rows;
}

function parseSotosoftRow(cells: unknown[], sourceFile: string, forcedType?: HistoricalType): Record<string, unknown> | null {
  const type = forcedType || rowType(cells);
  if (!type) return null;
  const dateIndex = cells.findIndex((value, index) => index >= 1 && !!isoDate(value));
  if (dateIndex < 0) return null;
  const fecha = isoDate(cells[dateIndex]);
  if (!fecha) return null;
  if (type === "ventas_historicas") {
    const factura = cleanText(cells[dateIndex + 1]); const cliente = cleanText(cells[dateIndex + 2]);
    if (!factura || !cliente) return null;
    const sellerMarker = cells.findIndex((v) => cleanText(v).toUpperCase() === "VENDEDOR :");
    const branchMarker = cells.findIndex((v) => cleanText(v).toUpperCase() === "ALMACEN :");
    return { fecha, factura, cliente, vendedor: sellerMarker >= 0 ? cleanText(cells[sellerMarker + 1]) : "Sin vendedor", almacen: branchMarker >= 0 ? cleanText(cells[branchMarker + 1]) : "Sin almacén", base: parseNumberCo(cells[dateIndex + 3]), iva: parseNumberCo(cells[dateIndex + 4]), total: parseNumberCo(cells[dateIndex + 5]), anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)), archivo_origen: sourceFile };
  }
  if (type === "compras_historicas") {
    const facturaProveedor = cleanText(cells[dateIndex - 1]); const proveedor = cleanText(cells[dateIndex + 2]);
    if (!facturaProveedor || !proveedor) return null;
    return { fecha, factura_proveedor: facturaProveedor, documento_proveedor: cleanText(cells[dateIndex + 1]), proveedor, valor_total: parseNumberCo(cells[dateIndex + 3]), saldo: parseNumberCo(cells[dateIndex + 4]), estado: cleanText(cells[dateIndex + 5]), anio: Number(fecha.slice(0, 4)), mes: Number(fecha.slice(5, 7)), archivo_origen: sourceFile };
  }
  if (type === "remisiones_historicas") {
    const marker = (name: string) => cells.findIndex((value) => normalizedHeader(value) === name);
    const remisionIndex = marker("n_remision") >= 0 ? marker("n_remision") : marker("numero_remision");
    const fechaMarker = marker("fecha");
    const clienteMarker = marker("cliente");
    const estadoMarker = marker("estado");
    const remision = remisionIndex >= 0 ? cleanText(cells[remisionIndex + 1]) : "";
    const fechaReal = fechaMarker >= 0 ? isoDate(cells[fechaMarker + 1]) : fecha;
    const cliente = clienteMarker >= 0 ? cleanText(cells[clienteMarker + 1]) : "Sin cliente";
    const estado = estadoMarker >= 0 ? cleanText(cells[estadoMarker + 1]) : "";
    const detailStart = estadoMarker >= 0 ? estadoMarker + 2 : dateIndex + 5;
    const referencia = cleanText(cells[detailStart]);
    const descripcion = cleanText(cells[detailStart + 1]);
    if (!fechaReal || !remision || !referencia || !descripcion) return null;
    return {
      fecha: fechaReal,
      remision,
      cliente: cliente || "Sin cliente",
      estado,
      referencia,
      descripcion,
      cantidad: parseNumberCo(cells[detailStart + 2]),
      pendiente_facturar: parseNumberCo(cells[detailStart + 3]),
      facturada: parseNumberCo(cells[detailStart + 4]),
      devuelta: parseNumberCo(cells[detailStart + 5]),
      valor_unitario: parseNumberCo(cells[detailStart + 6]),
      total: parseNumberCo(cells[detailStart + 7]),
      anio: Number(fechaReal.slice(0, 4)),
      mes: Number(fechaReal.slice(5, 7)),
      archivo_origen: sourceFile,
    };
  }
  return null;
}

function rowsFromWorkbook(buffer: ArrayBuffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, dense: true });
  const result: unknown[][] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    result.push(...XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" }));
  }
  return result;
}

export async function parseHistoricalFile(file: File, forcedType?: HistoricalType): Promise<ParsedHistoricalFile> {
  let rawRows: unknown[][] = [];
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = await file.text();
    const parsed = Papa.parse<unknown[]>(text, { skipEmptyLines: true, delimiter: "" });
    rawRows = parsed.data;
  } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    rawRows = rowsFromWorkbook(await file.arrayBuffer());
  } else throw new Error(`Formato no compatible: ${file.name}`);

  const detected = forcedType || rawRows.map((r) => rowType(r)).find(Boolean) || null;
  if (!detected) throw new Error(`No se pudo identificar el tipo de histórico en ${file.name}.`);

  let rows = parseFlatRows(rawRows, detected, file.name);
  if (!rows.length) {
    rows = rawRows.map((raw) => parseSotosoftRow(raw, file.name, detected)).filter(Boolean) as Record<string, unknown>[];
  }
  if (!rows.length) throw new Error(`${file.name} no contiene registros históricos válidos. Revise que incluya fecha y las columnas propias de ${detected.replace("_historicas", "")}.`);
  const period = extractPeriod(rows);
  return { type: detected, sourceFile: file.name, rows, rejected: Math.max(0, rawRows.length - rows.length), periodFrom: period.from, periodTo: period.to };
}
