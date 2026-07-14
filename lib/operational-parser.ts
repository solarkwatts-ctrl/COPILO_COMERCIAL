import Papa from "papaparse";
import * as XLSX from "xlsx";

export type OperationalType =
  | "ventas"
  | "cartera"
  | "inventario"
  | "clientes"
  | "comerciales"
  | "metas"
  | "productos"
  | "sucursales"
  | "ventas_perdidas";

export type ParsedOperationalFile = {
  rows: Record<string, unknown>[];
  rejected: number;
  headers: string[];
  warnings: string[];
};

const ALIASES: Record<OperationalType, Record<string, string[]>> = {
  ventas: {
    fecha: ["fecha", "fecha_factura", "fecha_documento", "date"],
    factura: ["factura", "numero_factura", "nro_factura", "documento", "comprobante"],
    cantidad: ["cantidad", "cant", "unidades", "qty"],
    valor: ["valor", "total", "valor_total", "neto", "venta", "importe"],
    costo: ["costo", "costo_total", "valor_costo"],
    comercial: ["comercial", "vendedor", "asesor", "empleado", "nombre_vendedor"],
    comercial_codigo: ["codigo_comercial", "codigo_vendedor", "cod_vendedor"],
    cliente: ["cliente", "nombre_cliente", "razon_social", "tercero"],
    cliente_nit: ["nit", "nit_cliente", "documento_cliente", "identificacion_cliente"],
    producto: ["producto", "nombre_producto", "descripcion", "articulo"],
    producto_codigo: ["sku", "codigo", "referencia", "codigo_producto"],
    sucursal: ["sucursal", "almacen", "bodega", "sede"],
  },
  cartera: {
    factura: ["factura", "numero_factura", "documento", "comprobante"],
    fecha_emision: ["fecha_emision", "fecha_factura", "fecha_documento", "fecha"],
    fecha_vencimiento: ["fecha_vencimiento", "vencimiento", "vence", "fecha_limite"],
    saldo: ["saldo", "saldo_pendiente", "valor_cartera", "total_deuda", "deuda"],
    dias_mora: ["dias_mora", "dias_vencidos", "mora", "edad"],
    riesgo: ["riesgo", "clasificacion", "nivel_riesgo"],
    bloqueado: ["bloqueado", "bloqueo", "estado_bloqueo"],
    promesa_pago: ["promesa_pago", "fecha_promesa", "compromiso_pago"],
    accion: ["accion", "gestion", "observacion", "comentario"],
    cliente: ["cliente", "nombre_cliente", "razon_social", "tercero"],
    cliente_nit: ["nit", "nit_cliente", "documento_cliente", "identificacion"],
    comercial: ["comercial", "vendedor", "asesor", "responsable"],
  },
  inventario: {
    producto: ["producto", "nombre_producto", "descripcion", "articulo"],
    producto_codigo: ["sku", "codigo", "referencia", "codigo_producto"],
    sucursal: ["sucursal", "almacen", "bodega", "sede"],
    stock: ["stock", "existencia", "saldo", "cantidad_disponible", "disponible"],
    costo: ["costo", "costo_unitario", "valor_costo"],
    precio: ["precio", "precio_venta", "valor_venta"],
    stock_seguridad: ["stock_seguridad", "minimo", "stock_minimo"],
    punto_pedido: ["punto_pedido", "reorden", "punto_reorden"],
    lead_time_dias: ["lead_time_dias", "lead_time", "tiempo_reposicion", "dias_reposicion"],
    proveedor: ["proveedor", "nombre_proveedor", "tercero"],
    estado: ["estado", "status"],
  },
  clientes: {
    nombre: ["nombre", "cliente", "nombre_cliente", "razon_social", "tercero"],
    nit: ["nit", "documento", "identificacion", "nit_cliente"],
    sector: ["sector", "actividad", "segmento"],
    ciudad: ["ciudad", "municipio", "localidad"],
    activo: ["activo", "estado", "habilitado"],
    ultima_compra: ["ultima_compra", "fecha_ultima_compra", "ultimo_movimiento"],
    comercial: ["comercial", "vendedor", "asesor"],
    sucursal: ["sucursal", "almacen", "sede"],
  },
  comerciales: {
    nombre: ["nombre", "comercial", "vendedor", "asesor", "empleado"],
    codigo: ["codigo", "codigo_comercial", "codigo_vendedor", "id_vendedor"],
    activo: ["activo", "estado", "habilitado"],
    sucursal: ["sucursal", "almacen", "sede"],
    zona: ["zona", "region", "territorio"],
  },
  metas: {
    comercial: ["comercial", "vendedor", "asesor"],
    comercial_codigo: ["codigo_comercial", "codigo_vendedor", "codigo"],
    sucursal: ["sucursal", "almacen", "sede"],
    anio: ["anio", "year", "ano"],
    mes: ["mes", "month"],
    valor: ["valor", "meta", "meta_ventas", "objetivo"],
    tipo: ["tipo", "periodicidad", "clase_meta"],
  },
  productos: {
    nombre: ["nombre", "producto", "nombre_producto", "descripcion", "articulo"],
    codigo: ["codigo", "codigo_producto", "referencia"],
    sku: ["sku", "referencia", "codigo_sku"],
    categoria: ["categoria", "linea", "familia", "grupo"],
    abc: ["abc", "clasificacion_abc"],
    participacion: ["participacion", "porcentaje", "peso"],
    activo: ["activo", "estado", "habilitado"],
  },
  sucursales: {
    nombre: ["nombre", "sucursal", "almacen", "sede", "bodega"],
    ciudad: ["ciudad", "municipio", "localidad"],
    zona: ["zona", "region", "territorio"],
    activo: ["activo", "estado", "habilitado"],
  },
  ventas_perdidas: {
    fecha: ["fecha", "fecha_reporte", "date"],
    motivo: ["motivo", "causa", "razon"],
    valor: ["valor", "valor_estimado", "venta_perdida", "monto"],
    observacion: ["observacion", "comentario", "detalle"],
    evidencia_url: ["evidencia_url", "evidencia", "archivo", "foto"],
    comercial: ["comercial", "vendedor", "asesor", "responsable"],
    cliente: ["cliente", "nombre_cliente", "razon_social"],
    cliente_nit: ["nit", "nit_cliente", "documento_cliente"],
    producto: ["producto", "nombre_producto", "descripcion"],
    producto_codigo: ["sku", "codigo", "referencia", "codigo_producto"],
  },
};

const REQUIRED: Record<OperationalType, string[][]> = {
  ventas: [["fecha"], ["valor"], ["factura", "cliente", "producto_codigo", "producto"]],
  cartera: [["saldo"], ["cliente", "cliente_nit", "factura"]],
  inventario: [["stock"], ["producto_codigo", "producto"]],
  clientes: [["nombre"]],
  comerciales: [["nombre"]],
  metas: [["anio"], ["mes"], ["valor"]],
  productos: [["nombre", "codigo", "sku"]],
  sucursales: [["nombre"]],
  ventas_perdidas: [["motivo"], ["valor"]],
};

export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function clean(value: unknown): string {
  return String(value ?? "").replace(/\u00a0/g, " ").trim();
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let raw = clean(value).replace(/[$%\s]/g, "");
  if (!raw) return 0;
  if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(raw)) raw = raw.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(,\d{3})*\.\d+$/.test(raw)) raw = raw.replace(/,/g, "");
  else if (/^-?\d+,\d+$/.test(raw)) raw = raw.replace(",", ".");
  else raw = raw.replace(/,/g, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const text = clean(value).toLowerCase();
  return ["1", "si", "sí", "true", "activo", "activa", "bloqueado", "habilitado"].includes(text);
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20000) {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const text = clean(value);
  if (!text) return null;
  let m = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function findHeader(rawRows: unknown[][], type: OperationalType): { index: number; headers: string[] } | null {
  const aliasSet = new Set(Object.values(ALIASES[type]).flat().map(normalizeHeader));
  let best: { index: number; headers: string[]; score: number } | null = null;
  for (let index = 0; index < Math.min(rawRows.length, 80); index += 1) {
    const headers = rawRows[index].map(normalizeHeader);
    const score = headers.filter((h) => aliasSet.has(h) || [...aliasSet].some((a) => h.includes(a) || a.includes(h))).length;
    if (!best || score > best.score) best = { index, headers, score };
  }
  return best && best.score >= 1 ? best : null;
}

function pick(source: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases.map(normalizeHeader)) {
    if (source[alias] !== undefined && clean(source[alias]) !== "") return source[alias];
  }
  for (const [key, value] of Object.entries(source)) {
    if (clean(value) === "") continue;
    if (aliases.some((alias) => key.includes(normalizeHeader(alias)) || normalizeHeader(alias).includes(key))) return value;
  }
  return "";
}

function canonicalRow(source: Record<string, unknown>, type: OperationalType): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [field, aliases] of Object.entries(ALIASES[type])) {
    const value = pick(source, aliases);
    if (["fecha", "fecha_emision", "fecha_vencimiento", "promesa_pago", "ultima_compra"].includes(field)) {
      result[field] = parseDate(value);
    } else if (["cantidad", "valor", "costo", "saldo", "dias_mora", "stock", "precio", "stock_seguridad", "punto_pedido", "lead_time_dias", "anio", "mes", "participacion"].includes(field)) {
      result[field] = parseNumber(value);
    } else if (["activo", "bloqueado"].includes(field)) {
      result[field] = parseBoolean(value);
    } else {
      result[field] = clean(value);
    }
  }
  if (type === "metas" && !result.tipo) result.tipo = "mensual";
  if (["clientes", "comerciales", "productos", "sucursales"].includes(type) && result.activo === undefined) result.activo = true;
  if (type === "ventas_perdidas" && !result.fecha) result.fecha = new Date().toISOString().slice(0, 10);
  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== "" && value !== null && value !== undefined));
}

function validRow(row: Record<string, unknown>, type: OperationalType): boolean {
  return REQUIRED[type].every((group) => group.some((field) => row[field] !== undefined && row[field] !== "" && row[field] !== null));
}

function dedupeKey(row: Record<string, unknown>, type: OperationalType): string {
  const keys: Record<OperationalType, string[]> = {
    ventas: ["factura", "fecha", "producto_codigo", "producto", "cliente"],
    cartera: ["factura", "cliente_nit", "cliente", "fecha_vencimiento"],
    inventario: ["producto_codigo", "producto", "sucursal"],
    clientes: ["nit", "nombre"],
    comerciales: ["codigo", "nombre"],
    metas: ["comercial_codigo", "comercial", "sucursal", "anio", "mes", "tipo"],
    productos: ["sku", "codigo", "nombre"],
    sucursales: ["nombre", "ciudad"],
    ventas_perdidas: ["fecha", "motivo", "valor", "cliente", "producto_codigo"],
  };
  return keys[type].map((key) => normalizeHeader(row[key])).join("|");
}


function parseSotosoftOperationalRow(cells: unknown[], type: OperationalType): Record<string, unknown> | null {
  const joined = cells.slice(0, 20).map(clean).join(" ").toUpperCase();

  if (type === "ventas" && joined.includes("FACTURA VENTA POR EMPLEADO")) {
    const marker = (name: string) => cells.findIndex((value) => normalizeHeader(value) === name);
    const fechaIndex = marker("fecha");
    const facturaIndex = marker("n_factura") >= 0 ? marker("n_factura") : marker("numero_factura");
    const nombreIndex = marker("nombre");
    const baseIndex = marker("base");
    const ivaIndex = marker("iva");
    const totalIndex = marker("total");
    const vendedorIndex = marker("vendedor");
    const almacenIndex = marker("almacen");
    const fecha = fechaIndex >= 0 ? parseDate(cells[fechaIndex + 10]) || parseDate(cells[fechaIndex + 1]) : null;
    const offset = fechaIndex >= 0 ? fechaIndex + 10 : -1;
    const factura = offset >= 0 ? clean(cells[offset + 1]) : (facturaIndex >= 0 ? clean(cells[facturaIndex + 1]) : "");
    const cliente = offset >= 0 ? clean(cells[offset + 2]) : (nombreIndex >= 0 ? clean(cells[nombreIndex + 1]) : "");
    const total = offset >= 0 ? parseNumber(cells[offset + 5]) : (totalIndex >= 0 ? parseNumber(cells[totalIndex + 1]) : 0);
    if (!fecha || !factura || !cliente || !total) return null;
    return {
      fecha, factura, cantidad: 1, valor: total, costo: 0,
      comercial: vendedorIndex >= 0 ? clean(cells[vendedorIndex + 1]) : "Sin vendedor",
      cliente,
      sucursal: almacenIndex >= 0 ? clean(cells[almacenIndex + 1]) : "Sin almacén",
    };
  }

  return null;
}
function workbookRows(buffer: ArrayBuffer): unknown[][] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, dense: true });
  const rows: unknown[][] = [];
  for (const sheetName of workbook.SheetNames) {
    rows.push(...XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: true, defval: "" }));
  }
  return rows;
}

export async function parseOperationalFile(file: File, type: OperationalType): Promise<ParsedOperationalFile> {
  const lower = file.name.toLowerCase();
  let rawRows: unknown[][];
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const parsed = Papa.parse<unknown[]>(await file.text(), { skipEmptyLines: true, delimiter: "" });
    rawRows = parsed.data;
  } else if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
    rawRows = workbookRows(await file.arrayBuffer());
  } else {
    throw new Error(`Formato no compatible: ${file.name}`);
  }

  const header = findHeader(rawRows, type);

  const unique = new Map<string, Record<string, unknown>>();
  let rejected = 0;
  if (header) {
    for (const cells of rawRows.slice(header.index + 1)) {
      const source: Record<string, unknown> = {};
      header.headers.forEach((headerName, index) => { if (headerName) source[headerName] = cells[index]; });
      if (!Object.values(source).some((value) => clean(value) !== "")) continue;
      const row = canonicalRow(source, type);
      if (!validRow(row, type)) { rejected += 1; continue; }
      unique.set(dedupeKey(row, type), row);
    }
  }

  let rows = [...unique.values()];

  // Compatibilidad con exportaciones Sotosoft donde cada registro incluye
  // los rótulos del reporte dentro de la misma fila.
  if (!rows.length) {
    const fallback = new Map<string, Record<string, unknown>>();
    for (const cells of rawRows) {
      const row = parseSotosoftOperationalRow(cells, type);
      if (row && validRow(row, type)) fallback.set(dedupeKey(row, type), row);
    }
    rows = [...fallback.values()];
  }

  if (!rows.length) throw new Error(`${file.name} no contiene registros válidos para ${type}.`);

  return {
    rows,
    rejected,
    headers: header?.headers.filter(Boolean) || [],
    warnings: rejected ? [`${rejected} fila(s) fueron rechazadas por datos obligatorios faltantes.`] : [],
  };
}
