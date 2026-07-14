import type { AuthProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

function forecast(monthly: Array<{ mes: string; ventas: number }>) {
  const clean = monthly.map((x) => ({ mes: x.mes, ventas: Number(x.ventas || 0) })).filter((x) => x.mes);
  if (clean.length < 2) return [];
  const recent = clean.slice(-12);
  const avg = recent.reduce((s, x) => s + x.ventas, 0) / recent.length;
  const trend = recent.length > 1 ? (recent.at(-1)!.ventas - recent[0].ventas) / (recent.length - 1) : 0;
  const last = new Date(`${clean.at(-1)!.mes}-01T00:00:00`);
  return [1, 2, 3].map((step) => {
    const d = new Date(last.getFullYear(), last.getMonth() + step, 1);
    const monthNumber = d.getMonth() + 1;
    const sameMonth = clean.filter((x) => Number(x.mes.slice(5, 7)) === monthNumber);
    const seasonal = sameMonth.length ? sameMonth.reduce((s, x) => s + x.ventas, 0) / sameMonth.length : avg;
    const projected = Math.max(0, seasonal * 0.65 + (recent.at(-1)!.ventas + trend * step) * 0.35);
    return { mes: `${d.getFullYear()}-${String(monthNumber).padStart(2, "0")}`, ventas: Math.round(projected) };
  });
}

export async function buildEnterpriseAnalytics(profile: AuthProfile, from?: string | null, to?: string | null) {
  const db = supabaseAdmin();
  let seller: string | null = null;
  if (profile.rol === "Comercial" && profile.comercial_id) {
    const { data } = await db.from("comerciales").select("nombre").eq("id", profile.comercial_id).maybeSingle();
    seller = data?.nombre || null;
  }
  const { data, error } = await db.rpc("enterprise_analytics_snapshot", {
    p_empresa_id: profile.empresa_id,
    p_from: from || null,
    p_to: to || null,
    p_vendedor: seller,
  });
  if (error) throw error;
  const result: any = data || {};
  result.pronostico_ventas = forecast(result.ventas_mensuales || []);
  const totals = result.totales || {};
  totals.cumplimiento = Number(totals.meta || 0) > 0 ? (Number(totals.ventas || 0) / Number(totals.meta)) * 100 : 0;
  result.totales = totals;
  result.empty = Object.values(result.fuentes || {}).every((v) => Number(v || 0) === 0);
  return result;
}
