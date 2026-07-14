import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Zone = { id?: string; nombre: string; responsable?: string; activo?: boolean };
type Branch = { id?: string; nombre: string; ciudad?: string; zona_id?: string | null; activo?: boolean };

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"], { allowInactiveCompany: true });
    const db = supabaseAdmin();
    const [{ data: empresa, error: e1 }, { data: zonas, error: e2 }, { data: sucursales, error: e3 }, { data: roles, error: e4 }, { data: demo, error: e5 }] = await Promise.all([
      db.from("empresa").select("*").eq("id", profile.empresa_id).single(),
      db.from("zonas").select("*").eq("empresa_id", profile.empresa_id).order("nombre"),
      db.from("sucursales").select("*").eq("empresa_id", profile.empresa_id).order("nombre"),
      db.from("roles").select("*").order("nombre"),
      db.from("configuracion_demo").select("*").eq("empresa_id", profile.empresa_id).maybeSingle()
    ]);
    const error = e1 || e2 || e3 || e4 || e5;
    if (error) throw error;
    return NextResponse.json({ empresa, zonas: zonas || [], sucursales: sucursales || [], roles: roles || [], demo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible cargar la configuración." }, { status: e?.message === "FORBIDDEN" ? 403 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"], { allowInactiveCompany: true });
    const db = supabaseAdmin();
    const body = await req.json();
    const empresa = body.empresa || {};
    const zonas: Zone[] = body.zonas || [];
    const sucursales: Branch[] = body.sucursales || [];

    const { error: empresaError } = await db.from("empresa").update({
      nombre: empresa.nombre || "Empresa",
      nombre_comercial: empresa.nombre_comercial || null,
      nit: empresa.nit || null,
      eslogan: empresa.eslogan || null,
      sector: empresa.sector || null,
      ciudad: empresa.ciudad || null,
      direccion: empresa.direccion || null,
      telefono: empresa.telefono || null,
      correo: empresa.correo || null,
      sitio_web: empresa.sitio_web || null,
      moneda: empresa.moneda || "COP",
      zona_horaria: empresa.zona_horaria || "America/Bogota",
      logo_url: empresa.logo_url || null,
      demo_activo: !!empresa.demo_activo,
      tipo_entorno: empresa.tipo_entorno || (empresa.demo_activo ? "demo" : "real"),
      actualizado_en: new Date().toISOString()
    }).eq("id", profile.empresa_id);
    if (empresaError) throw empresaError;

    for (const zona of zonas) {
      if (!zona.nombre?.trim()) continue;
      if (zona.id) {
        const { error } = await db.from("zonas").update({ nombre: zona.nombre.trim(), responsable: zona.responsable || null, activo: zona.activo !== false }).eq("id", zona.id).eq("empresa_id", profile.empresa_id);
        if (error) throw error;
      } else {
        const { error } = await db.from("zonas").insert({ empresa_id: profile.empresa_id, nombre: zona.nombre.trim(), responsable: zona.responsable || null, activo: zona.activo !== false });
        if (error && error.code !== "23505") throw error;
      }
    }

    for (const branch of sucursales) {
      if (!branch.nombre?.trim()) continue;
      const payload = { nombre: branch.nombre.trim(), ciudad: branch.ciudad || null, zona_id: branch.zona_id || null, activo: branch.activo !== false };
      if (branch.id) {
        const { error } = await db.from("sucursales").update(payload).eq("id", branch.id).eq("empresa_id", profile.empresa_id);
        if (error) throw error;
      } else {
        const { error } = await db.from("sucursales").insert({ empresa_id: profile.empresa_id, ...payload });
        if (error && error.code !== "23505") throw error;
      }
    }

    await db.from("configuracion_demo").upsert({ empresa_id: profile.empresa_id, activo: !!empresa.demo_activo, actualizado_en: new Date().toISOString() }, { onConflict: "empresa_id" });
    await db.from("auditoria").insert({ empresa_id: profile.empresa_id, usuario_id: profile.id, usuario_nombre: profile.nombre, rol: profile.rol, modulo: "Administración", accion: "Actualizar configuración", detalle: `Modo ${empresa.demo_activo ? "demo" : "real"}`, tabla_afectada: "empresa" });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible guardar." }, { status: 500 });
  }
}
