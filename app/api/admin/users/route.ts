import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    const db = supabaseAdmin();
    const [{ data: usuarios, error }, { data: roles }, { data: sucursales }, { data: zonas }] = await Promise.all([
      db.from("usuarios").select("id,nombre,usuario,correo,activo,rol_id,sucursal_id,auth_user_id,roles(nombre),comerciales(id,zona_id,sucursal_id,codigo)").eq("empresa_id", profile.empresa_id).order("nombre"),
      db.from("roles").select("id,nombre,descripcion,activo,nombre_visible,saludo").eq("activo", true).order("nombre"),
      db.from("sucursales").select("id,nombre,zona_id,activo").eq("empresa_id", profile.empresa_id).order("nombre"),
      db.from("zonas").select("id,nombre,activo").eq("empresa_id", profile.empresa_id).order("nombre")
    ]);
    if (error) throw error;
    return NextResponse.json({ usuarios: usuarios || [], roles: roles || [], sucursales: sucursales || [], zonas: zonas || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible consultar usuarios." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    const db = supabaseAdmin();
    const body = await req.json();
    const email = String(body.correo || "").trim().toLowerCase();
    const nombre = String(body.nombre || "").trim();
    const usuario = String(body.usuario || email.split("@")[0] || "usuario").trim();
    if (!email || !nombre || !body.rol_id) return NextResponse.json({ error: "Nombre, correo y rol son obligatorios." }, { status: 400 });

    let authUserId = body.auth_user_id || null;
    if (!body.id) {
      const password = String(body.password || "");
      if (password.length < 8) return NextResponse.json({ error: "La contraseña inicial debe tener al menos 8 caracteres." }, { status: 400 });
      const { data: created, error: authError } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre, empresa_id: profile.empresa_id } });
      if (authError) throw authError;
      authUserId = created.user.id;
    }

    const payload = { empresa_id: profile.empresa_id, rol_id: body.rol_id, sucursal_id: body.sucursal_id || null, auth_user_id: authUserId, nombre, usuario, correo: email, activo: body.activo !== false, actualizado_en: new Date().toISOString() };
    let usuarioId = body.id;
    if (body.id) {
      const { error } = await db.from("usuarios").update(payload).eq("id", body.id).eq("empresa_id", profile.empresa_id);
      if (error) throw error;
      if (authUserId) await db.auth.admin.updateUserById(authUserId, { email, user_metadata: { nombre, empresa_id: profile.empresa_id } });
    } else {
      const { data, error } = await db.from("usuarios").insert(payload).select("id").single();
      if (error) {
        if (authUserId) await db.auth.admin.deleteUser(authUserId);
        throw error;
      }
      usuarioId = data.id;
    }

    const { data: role } = await db.from("roles").select("nombre").eq("id", body.rol_id).single();
    if (role?.nombre === "Comercial") {
      await db.from("comerciales").upsert({ empresa_id: profile.empresa_id, usuario_id: usuarioId, sucursal_id: body.sucursal_id || null, zona_id: body.zona_id || null, nombre, codigo: body.codigo || usuario, activo: body.activo !== false }, { onConflict: "usuario_id" });
    }

    await db.from("auditoria").insert({ empresa_id: profile.empresa_id, usuario_id: profile.id, usuario_nombre: profile.nombre, rol: profile.rol, modulo: "Usuarios", accion: body.id ? "Editar usuario" : "Crear usuario", detalle: `${nombre} · ${role?.nombre || "Rol"}`, tabla_afectada: "usuarios", registro_id: usuarioId });
    return NextResponse.json({ ok: true, id: usuarioId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible guardar el usuario." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    const db = supabaseAdmin();
    const body = await req.json();
    const { data: user, error } = await db.from("usuarios").update({ activo: !!body.activo, actualizado_en: new Date().toISOString() }).eq("id", body.id).eq("empresa_id", profile.empresa_id).select("auth_user_id,nombre").single();
    if (error) throw error;
    if (user.auth_user_id) await db.auth.admin.updateUserById(user.auth_user_id, { ban_duration: body.activo ? "none" : "876000h" });
    await db.from("comerciales").update({ activo: !!body.activo }).eq("usuario_id", body.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible cambiar el estado." }, { status: 500 });
  }
}
