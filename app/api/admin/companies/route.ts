import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    const db = supabaseAdmin();
    let query = db.from("empresa").select("id,nombre,nombre_comercial,nit,tipo_entorno,demo_activo,activo,ciudad,sector,logo_url,created_at,actualizado_en").order("nombre");
    if (!profile.es_superadmin) {
      const { data: links } = await db.from("usuarios_empresas").select("empresa_id").eq("usuario_id", profile.id).eq("activo", true);
      const ids = Array.from(new Set([profile.empresa_id, ...(links || []).map(x => x.empresa_id)]));
      query = query.in("id", ids);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ empresas: data || [], active_company_id: profile.empresa_id, superadmin: profile.es_superadmin });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible consultar empresas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    if (!profile.es_superadmin) return NextResponse.json({ error: "Solo el Superadministrador puede crear empresas." }, { status: 403 });
    const db = supabaseAdmin();
    const body = await req.json();
    const nombre = String(body.nombre || "").trim();
    if (!nombre) return NextResponse.json({ error: "El nombre de la empresa es obligatorio." }, { status: 400 });
    const payload = {
      nombre,
      nombre_comercial: body.nombre_comercial || nombre,
      nit: body.nit || null,
      sector: body.sector || null,
      ciudad: body.ciudad || null,
      correo: body.correo || null,
      tipo_entorno: body.tipo_entorno === "demo" ? "demo" : "real",
      demo_activo: body.tipo_entorno === "demo",
      activo: body.activo !== false,
      moneda: body.moneda || "COP",
      zona_horaria: body.zona_horaria || "America/Bogota"
    };
    const { data: company, error } = await db.from("empresa").insert(payload).select("*").single();
    if (error) throw error;
    await db.from("configuracion_demo").insert({ empresa_id: company.id, activo: payload.demo_activo, datos_cargados: false });
    await db.from("usuarios_empresas").upsert({ usuario_id: profile.id, empresa_id: company.id, rol_id: null, activo: true }, { onConflict: "usuario_id,empresa_id" });
    await db.from("auditoria").insert({ empresa_id: company.id, usuario_id: profile.id, usuario_nombre: profile.nombre, rol: profile.rol, modulo: "Empresas", accion: "Crear empresa", detalle: `${nombre} · ${payload.tipo_entorno}` });
    return NextResponse.json({ ok: true, empresa: company });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible crear la empresa." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    if (!profile.es_superadmin) return NextResponse.json({ error: "Solo el Superadministrador puede cambiar el estado global." }, { status: 403 });
    const db = supabaseAdmin();
    const body = await req.json();
    const { data, error } = await db.from("empresa").update({ activo: !!body.activo, actualizado_en: new Date().toISOString() }).eq("id", body.id).select("id,nombre,activo").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, empresa: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible actualizar la empresa." }, { status: 500 });
  }
}
