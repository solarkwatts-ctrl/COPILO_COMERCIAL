import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { OperationalType, parseOperationalFile } from "@/lib/operational-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABLES: Record<OperationalType, string> = {
  ventas: "ventas",
  cartera: "cartera",
  inventario: "inventario",
  clientes: "clientes",
  comerciales: "comerciales",
  metas: "metas",
  productos: "productos",
  sucursales: "sucursales",
  ventas_perdidas: "ventas_perdidas",
};

const UPDATE_KEYS: Partial<Record<OperationalType, string[]>> = {
  ventas: ["factura"],
  cartera: ["factura"],
  clientes: ["nit", "nombre"],
  comerciales: ["codigo", "nombre"],
  productos: ["sku", "codigo", "nombre"],
  sucursales: ["nombre"],
};

function isOperationalType(value: string): value is OperationalType {
  return Object.prototype.hasOwnProperty.call(TABLES, value);
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

async function getOrCreateSucursal(db: ReturnType<typeof supabaseAdmin>, empresaId: string, name: unknown): Promise<string | null> {
  const nombre = text(name);
  if (!nombre) return null;
  const existing = await db.from("sucursales").select("id").eq("empresa_id", empresaId).ilike("nombre", nombre).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;
  const created = await db.from("sucursales").insert({ empresa_id: empresaId, nombre, activo: true }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id;
}

async function getOrCreateCommercial(db: ReturnType<typeof supabaseAdmin>, empresaId: string, row: Record<string, unknown>): Promise<string | null> {
  const codigo = text(row.comercial_codigo ?? row.codigo);
  const nombre = text(row.comercial ?? row.nombre);
  if (!codigo && !nombre) return null;
  let query = db.from("comerciales").select("id").eq("empresa_id", empresaId);
  query = codigo ? query.eq("codigo", codigo) : query.ilike("nombre", nombre);
  const existing = await query.limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;
  const created = await db.from("comerciales").insert({ empresa_id: empresaId, codigo: codigo || null, nombre: nombre || codigo, activo: true }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id;
}

async function getOrCreateClient(db: ReturnType<typeof supabaseAdmin>, empresaId: string, row: Record<string, unknown>): Promise<string | null> {
  const nit = text(row.cliente_nit ?? row.nit);
  const nombre = text(row.cliente ?? row.nombre);
  if (!nit && !nombre) return null;
  let query = db.from("clientes").select("id").eq("empresa_id", empresaId);
  query = nit ? query.eq("nit", nit) : query.ilike("nombre", nombre);
  const existing = await query.limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;
  const created = await db.from("clientes").insert({ empresa_id: empresaId, nit: nit || null, nombre: nombre || nit, activo: true }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id;
}

async function getOrCreateProduct(db: ReturnType<typeof supabaseAdmin>, empresaId: string, row: Record<string, unknown>): Promise<string | null> {
  const codigo = text(row.producto_codigo ?? row.codigo);
  const sku = text(row.sku || codigo);
  const nombre = text(row.producto ?? row.nombre);
  if (!codigo && !sku && !nombre) return null;
  let query = db.from("productos").select("id").eq("empresa_id", empresaId);
  if (sku) query = query.eq("sku", sku);
  else if (codigo) query = query.eq("codigo", codigo);
  else query = query.ilike("nombre", nombre);
  const existing = await query.limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;
  const created = await db.from("productos").insert({ empresa_id: empresaId, codigo: codigo || null, sku: sku || null, nombre: nombre || codigo || sku, activo: true }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id;
}

async function enrichRows(
  db: ReturnType<typeof supabaseAdmin>,
  type: OperationalType,
  rows: Record<string, unknown>[],
  empresaId: string,
  isDemo: boolean,
): Promise<Record<string, unknown>[]> {
  const result: Record<string, unknown>[] = [];
  for (const source of rows) {
    const row = { ...source, empresa_id: empresaId, es_demo: isDemo } as Record<string, unknown>;

    if (type === "ventas") {
      row.comercial_id = await getOrCreateCommercial(db, empresaId, source);
      row.cliente_id = await getOrCreateClient(db, empresaId, source);
      row.producto_id = await getOrCreateProduct(db, empresaId, source);
      row.sucursal_id = await getOrCreateSucursal(db, empresaId, source.sucursal);
    } else if (type === "cartera") {
      row.comercial_id = await getOrCreateCommercial(db, empresaId, source);
      row.cliente_id = await getOrCreateClient(db, empresaId, source);
    } else if (type === "inventario") {
      row.producto_id = await getOrCreateProduct(db, empresaId, source);
      row.sucursal_id = await getOrCreateSucursal(db, empresaId, source.sucursal);
    } else if (type === "metas") {
      row.comercial_id = await getOrCreateCommercial(db, empresaId, source);
      row.sucursal_id = await getOrCreateSucursal(db, empresaId, source.sucursal);
    } else if (type === "ventas_perdidas") {
      row.comercial_id = await getOrCreateCommercial(db, empresaId, source);
      row.cliente_id = await getOrCreateClient(db, empresaId, source);
      row.producto_id = await getOrCreateProduct(db, empresaId, source);
    } else if (type === "clientes") {
      row.comercial_id = await getOrCreateCommercial(db, empresaId, source);
      row.sucursal_id = await getOrCreateSucursal(db, empresaId, source.sucursal);
      row.nombre = source.nombre;
      row.nit = source.nit || null;
    } else if (type === "comerciales") {
      row.sucursal_id = await getOrCreateSucursal(db, empresaId, source.sucursal);
      row.nombre = source.nombre;
      row.codigo = source.codigo || null;
    } else if (type === "productos") {
      row.nombre = source.nombre || source.codigo || source.sku;
    } else if (type === "sucursales") {
      row.nombre = source.nombre;
    }

    for (const semantic of [
      "comercial", "comercial_codigo", "cliente", "cliente_nit", "producto", "producto_codigo", "sucursal", "zona",
    ]) delete row[semantic];

    result.push(row);
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador", "Asistente Comercial"]);
    const type = req.nextUrl.searchParams.get("type") || "ventas";
    if (!isOperationalType(type)) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    const db = supabaseAdmin();
    const { count, error } = await db.from(TABLES[type]).select("id", { count: "exact", head: true }).eq("empresa_id", profile.empresa_id);
    if (error) throw error;
    return NextResponse.json({ ok: true, registros_actuales: count || 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No fue posible consultar la base.";
    return NextResponse.json({ error: message }, { status: message === "FORBIDDEN" ? 403 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador", "Asistente Comercial"]);
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const typeValue = String(form.get("type") || "");
    const mode = String(form.get("mode") || "reemplazar");
    const requestedKey = String(form.get("key") || "");

    if (!file || !isOperationalType(typeValue)) return NextResponse.json({ error: "Archivo o tipo inválido." }, { status: 400 });
    if (!["reemplazar", "agregar", "actualizar"].includes(mode)) return NextResponse.json({ error: "Modo de carga inválido." }, { status: 400 });

    const parsed = await parseOperationalFile(file, typeValue);
    const db = supabaseAdmin();
    const { data: company, error: companyError } = await db
      .from("empresa")
      .select("id,tipo_entorno,demo_activo,activo")
      .eq("id", profile.empresa_id)
      .maybeSingle();
    if (companyError) throw companyError;
    if (!company?.id) {
      return NextResponse.json(
        { error: "La empresa activa ya no existe en Supabase. Vuelva a Empresas y usuarios, selecciónela nuevamente y repita la carga." },
        { status: 409 }
      );
    }
    if (company.activo === false) {
      return NextResponse.json({ error: "La empresa activa está suspendida." }, { status: 409 });
    }
    const isDemo = company?.tipo_entorno === "demo" || company?.demo_activo === true;
    const rows = await enrichRows(db, typeValue, parsed.rows, company.id, isDemo);

    let key: string | null = null;
    if (mode === "actualizar") {
      const available = Object.keys(rows[0] || {});
      key = requestedKey || UPDATE_KEYS[typeValue]?.find((candidate) => available.includes(candidate)) || null;
      if (!key) return NextResponse.json({ error: `No se encontró una clave válida para actualizar ${typeValue}. Use Reemplazar o Agregar.` }, { status: 400 });
    }

    const { data: result, error: importError } = await db.rpc("importar_base_empresa", {
      p_tabla: TABLES[typeValue], p_empresa_id: company.id, p_filas: rows, p_modo: mode, p_clave: key,
    });
    if (importError) throw importError;

    const path = `${company.id}/${typeValue}/${Date.now()}-${file.name}`;
    const upload = await db.storage.from("archivos-cargados").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });

    await db.from("cargas_archivos").insert({
      empresa_id: company.id,
      tipo_archivo: typeValue,
      nombre_archivo: file.name,
      total_filas: parsed.rows.length + parsed.rejected,
      filas_validas: rows.length,
      filas_eliminadas: Number(result?.eliminadas || 0),
      estado: upload.error ? "cargado_sin_archivo" : mode,
      creado_por: profile.nombre,
    });

    await db.from("auditoria").insert({
      empresa_id: company.id,
      usuario_id: profile.id,
      usuario_nombre: profile.nombre,
      rol: profile.rol,
      modulo: "Cargas",
      accion: `${mode} base ${typeValue}`,
      detalle: `${file.name}: ${rows.length} filas válidas, ${parsed.rejected} rechazadas y ${Number(result?.eliminadas || 0)} anteriores eliminadas`,
      tabla_afectada: TABLES[typeValue],
      metadata: { modo: mode, clave: key, archivo_storage: upload.error ? null : path, es_demo: isDemo, advertencias: parsed.warnings },
    });

    return NextResponse.json({
      ok: true,
      registros: Number(result?.insertadas || rows.length),
      eliminados: Number(result?.eliminadas || 0),
      rechazados: parsed.rejected,
      advertencias: parsed.warnings,
      modo: mode,
      clave: key,
      advertencia_archivo: upload.error?.message || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message || "No fue posible importar la base.";
    console.error("ERROR IMPORTACIÓN GENÉRICA:", error);
    return NextResponse.json({ error: message }, { status: message === "FORBIDDEN" ? 403 : 500 });
  }
}
