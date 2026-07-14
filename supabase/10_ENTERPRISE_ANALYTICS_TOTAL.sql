-- ENTERPRISE ANALYTICS 2.0
-- Motor analítico unificado para ventas, compras, remisiones y operación actual.

-- Asegura la deduplicación correcta de cada fila histórica.
alter table public.ventas_historicas add column if not exists registro_hash text;
alter table public.compras_historicas add column if not exists registro_hash text;
alter table public.remisiones_historicas add column if not exists registro_hash text;

do $$
declare r record;
begin
  for r in select conname, conrelid::regclass as tabla from pg_constraint
           where contype='u' and conrelid in (
             'public.ventas_historicas'::regclass,
             'public.compras_historicas'::regclass,
             'public.remisiones_historicas'::regclass
           )
  loop execute format('alter table %s drop constraint if exists %I', r.tabla, r.conname); end loop;
end $$;

drop index if exists public.ventas_historicas_empresa_hash_idx;
drop index if exists public.compras_historicas_empresa_hash_idx;
drop index if exists public.remisiones_historicas_empresa_hash_idx;
create unique index if not exists ventas_historicas_empresa_hash_uidx on public.ventas_historicas(empresa_id,registro_hash);
create unique index if not exists compras_historicas_empresa_hash_uidx on public.compras_historicas(empresa_id,registro_hash);
create unique index if not exists remisiones_historicas_empresa_hash_uidx on public.remisiones_historicas(empresa_id,registro_hash);


create index if not exists idx_ventas_hist_empresa_fecha_total
  on public.ventas_historicas (empresa_id, fecha, total);
create index if not exists idx_ventas_hist_empresa_vendedor_fecha
  on public.ventas_historicas (empresa_id, vendedor, fecha);
create index if not exists idx_compras_hist_empresa_proveedor_fecha
  on public.compras_historicas (empresa_id, proveedor, fecha);
create index if not exists idx_remisiones_hist_empresa_referencia_fecha
  on public.remisiones_historicas (empresa_id, referencia, fecha);

create or replace function public.enterprise_analytics_snapshot(
  p_empresa_id uuid,
  p_from date default null,
  p_to date default null,
  p_vendedor text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with bounds as (
  select
    coalesce(p_from, (select min(fecha) from ventas_historicas where empresa_id = p_empresa_id), current_date - interval '5 years')::date as desde,
    coalesce(p_to, (select max(fecha) from ventas_historicas where empresa_id = p_empresa_id), current_date)::date as hasta
),
sales as (
  select *
  from ventas_historicas v, bounds b
  where v.empresa_id = p_empresa_id
    and v.fecha between b.desde and b.hasta
    and (p_vendedor is null or lower(coalesce(v.vendedor,'')) = lower(p_vendedor))
),
purchases as (
  select *
  from compras_historicas c, bounds b
  where c.empresa_id = p_empresa_id
    and c.fecha between b.desde and b.hasta
),
remissions as (
  select *
  from remisiones_historicas r, bounds b
  where r.empresa_id = p_empresa_id
    and r.fecha between b.desde and b.hasta
),
sales_monthly as (
  select to_char(date_trunc('month', fecha), 'YYYY-MM') as mes,
         sum(total)::numeric as ventas,
         count(distinct factura)::bigint as facturas,
         count(distinct cliente)::bigint as clientes
  from sales group by 1
),
purchases_monthly as (
  select to_char(date_trunc('month', fecha), 'YYYY-MM') as mes,
         sum(valor_total)::numeric as compras,
         count(distinct factura_proveedor)::bigint as documentos,
         count(distinct proveedor)::bigint as proveedores
  from purchases group by 1
),
remissions_monthly as (
  select to_char(date_trunc('month', fecha), 'YYYY-MM') as mes,
         sum(total)::numeric as valor,
         sum(cantidad)::numeric as cantidad,
         count(distinct remision)::bigint as remisiones
  from remissions group by 1
),
sales_annual as (
  select anio, sum(total)::numeric as ventas, count(distinct factura)::bigint as facturas
  from sales group by anio
),
sellers as (
  select coalesce(nullif(vendedor,''),'Sin vendedor') as nombre,
         sum(total)::numeric as venta,
         count(distinct factura)::bigint as facturas,
         count(distinct cliente)::bigint as clientes
  from sales group by 1 order by venta desc limit 30
),
customers as (
  select coalesce(nullif(cliente,''),'Sin cliente') as nombre,
         sum(total)::numeric as venta,
         count(distinct factura)::bigint as facturas,
         max(fecha) as ultima_compra
  from sales group by 1 order by venta desc limit 50
),
branches as (
  select coalesce(nullif(almacen,''),'Sin almacén') as nombre,
         sum(total)::numeric as venta,
         count(distinct factura)::bigint as facturas
  from sales group by 1 order by venta desc limit 30
),
providers as (
  select coalesce(nullif(proveedor,''),'Sin proveedor') as nombre,
         sum(valor_total)::numeric as compras,
         sum(saldo)::numeric as saldo,
         count(distinct factura_proveedor)::bigint as documentos
  from purchases group by 1 order by compras desc limit 50
),
references_demand as (
  select referencia,
         max(descripcion) as descripcion,
         sum(cantidad)::numeric as cantidad,
         sum(total)::numeric as valor,
         sum(pendiente_facturar)::numeric as pendiente,
         count(distinct remision)::bigint as remisiones
  from remissions group by referencia order by cantidad desc limit 100
),
portfolio_summary as (
  select coalesce(sum(saldo),0)::numeric as total,
         coalesce(sum(saldo) filter (where dias_mora >= 60 or bloqueado),0)::numeric as critica,
         count(*) filter (where bloqueado)::bigint as bloqueados,
         count(*)::bigint as registros
  from cartera where empresa_id = p_empresa_id
),
portfolio_top as (
  select coalesce(cl.nombre,'Sin cliente') as cliente,
         ca.factura, ca.saldo, ca.dias_mora, ca.riesgo, ca.bloqueado
  from cartera ca left join clientes cl on cl.id = ca.cliente_id
  where ca.empresa_id = p_empresa_id
  order by ca.dias_mora desc, ca.saldo desc limit 50
),
goals_summary as (
  select coalesce(sum(m.valor),0)::numeric as meta
  from metas m, bounds b
  where m.empresa_id = p_empresa_id
    and make_date(m.anio, m.mes, 1) <= b.hasta
    and (make_date(m.anio, m.mes, 1) + interval '1 month - 1 day')::date >= b.desde
),
lost_summary as (
  select coalesce(sum(valor),0)::numeric as total, count(*)::bigint as registros
  from ventas_perdidas vp, bounds b
  where vp.empresa_id = p_empresa_id and vp.fecha between b.desde and b.hasta
),
lost_reasons as (
  select coalesce(nullif(motivo,''),'Sin motivo') as motivo, sum(valor)::numeric as valor, count(*)::bigint as casos
  from ventas_perdidas vp, bounds b
  where vp.empresa_id = p_empresa_id and vp.fecha between b.desde and b.hasta
  group by 1 order by valor desc
),
demand_all as (
  select referencia, sum(cantidad)::numeric as cantidad,
         greatest((max(fecha)-min(fecha))+1,1) as dias
  from remissions group by referencia
),
inventory_analysis as (
  select i.id,
         coalesce(p.sku,'') as sku,
         coalesce(p.nombre,'Producto') as producto,
         i.stock, i.stock_seguridad, i.punto_pedido, i.lead_time_dias,
         i.costo, i.precio, i.proveedor, i.estado,
         coalesce(d.cantidad / nullif(d.dias,0),0)::numeric as demanda_diaria,
         case when coalesce(d.cantidad,0)>0 then round(i.stock / nullif(d.cantidad / nullif(d.dias,0),0),1) else null end as cobertura_dias,
         greatest(
           ceil(coalesce(d.cantidad / nullif(d.dias,0),0) * greatest(i.lead_time_dias,0) + i.stock_seguridad - i.stock),
           0
         )::numeric as compra_sugerida
  from inventario i
  join productos p on p.id=i.producto_id
  left join demand_all d on lower(d.referencia)=lower(coalesce(p.sku,''))
  where i.empresa_id=p_empresa_id
  order by compra_sugerida desc, i.stock asc
  limit 300
),
alerts_top as (
  select id,tipo,prioridad,titulo,mensaje,estado,created_at
  from alertas where empresa_id=p_empresa_id
  order by created_at desc limit 30
),
source_counts as (
  select
    (select count(*) from sales) as ventas_historicas,
    (select count(*) from purchases) as compras_historicas,
    (select count(*) from remissions) as remisiones_historicas,
    (select count(*) from inventario where empresa_id=p_empresa_id) as inventario,
    (select count(*) from cartera where empresa_id=p_empresa_id) as cartera,
    (select count(*) from metas where empresa_id=p_empresa_id) as metas,
    (select count(*) from clientes where empresa_id=p_empresa_id) as clientes
)
select jsonb_build_object(
  'periodo', (select jsonb_build_object('desde',desde,'hasta',hasta) from bounds),
  'fuentes', (select to_jsonb(source_counts) from source_counts),
  'totales', jsonb_build_object(
    'ventas', coalesce((select sum(total) from sales),0),
    'base', coalesce((select sum(base) from sales),0),
    'iva', coalesce((select sum(iva) from sales),0),
    'facturas', coalesce((select count(distinct factura) from sales),0),
    'clientes', coalesce((select count(distinct cliente) from sales),0),
    'ticket_promedio', coalesce((select sum(total)/nullif(count(distinct factura),0) from sales),0),
    'compras', coalesce((select sum(valor_total) from purchases),0),
    'proveedores', coalesce((select count(distinct proveedor) from purchases),0),
    'remisiones_valor', coalesce((select sum(total) from remissions),0),
    'remisiones_cantidad', coalesce((select sum(cantidad) from remissions),0),
    'referencias', coalesce((select count(distinct referencia) from remissions),0),
    'meta', (select meta from goals_summary),
    'cartera', (select total from portfolio_summary),
    'cartera_critica', (select critica from portfolio_summary),
    'clientes_bloqueados', (select bloqueados from portfolio_summary),
    'ventas_perdidas', (select total from lost_summary)
  ),
  'ventas_mensuales', coalesce((select jsonb_agg(to_jsonb(x) order by x.mes) from sales_monthly x),'[]'::jsonb),
  'compras_mensuales', coalesce((select jsonb_agg(to_jsonb(x) order by x.mes) from purchases_monthly x),'[]'::jsonb),
  'remisiones_mensuales', coalesce((select jsonb_agg(to_jsonb(x) order by x.mes) from remissions_monthly x),'[]'::jsonb),
  'ventas_anuales', coalesce((select jsonb_agg(to_jsonb(x) order by x.anio) from sales_annual x),'[]'::jsonb),
  'comerciales', coalesce((select jsonb_agg(to_jsonb(x)) from sellers x),'[]'::jsonb),
  'clientes_top', coalesce((select jsonb_agg(to_jsonb(x)) from customers x),'[]'::jsonb),
  'almacenes', coalesce((select jsonb_agg(to_jsonb(x)) from branches x),'[]'::jsonb),
  'proveedores_top', coalesce((select jsonb_agg(to_jsonb(x)) from providers x),'[]'::jsonb),
  'referencias_top', coalesce((select jsonb_agg(to_jsonb(x)) from references_demand x),'[]'::jsonb),
  'inventario', coalesce((select jsonb_agg(to_jsonb(x)) from inventory_analysis x),'[]'::jsonb),
  'cartera_top', coalesce((select jsonb_agg(to_jsonb(x)) from portfolio_top x),'[]'::jsonb),
  'perdidas_motivo', coalesce((select jsonb_agg(to_jsonb(x)) from lost_reasons x),'[]'::jsonb),
  'alertas', coalesce((select jsonb_agg(to_jsonb(x)) from alerts_top x),'[]'::jsonb)
);
$$;

revoke all on function public.enterprise_analytics_snapshot(uuid,date,date,text) from public;
grant execute on function public.enterprise_analytics_snapshot(uuid,date,date,text) to service_role;

select 'ENTERPRISE ANALYTICS 2.0 INSTALADO' as resultado;
