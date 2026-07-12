import { NextRequest } from "next/server";
import { supabaseAdmin } from "./server";

export type AppRole =
  | "Administrador"
  | "Gerencia General"
  | "Gerencia Comercial"
  | "Comercial"
  | "Compras"
  | "Cartera"
  | "Asistente Comercial";

export type AuthProfile = {
  id: string;
  auth_user_id: string;
  empresa_id: string;
  empresa_nombre: string;
  nombre: string;
  usuario: string;
  rol: AppRole;
  comercial_id: string | null;
  sucursal_id: string | null;
  activo: boolean;
  es_superadmin: boolean;
};

export async function requireProfile(req: NextRequest, allowed?: AppRole[]): Promise<AuthProfile> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");

  const db = supabaseAdmin();
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) throw new Error("UNAUTHORIZED");

  const { data: baseUser, error } = await db
    .from("usuarios")
    .select("id,auth_user_id,empresa_id,nombre,usuario,activo,sucursal_id,es_superadmin,comerciales(id),roles(nombre),empresa(nombre)")
    .eq("auth_user_id", auth.user.id)
    .limit(1)
    .single();

  if (error || !baseUser || baseUser.activo === false) throw new Error("PROFILE_NOT_FOUND");

  const requestedCompany = req.headers.get("x-company-id") || "";
  let companyId = baseUser.empresa_id;
  let companyName = Array.isArray((baseUser as any).empresa) ? (baseUser as any).empresa[0]?.nombre : (baseUser as any).empresa?.nombre;

  if (requestedCompany && requestedCompany !== companyId) {
    const canSwitch = !!(baseUser as any).es_superadmin || !!(await db
      .from("usuarios_empresas")
      .select("id")
      .eq("usuario_id", baseUser.id)
      .eq("empresa_id", requestedCompany)
      .eq("activo", true)
      .maybeSingle()).data;
    if (!canSwitch) throw new Error("FORBIDDEN_COMPANY");
    const { data: company } = await db.from("empresa").select("id,nombre,activo").eq("id", requestedCompany).single();
    if (!company || company.activo === false) throw new Error("COMPANY_INACTIVE");
    companyId = company.id;
    companyName = company.nombre;
  }

  const roleRow: any = Array.isArray((baseUser as any).roles) ? (baseUser as any).roles[0] : (baseUser as any).roles;
  const commercialRow: any = Array.isArray((baseUser as any).comerciales) ? (baseUser as any).comerciales[0] : (baseUser as any).comerciales;
  const profile: AuthProfile = {
    id: baseUser.id,
    auth_user_id: baseUser.auth_user_id,
    empresa_id: companyId,
    empresa_nombre: companyName || "Empresa",
    nombre: baseUser.nombre || baseUser.usuario,
    usuario: baseUser.usuario,
    rol: roleRow?.nombre as AppRole,
    comercial_id: commercialRow?.id || null,
    sucursal_id: baseUser.sucursal_id || null,
    activo: baseUser.activo !== false,
    es_superadmin: !!(baseUser as any).es_superadmin
  };

  if (!profile.rol) throw new Error("ROLE_NOT_FOUND");
  if (allowed && !allowed.includes(profile.rol)) throw new Error("FORBIDDEN");
  return profile;
}
