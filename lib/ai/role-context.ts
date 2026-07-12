import { supabaseAdmin } from "@/lib/supabase/server";
import type { AuthProfile } from "@/lib/supabase/auth-server";

const sum=(rows:any[],key:string)=>rows.reduce((a,r)=>a+Number(r?.[key]||0),0);
const month=()=>{const n=new Date();return {anio:n.getFullYear(),mes:n.getMonth()+1,inicio:new Date(n.getFullYear(),n.getMonth(),1).toISOString().slice(0,10),fin:new Date(n.getFullYear(),n.getMonth()+1,0).toISOString().slice(0,10)}};

export async function buildStrictRoleContext(profile:AuthProfile,question:string){
  const db=supabaseAdmin(); const p=month(); const empresa_id=profile.empresa_id;
  const base={rol:profile.rol,usuario:profile.nombre,empresa_id,pregunta:question,fecha_actual:new Date().toISOString(),periodo:p};
  if(profile.rol==="Asistente Comercial") return {...base,restringido:true};

  if(profile.rol==="Administrador"){
    const [{data:empresa},{data:usuarios},{data:roles},{data:sucursales},{data:cargas},{data:auditoria},{data:parametros},{data:demo}]=await Promise.all([
      db.from("empresa").select("*").eq("id",empresa_id).single(),
      db.from("usuarios").select("id,nombre,usuario,activo,rol_id,sucursal_id").eq("empresa_id",empresa_id),
      db.from("roles").select("*").order("nombre"),
      db.from("sucursales").select("*").eq("empresa_id",empresa_id),
      db.from("cargas_archivos").select("*").eq("empresa_id",empresa_id).order("created_at",{ascending:false}).limit(30),
      db.from("auditoria").select("*").eq("empresa_id",empresa_id).order("fecha",{ascending:false}).limit(50),
      db.from("parametros_empresa").select("*").eq("empresa_id",empresa_id),
      db.from("configuracion_demo").select("*").eq("empresa_id",empresa_id).maybeSingle()
    ]);
    return {...base,empresa,usuarios:usuarios||[],roles:roles||[],sucursales:sucursales||[],cargas_recientes:cargas||[],auditoria_reciente:auditoria||[],parametros:parametros||[],configuracion_demo:demo};
  }

  if(profile.rol==="Compras"){
    const [{data:inventario},{data:productos},{data:perdidas}]=await Promise.all([
      db.from("inventario").select("*,productos(*)").eq("empresa_id",empresa_id).order("stock",{ascending:true}).limit(200),
      db.from("productos").select("*").eq("empresa_id",empresa_id).limit(200),
      db.from("ventas_perdidas").select("*").eq("empresa_id",empresa_id).eq("motivo","Agotado").gte("fecha",p.inicio).lte("fecha",p.fin).limit(200)
    ]);
    return {...base,resumen:{referencias:inventario?.length||0,ventas_perdidas_agotado:sum(perdidas||[],"valor")},inventario:inventario||[],productos:productos||[],ventas_perdidas_agotado:perdidas||[]};
  }

  if(profile.rol==="Cartera"){
    const {data:cartera}=await db.from("cartera").select("*,clientes(*,comerciales(*))").eq("empresa_id",empresa_id).order("dias_mora",{ascending:false}).limit(300);
    return {...base,resumen:{cartera_total:sum(cartera||[],"saldo"),cartera_critica:sum((cartera||[]).filter((x:any)=>Number(x.dias_mora)>=60),"saldo")},cartera:cartera||[]};
  }

  if(profile.rol==="Comercial"){
    if(!profile.comercial_id) throw new Error("COMERCIAL_SIN_VINCULO");
    const [{data:comercial},{data:meta},{data:clientes},{data:cartera},{data:perdidas}]=await Promise.all([
      db.from("comerciales").select("*").eq("id",profile.comercial_id).single(),
      db.from("metas").select("*").eq("empresa_id",empresa_id).eq("comercial_id",profile.comercial_id).eq("anio",p.anio).eq("mes",p.mes).maybeSingle(),
      db.from("clientes").select("*").eq("empresa_id",empresa_id).eq("comercial_id",profile.comercial_id).limit(300),
      db.from("cartera").select("*,clientes(*)").eq("empresa_id",empresa_id).in("cliente_id",(await db.from("clientes").select("id").eq("empresa_id",empresa_id).eq("comercial_id",profile.comercial_id)).data?.map((x:any)=>x.id)||[]).limit(200),
      db.from("ventas_perdidas").select("*").eq("empresa_id",empresa_id).eq("comercial_id",profile.comercial_id).gte("fecha",p.inicio).lte("fecha",p.fin).limit(200)
    ]);
    return {...base,comercial,meta,clientes_propios:clientes||[],cartera_propia:cartera||[],ventas_perdidas_propias:perdidas||[],resumen:{meta:Number(meta?.valor||0),clientes_asignados:clientes?.length||0,cartera_total:sum(cartera||[],"saldo"),ventas_perdidas:sum(perdidas||[],"valor")}};
  }

  if(profile.rol==="Gerencia Comercial"){
    const [{data:comerciales},{data:metas},{data:clientes},{data:cartera},{data:perdidas}]=await Promise.all([
      db.from("comerciales").select("*").eq("empresa_id",empresa_id),
      db.from("metas").select("*").eq("empresa_id",empresa_id).eq("anio",p.anio).eq("mes",p.mes),
      db.from("clientes").select("*").eq("empresa_id",empresa_id).limit(500),
      db.from("cartera").select("*,clientes(*,comerciales(*))").eq("empresa_id",empresa_id).limit(400),
      db.from("ventas_perdidas").select("*").eq("empresa_id",empresa_id).gte("fecha",p.inicio).lte("fecha",p.fin).limit(400)
    ]);
    return {...base,comerciales:comerciales||[],metas:metas||[],clientes:clientes||[],cartera:cartera||[],ventas_perdidas:perdidas||[],resumen:{meta_general:sum(metas||[],"valor"),clientes:clientes?.length||0,cartera_total:sum(cartera||[],"saldo"),ventas_perdidas:sum(perdidas||[],"valor")}};
  }

  const [{data:empresa},{data:comerciales},{data:metas},{data:cartera},{data:inventario},{data:perdidas}]=await Promise.all([
    db.from("empresa").select("*").eq("id",empresa_id).single(),
    db.from("comerciales").select("*").eq("empresa_id",empresa_id),
    db.from("metas").select("*").eq("empresa_id",empresa_id).eq("anio",p.anio).eq("mes",p.mes),
    db.from("cartera").select("*").eq("empresa_id",empresa_id).limit(400),
    db.from("inventario").select("*,productos(*)").eq("empresa_id",empresa_id).limit(300),
    db.from("ventas_perdidas").select("*").eq("empresa_id",empresa_id).gte("fecha",p.inicio).lte("fecha",p.fin).limit(400)
  ]);
  return {...base,empresa,comerciales:comerciales||[],metas:metas||[],cartera:cartera||[],inventario:inventario||[],ventas_perdidas:perdidas||[],resumen:{meta_general:sum(metas||[],"valor"),cartera_total:sum(cartera||[],"saldo"),stock_total:sum(inventario||[],"stock"),ventas_perdidas:sum(perdidas||[],"valor")}};
}
