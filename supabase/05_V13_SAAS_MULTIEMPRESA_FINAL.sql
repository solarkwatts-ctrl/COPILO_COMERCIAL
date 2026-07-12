-- ============================================================
-- COPILOTO COMERCIAL IA V13 FINAL
-- V11: SaaS multiempresa
-- V12: módulos funcionales segmentados
-- V13: IA empresarial por empresa y rol
-- SCRIPT CORREGIDO E IDEMPOTENTE: puede ejecutarse aunque el intento anterior haya quedado parcial.
-- ============================================================

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='usuarios' and column_name='created_at'
  ) then
    raise exception 'La tabla public.usuarios no tiene la columna created_at esperada.';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='cargas_archivos' and column_name='created_at'
  ) then
    raise exception 'La tabla public.cargas_archivos no tiene la columna created_at esperada.';
  end if;
end $$;

alter table public.usuarios add column if not exists es_superadmin boolean not null default false;
alter table public.empresa add column if not exists plan text not null default 'demo';
alter table public.empresa add column if not exists fecha_suspension timestamptz;
alter table public.empresa add column if not exists limite_usuarios integer not null default 20;
alter table public.empresa add column if not exists limite_ia_mensual integer not null default 1000;
alter table public.empresa add column if not exists tipo_entorno text not null default 'demo';
alter table public.roles add column if not exists nombre_visible text;
alter table public.roles add column if not exists saludo text;

create table if not exists public.usuarios_empresas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  rol_id uuid references public.roles(id),
  activo boolean not null default true,
  es_principal boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique(usuario_id, empresa_id)
);

create index if not exists idx_usuarios_empresas_usuario on public.usuarios_empresas(usuario_id, activo);
create index if not exists idx_usuarios_empresas_empresa on public.usuarios_empresas(empresa_id, activo);

-- Garantizar los roles del selector de usuarios.
insert into public.roles(nombre, descripcion, activo, nombre_visible, saludo)
values
('Administrador','Configuración integral de la empresa y sus usuarios.',true,'Administrador del Sistema','Bienvenido, líder de configuración'),
('Gerencia General','Visión ejecutiva de toda la organización.',true,'Gerente General','Buenos días, líder de la empresa'),
('Gerencia Comercial','Metas, vendedores, clientes y estrategia comercial.',true,'Gerente Comercial','Buenos días, líder comercial'),
('Comercial','Gestión propia de clientes, metas y ventas perdidas.',true,'Asesor Comercial','Hola, vamos por la meta de hoy'),
('Compras','Inventario, agotados, reposición y compras sugeridas.',true,'Líder de Compras e Inventarios','Hola, protejamos el abastecimiento'),
('Cartera','Recaudo, vencimientos, bloqueos y compromisos.',true,'Gestor de Cartera','Hola, prioricemos la recuperación'),
('Asistente Comercial','Carga y validación de archivos sin acceso estratégico.',true,'Asistente Comercial','Gracias por mantener la información al día')
on conflict (nombre) do update set
 descripcion=excluded.descripcion,
 activo=true,
 nombre_visible=excluded.nombre_visible,
 saludo=excluded.saludo;

-- Vincular usuarios actuales con su empresa principal.
insert into public.usuarios_empresas(usuario_id, empresa_id, rol_id, activo, es_principal)
select id, empresa_id, rol_id, activo, true
from public.usuarios
on conflict (usuario_id, empresa_id) do update set
 rol_id=excluded.rol_id,
 activo=excluded.activo,
 es_principal=true,
 actualizado_en=now();

-- El primer administrador existente se convierte en Superadministrador.
update public.usuarios
set es_superadmin=true
where id=(
  select u.id
  from public.usuarios u
  join public.roles r on r.id=u.rol_id
  where r.nombre='Administrador' and u.activo=true
  order by u.created_at nulls last, u.id
  limit 1
);

-- La demo debe ser una empresa independiente.
update public.empresa
set tipo_entorno=case when demo_activo then 'demo' else coalesce(tipo_entorno,'real') end,
    plan=case when demo_activo then 'demo' else 'cliente' end;

alter table public.usuarios_empresas enable row level security;

drop policy if exists usuarios_empresas_select on public.usuarios_empresas;
create policy usuarios_empresas_select on public.usuarios_empresas
for select to authenticated
using (
  usuario_id in (select id from public.usuarios where auth_user_id=auth.uid())
  or exists(select 1 from public.usuarios where auth_user_id=auth.uid() and es_superadmin=true)
);

-- Función de diagnóstico para administración.
create or replace function public.resumen_saas_empresas()
returns table(
 empresa_id uuid,
 empresa text,
 tipo_entorno text,
 activa boolean,
 usuarios_activos bigint,
 clientes bigint,
 ventas bigint,
 consultas_ia bigint,
 ultima_carga timestamptz
)
language sql security definer set search_path=public as $$
 select e.id,e.nombre,e.tipo_entorno,e.activo,
   (select count(*) from usuarios u where u.empresa_id=e.id and u.activo),
   (select count(*) from clientes c where c.empresa_id=e.id),
   (select count(*) from ventas v where v.empresa_id=e.id),
   (select count(*) from ia_historial i where i.empresa_id=e.id),
   (select max(created_at) from cargas_archivos ca where ca.empresa_id=e.id)
 from empresa e order by e.nombre;
$$;

-- Verificación final.
select nombre,nombre_visible,activo from public.roles order by nombre;
select u.nombre,u.correo,u.es_superadmin,e.nombre empresa
from public.usuarios u join public.empresa e on e.id=u.empresa_id
where u.es_superadmin=true;
select * from public.resumen_saas_empresas();
