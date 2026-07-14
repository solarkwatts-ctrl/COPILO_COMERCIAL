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

type CompanyRow = {
  id: string;
  nombre: string;
  activo: boolean | null;
  estado_licencia?: string | null;
  licencia_vencimiento?: string | null;
};

function companyIsAvailable(company: CompanyRow | null | undefined): company is CompanyRow {
  return !!company && company.activo !== false && !["suspendida", "vencida"].includes(String(company.estado_licencia || ""));
}

export async function requireProfile(
  req: NextRequest,
  allowed?: AppRole[],
  options: { allowInactiveCompany?: boolean } = {}
): Promise<AuthProfile> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");

  const db = supabaseAdmin();
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) throw new Error("UNAUTHORIZED");

  const { data: baseUser, error } = await db
    .from("usuarios")
    .select("id,auth_user_id,empresa_id,nombre,usuario,activo,sucursal_id,es_superadmin,comerciales(id),roles(nombre)")
    .eq("auth_user_id", auth.user.id)
    .limit(1)
    .single();

  if (error || !baseUser || baseUser.activo === false) throw new Error("PROFILE_NOT_FOUND");

  const requestedCompany = (req.headers.get("x-company-id") || "").trim();
  const isSuperadmin = !!(baseUser as any).es_superadmin;

  let companyId = requestedCompany || String(baseUser.empresa_id || "");
  let company: CompanyRow | null = null;

  if (companyId) {
    const result = await db
      .from("empresa")
      .select("id,nombre,activo,estado_licencia,licencia_vencimiento")
      .eq("id", companyId)
      .maybeSingle();
    if (result.error) throw result.error;
    company = result.data as CompanyRow | null;
  }

  if (requestedCompany && requestedCompany !== String(baseUser.empresa_id || "") && !isSuperadmin) {
    const membership = await db
      .from("usuarios_empresas")
      .select("id")
      .eq("usuario_id", baseUser.id)
      .eq("empresa_id", requestedCompany)
      .eq("activo", true)
      .maybeSingle();
    if (membership.error) throw membership.error;
    if (!membership.data) throw new Error("FORBIDDEN_COMPANY");
  }

  // Repara automáticamente una selección local obsoleta para el superadministrador.
  // Esto evita insertar datos con un empresa_id que ya no existe.
  if (!company && isSuperadmin) {
    const fallback = await db
      .from("empresa")
      .select("id,nombre,activo,estado_licencia,licencia_vencimiento")
      .eq("activo", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    company = fallback.data as CompanyRow | null;
    companyId = company?.id || "";
  }

  if (!company || !companyId) throw new Error("COMPANY_NOT_FOUND");
  if (!options.allowInactiveCompany && !companyIsAvailable(company)) {
    throw new Error("COMPANY_INACTIVE");
  }

  const roleRow: any = Array.isArray((baseUser as any).roles) ? (baseUser as any).roles[0] : (baseUser as any).roles;
  const commercialRow: any = Array.isArray((baseUser as any).comerciales) ? (baseUser as any).comerciales[0] : (baseUser as any).comerciales;

  const profile: AuthProfile = {
    id: baseUser.id,
    auth_user_id: baseUser.auth_user_id,
    empresa_id: companyId,
    empresa_nombre: company.nombre || "Empresa",
    nombre: baseUser.nombre || baseUser.usuario,
    usuario: baseUser.usuario,
    rol: roleRow?.nombre as AppRole,
    comercial_id: commercialRow?.id || null,
    sucursal_id: baseUser.sucursal_id || null,
    activo: baseUser.activo !== false,
    es_superadmin: isSuperadmin,
  };

  if (!profile.rol) throw new Error("ROLE_NOT_FOUND");
  if (allowed && !allowed.includes(profile.rol)) throw new Error("FORBIDDEN");
  return profile;
}
