import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    const db = supabaseAdmin();
    let companyIds = [profile.empresa_id];
    if (profile.es_superadmin) {
      const { data } = await db.from("empresa").select("id");
      companyIds = (data || []).map(x => x.id);
    }
    const [companies, users, audits, backups, ai, loads] = await Promise.all([
      db.from("empresa").select("id,nombre,nombre_comercial,tipo_entorno,activo,estado_licencia,plan,licencia_vencimiento").in("id", companyIds).order("nombre"),
      db.from("usuarios").select("id,empresa_id,activo").in("empresa_id", companyIds),
      db.from("auditoria").select("id,empresa_id,usuario_nombre,modulo,accion,detalle,fecha").in("empresa_id", companyIds).order("fecha",{ascending:false}).limit(12),
      db.from("copias_seguridad").select("id,empresa_id,estado,created_at").in("empresa_id", companyIds).order("created_at",{ascending:false}).limit(10),
      db.from("ia_historial").select("id,empresa_id,created_at").in("empresa_id", companyIds).gte("created_at", new Date(Date.now()-86400000).toISOString()),
      db.from("cargas_archivos").select("id,empresa_id,estado,created_at").in("empresa_id", companyIds).order("created_at",{ascending:false}).limit(10)
    ]);
    const rows=companies.data||[];
    return NextResponse.json({
      superadmin: profile.es_superadmin,
      resumen: {
        empresas: rows.length,
        activas: rows.filter(x=>x.activo).length,
        demo: rows.filter(x=>x.tipo_entorno==="demo").length,
        usuarios_activos: (users.data||[]).filter(x=>x.activo).length,
        consultas_ia_hoy: (ai.data||[]).length,
        cargas_recientes: (loads.data||[]).length
      },
      empresas: rows,
      auditoria: audits.data||[],
      backups: backups.data||[]
    });
  } catch(e:any) { return NextResponse.json({error:e.message||"No fue posible cargar el centro SaaS."},{status:500}); }
}
