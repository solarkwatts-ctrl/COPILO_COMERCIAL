import {NextRequest,NextResponse} from "next/server";import Papa from "papaparse";import {requireProfile} from "@/lib/supabase/auth-server";import {supabaseAdmin} from "@/lib/supabase/server";
const TABLES: Record<string,string> = {
  ventas: "ventas",
  cartera: "cartera",
  inventario: "inventario",
  clientes: "clientes",
  comerciales: "comerciales",
  metas: "metas",
  productos: "productos",
  sucursales: "sucursales",
  ventas_perdidas: "ventas_perdidas"
};
export async function POST(req:NextRequest){try{const p=await requireProfile(req,["Administrador","Asistente Comercial"]);const form=await req.formData();const file=form.get("file") as File|null;const type=String(form.get("type")||"");if(!file||!TABLES[type])return NextResponse.json({error:"Archivo o tipo inválido."},{status:400});const parsed=Papa.parse<any>(await file.text(),{header:true,skipEmptyLines:true,dynamicTyping:true,transformHeader:h=>h.trim().toLowerCase().replaceAll(" ","_")});if(parsed.errors.length)return NextResponse.json({error:parsed.errors[0].message},{status:400});const rows=parsed.data.filter((r:any)=>Object.values(r).some(v=>v!==null&&v!=="")).map((r:any)=>({...r,empresa_id:p.empresa_id}));const db=supabaseAdmin();const path=`${p.empresa_id}/${type}/${Date.now()}-${file.name}`;const up=await db.storage.from("archivos-cargados").upload(path,file,{contentType:file.type||"text/csv"});if(up.error)throw up.error;const ins=await db.from(TABLES[type]).insert(rows);if(ins.error)throw ins.error;await db.from("cargas_archivos").insert({empresa_id:p.empresa_id,tipo_archivo:type,nombre_archivo:file.name,total_filas:parsed.data.length,filas_validas:rows.length,filas_eliminadas:parsed.data.length-rows.length,estado:"cargado",creado_por:p.nombre});await db.from("auditoria").insert({empresa_id:p.empresa_id,usuario_id:p.id,modulo:"Cargas",accion:`Cargó ${type}`,detalle:`${file.name}: ${rows.length} filas`});return NextResponse.json({ok:true,registros:rows.length});}catch(e:any){return NextResponse.json({error:e.message},{status:e.message==="FORBIDDEN"?403:500});}}
