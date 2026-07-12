import { supabaseBrowser } from "./client";

export async function getCurrentProfile() {
  const { data: authData } = await supabaseBrowser.auth.getUser();
  const user = authData.user;
  if (!user) return null;
  const { data, error } = await supabaseBrowser
    .from("usuarios")
    .select("id,auth_user_id,empresa_id,nombre,usuario,activo,sucursal_id,roles(nombre),comerciales(id)")
    .eq("auth_user_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function getCompanyConfig(empresaId: string) {
  const { data, error } = await supabaseBrowser.from("empresa").select("*").eq("id", empresaId).single();
  if (error) throw error;
  return data;
}

export async function getBranches(empresaId: string) {
  const { data, error } = await supabaseBrowser.from("sucursales").select("*").eq("empresa_id", empresaId).order("nombre");
  if (error) throw error;
  return data || [];
}

export async function auditEvent(payload: Record<string, unknown>) {
  const { error } = await supabaseBrowser.from("auditoria").insert(payload);
  if (error) throw error;
}
