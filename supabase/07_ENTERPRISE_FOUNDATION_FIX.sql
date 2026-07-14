-- Corrección Enterprise Foundation 1.0
-- Ejecutar una sola vez. Es idempotente y no borra datos.

alter table public.alertas add column if not exists es_demo boolean not null default false;
create index if not exists idx_alertas_empresa_demo on public.alertas(empresa_id, es_demo);

update public.empresa
set estado_licencia = case when activo then coalesce(nullif(estado_licencia,''),'activa') else 'suspendida' end
where estado_licencia is null or estado_licencia='';

insert into public.licencias(empresa_id,plan,estado,fecha_inicio,fecha_vencimiento,limite_usuarios,limite_ia_mensual)
select id,coalesce(plan,'enterprise'),coalesce(estado_licencia,'prueba'),coalesce(licencia_inicio,current_date),licencia_vencimiento,coalesce(limite_usuarios,25),coalesce(limite_ia_mensual,1000)
from public.empresa
on conflict (empresa_id) do update set
  plan=excluded.plan, estado=excluded.estado, fecha_vencimiento=excluded.fecha_vencimiento, actualizado_en=now();

select 'Corrección instalada' as resultado,
       (select count(*) from information_schema.columns where table_schema='public' and table_name='alertas' and column_name='es_demo') as alertas_es_demo,
       (select count(*) from public.licencias) as licencias;
