import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const demoTables = ["alertas","ventas_perdidas","cartera","inventario","metas","ventas","clientes","productos","categorias","comerciales"];

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req, ["Administrador"]);
    const db = supabaseAdmin();
    const { action } = await req.json();
    if (action === "toggle") {
      const { data: company } = await db.from("empresa").select("demo_activo").eq("id", profile.empresa_id).single();
      const next = !company?.demo_activo;
      await db.from("empresa").update({ demo_activo: next, tipo_entorno: next ? "demo" : "real", actualizado_en: new Date().toISOString() }).eq("id", profile.empresa_id);
      await db.from("configuracion_demo").upsert({ empresa_id: profile.empresa_id, activo: next, actualizado_en: new Date().toISOString() }, { onConflict: "empresa_id" });
      return NextResponse.json({ ok: true, demo_activo: next });
    }
    if (action === "clear") {
      for (const table of demoTables) await db.from(table).delete().eq("empresa_id", profile.empresa_id).eq("es_demo", true);
      await db.from("configuracion_demo").upsert({ empresa_id: profile.empresa_id, datos_cargados: false, actualizado_en: new Date().toISOString() }, { onConflict: "empresa_id" });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No fue posible gestionar el demo." }, { status: 500 });
  }
}
