import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase/auth-server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const p=await requireProfile(req,["Administrador"]); const db=supabaseAdmin();
    const start=Date.now(); const {error,count}=await db.from("usuarios").select("id",{count:"exact",head:true}).eq("empresa_id",p.empresa_id);
    const latency=Date.now()-start;
    const {data:buckets}=await db.storage.listBuckets();
    const checks=[
      {servicio:"Supabase Database",estado:error?"error":"ok",detalle:error?.message||`${count||0} usuarios accesibles`,latencia_ms:latency},
      {servicio:"Supabase Storage",estado:(buckets||[]).length?"ok":"warning",detalle:`${(buckets||[]).length} buckets disponibles`},
      {servicio:"Gemini IA",estado:process.env.GEMINI_API_KEY?"ok":"warning",detalle:process.env.GEMINI_API_KEY?"API configurada":"Falta GEMINI_API_KEY"},
      {servicio:"Service Role",estado:process.env.SUPABASE_SERVICE_ROLE_KEY?"ok":"error",detalle:process.env.SUPABASE_SERVICE_ROLE_KEY?"Servidor autorizado":"Variable privada ausente"},
      {servicio:"Backups",estado:(buckets||[]).some(x=>x.id==="backups")?"ok":"warning",detalle:"Bucket de respaldos"},
      {servicio:"Documentos",estado:(buckets||[]).some(x=>x.id==="documentos")?"ok":"warning",detalle:"Biblioteca empresarial"}
    ];
    for(const c of checks) await db.from("diagnosticos_sistema").insert({empresa_id:p.empresa_id,...c});
    return NextResponse.json({checks,verificado_en:new Date().toISOString()});
  } catch(e:any){return NextResponse.json({error:e.message},{status:500})}
}
