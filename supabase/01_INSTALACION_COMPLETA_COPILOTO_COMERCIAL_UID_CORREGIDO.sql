-- ============================================================
-- COPILOTO COMERCIAL IA
-- INSTALACIÓN COMPLETA PARA UN PROYECTO NUEVO DE SUPABASE
-- ============================================================
--
-- ANTES DE EJECUTAR:
-- 1. En Supabase vaya a Authentication > Users > Add user.
-- 2. Cree el administrador con un correo real y contraseña conocida.
-- 3. Active "Auto Confirm User".
-- 4. Este archivo ya está configurado para:
--       Correo: ortiz.javiermauricio@gmail.com
--       User UID: b3f1bc4e-3fcf-4281-950b-048dd403ad06
-- 5. Ejecute TODO el archivo una sola vez en SQL Editor.
--
-- Este archivo crea:
-- empresa, zonas, sucursales, roles, usuarios, comerciales,
-- categorías, clientes, productos, ventas, metas, cartera,
-- inventario, ventas perdidas, cargas, configuración demo,
-- parámetros, auditoría, historial/configuración IA, alertas,
-- copias de seguridad, índices, funciones, RLS, Storage,
-- datos iniciales y el primer Administrador.
-- ============================================================

-- COPILOTO COMERCIAL IA
-- Esquema limpio para un proyecto NUEVO de Supabase.
-- Ejecute este archivo una sola vez en SQL Editor.

create extension if not exists pgcrypto;

create table public.empresa (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nombre_comercial text,
  nit text,
  eslogan text,
  sector text,
  ciudad text,
  direccion text,
  telefono text,
  correo text,
  sitio_web text,
  moneda text not null default 'COP',
  zona_horaria text not null default 'America/Bogota',
  logo_url text,
  demo_activo boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.zonas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  nombre text not null,
  responsable text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, nombre)
);

create table public.sucursales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  zona_id uuid references public.zonas(id) on delete set null,
  nombre text not null,
  ciudad text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, nombre)
);

create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  rol_id uuid not null references public.roles(id),
  sucursal_id uuid references public.sucursales(id) on delete set null,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  nombre text not null,
  usuario text not null,
  correo text,
  password_hash text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, usuario),
  unique (empresa_id, correo)
);

create table public.comerciales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid unique references public.usuarios(id) on delete set null,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  zona_id uuid references public.zonas(id) on delete set null,
  nombre text not null,
  codigo text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, codigo)
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, nombre)
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  comercial_id uuid references public.comerciales(id) on delete set null,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  nombre text not null,
  nit text,
  sector text,
  ciudad text,
  activo boolean not null default true,
  ultima_compra date,
  created_at timestamptz not null default now()
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  categoria_id uuid references public.categorias(id) on delete set null,
  codigo text,
  sku text,
  nombre text not null,
  categoria text,
  abc text,
  participacion numeric not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, codigo),
  unique (empresa_id, sku)
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  comercial_id uuid references public.comerciales(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  producto_id uuid references public.productos(id) on delete set null,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  fecha date not null,
  factura text,
  cantidad numeric not null default 0,
  valor numeric not null default 0,
  costo numeric not null default 0,
  margen numeric generated always as (valor - costo) stored,
  created_at timestamptz not null default now()
);

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  comercial_id uuid references public.comerciales(id) on delete cascade,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  anio integer not null check (anio between 2000 and 2200),
  mes integer not null check (mes between 1 and 12),
  valor numeric not null default 0,
  tipo text not null default 'mensual',
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, comercial_id, anio, mes, tipo)
);

create table public.cartera (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  comercial_id uuid references public.comerciales(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  factura text,
  fecha_emision date,
  fecha_vencimiento date,
  saldo numeric not null default 0,
  dias_mora integer not null default 0,
  riesgo text,
  bloqueado boolean not null default false,
  promesa_pago date,
  accion text,
  created_at timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.inventario (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  stock numeric not null default 0,
  costo numeric not null default 0,
  precio numeric not null default 0,
  stock_seguridad numeric not null default 0,
  punto_pedido numeric not null default 0,
  lead_time_dias integer not null default 0,
  proveedor text,
  estado text,
  actualizado timestamptz not null default now(),
  unique (empresa_id, producto_id, sucursal_id)
);

create table public.ventas_perdidas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  comercial_id uuid references public.comerciales(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  producto_id uuid references public.productos(id) on delete set null,
  fecha date not null default current_date,
  motivo text not null,
  valor numeric not null default 0,
  observacion text,
  evidencia_url text,
  created_at timestamptz not null default now()
);

create table public.parametros_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  clave text not null,
  valor jsonb not null default '{}'::jsonb,
  descripcion text,
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, clave)
);

create table public.configuracion_demo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresa(id) on delete cascade,
  activo boolean not null default true,
  datos_cargados boolean not null default false,
  actualizado_en timestamptz not null default now()
);

create table public.cargas_archivos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  tipo_archivo text not null,
  nombre_archivo text not null,
  total_filas integer not null default 0,
  filas_validas integer not null default 0,
  filas_eliminadas integer not null default 0,
  estado text not null default 'cargado',
  creado_por text,
  created_at timestamptz not null default now()
);

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  usuario_nombre text,
  rol text,
  modulo text,
  accion text not null,
  detalle text,
  tabla_afectada text,
  registro_id uuid,
  antes jsonb,
  despues jsonb,
  metadata jsonb not null default '{}'::jsonb,
  fecha timestamptz not null default now()
);

create table public.ia_historial (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  rol text,
  pregunta text not null,
  respuesta text,
  proveedor text not null default 'gemini',
  modelo text not null default 'gemini-2.5-flash',
  estado text not null default 'completada',
  fecha timestamptz not null default now()
);

create table public.ia_configuracion_rol (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  rol text not null,
  instrucciones text not null,
  activo boolean not null default true,
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, rol)
);

create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  comercial_id uuid references public.comerciales(id) on delete set null,
  tipo text not null,
  prioridad text not null default 'media',
  titulo text not null,
  mensaje text not null,
  origen text,
  referencia_id uuid,
  estado text not null default 'pendiente',
  leida boolean not null default false,
  created_at timestamptz not null default now(),
  atendido_en timestamptz
);

create table public.copias_seguridad (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  archivo text not null,
  tamano_bytes bigint not null default 0,
  estado text not null default 'generada',
  observacion text,
  created_at timestamptz not null default now()
);

create index idx_usuarios_auth on public.usuarios(auth_user_id);
create index idx_clientes_comercial on public.clientes(empresa_id, comercial_id);
create index idx_ventas_periodo on public.ventas(empresa_id, fecha);
create index idx_metas_periodo on public.metas(empresa_id, anio, mes);
create index idx_cartera_mora on public.cartera(empresa_id, dias_mora desc);
create index idx_inventario_stock on public.inventario(empresa_id, stock);
create index idx_perdidas_fecha on public.ventas_perdidas(empresa_id, fecha);
create index idx_auditoria_fecha on public.auditoria(empresa_id, fecha desc);
create index idx_alertas_estado on public.alertas(empresa_id, estado, prioridad);

create or replace function public.app_empresa_actual()
returns uuid language sql stable security definer set search_path=public as $$
  select empresa_id from public.usuarios
  where auth_user_id=auth.uid() and activo=true limit 1
$$;

create or replace function public.app_usuario_actual()
returns uuid language sql stable security definer set search_path=public as $$
  select id from public.usuarios
  where auth_user_id=auth.uid() and activo=true limit 1
$$;

create or replace function public.app_rol_actual()
returns text language sql stable security definer set search_path=public as $$
  select r.nombre
  from public.usuarios u join public.roles r on r.id=u.rol_id
  where u.auth_user_id=auth.uid() and u.activo=true limit 1
$$;

create or replace function public.app_comercial_actual()
returns uuid language sql stable security definer set search_path=public as $$
  select id from public.comerciales where usuario_id=public.app_usuario_actual() limit 1
$$;

grant execute on function public.app_empresa_actual() to authenticated;
grant execute on function public.app_usuario_actual() to authenticated;
grant execute on function public.app_rol_actual() to authenticated;
grant execute on function public.app_comercial_actual() to authenticated;

-- RLS
alter table public.empresa enable row level security;
alter table public.roles enable row level security;
alter table public.zonas enable row level security;
alter table public.sucursales enable row level security;
alter table public.usuarios enable row level security;
alter table public.comerciales enable row level security;
alter table public.categorias enable row level security;
alter table public.clientes enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.metas enable row level security;
alter table public.cartera enable row level security;
alter table public.inventario enable row level security;
alter table public.ventas_perdidas enable row level security;
alter table public.parametros_empresa enable row level security;
alter table public.configuracion_demo enable row level security;
alter table public.cargas_archivos enable row level security;
alter table public.auditoria enable row level security;
alter table public.ia_historial enable row level security;
alter table public.ia_configuracion_rol enable row level security;
alter table public.alertas enable row level security;
alter table public.copias_seguridad enable row level security;

create policy usuarios_perfil_propio on public.usuarios
for select to authenticated
using (auth_user_id=auth.uid() or (empresa_id=public.app_empresa_actual() and public.app_rol_actual()='Administrador'));

create policy roles_lectura on public.roles
for select to authenticated using (true);

create policy empresa_misma on public.empresa
for select to authenticated using (id=public.app_empresa_actual());

create policy zonas_misma_empresa on public.zonas
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy sucursales_misma_empresa on public.sucursales
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy comerciales_misma_empresa on public.comerciales
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy categorias_misma_empresa on public.categorias
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy clientes_misma_empresa on public.clientes
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy productos_misma_empresa on public.productos
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy ventas_misma_empresa on public.ventas
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy metas_misma_empresa on public.metas
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy cartera_misma_empresa on public.cartera
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy inventario_misma_empresa on public.inventario
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy perdidas_misma_empresa on public.ventas_perdidas
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy parametros_misma_empresa on public.parametros_empresa
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy demo_misma_empresa on public.configuracion_demo
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy cargas_misma_empresa on public.cargas_archivos
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy auditoria_admin on public.auditoria
for select to authenticated using (empresa_id=public.app_empresa_actual() and public.app_rol_actual()='Administrador');
create policy ia_historial_misma_empresa on public.ia_historial
for select to authenticated using (empresa_id=public.app_empresa_actual());
create policy ia_config_admin on public.ia_configuracion_rol
for select to authenticated using (empresa_id=public.app_empresa_actual() and public.app_rol_actual()='Administrador');
create policy alertas_destinatario on public.alertas
for select to authenticated using (
  empresa_id=public.app_empresa_actual()
  and (usuario_id is null or usuario_id=public.app_usuario_actual() or public.app_rol_actual() in ('Administrador','Gerencia General','Gerencia Comercial'))
);
create policy backups_admin on public.copias_seguridad
for select to authenticated using (empresa_id=public.app_empresa_actual() and public.app_rol_actual()='Administrador');

-- Storage
insert into storage.buckets (id,name,public) values
  ('logos','logos',true),
  ('archivos-cargados','archivos-cargados',false),
  ('evidencias','evidencias',false),
  ('backups','backups',false)
on conflict (id) do nothing;

create policy logos_lectura_publica on storage.objects
for select using (bucket_id='logos');

create policy logos_admin_insert on storage.objects
for insert to authenticated with check (
  bucket_id='logos'
  and public.app_rol_actual()='Administrador'
  and (storage.foldername(name))[1]=public.app_empresa_actual()::text
);

create policy logos_admin_update on storage.objects
for update to authenticated using (
  bucket_id='logos'
  and public.app_rol_actual()='Administrador'
  and (storage.foldername(name))[1]=public.app_empresa_actual()::text
) with check (
  bucket_id='logos'
  and public.app_rol_actual()='Administrador'
  and (storage.foldername(name))[1]=public.app_empresa_actual()::text
);

insert into public.roles(nombre,descripcion) values
 ('Administrador','Configura empresa, usuarios, auditoría y copias'),
 ('Gerencia General','Visión integral de la empresa'),
 ('Gerencia Comercial','Metas, equipo comercial y resultados'),
 ('Comercial','Gestión comercial propia'),
 ('Compras','Inventario, reposición y abastecimiento'),
 ('Cartera','Cobro, mora, riesgo y bloqueos'),
 ('Asistente Comercial','Carga de bases empresariales')
on conflict(nombre) do nothing;

-- Empresa inicial. Puede cambiar el nombre desde el módulo Administración.
insert into public.empresa(nombre,nombre_comercial,demo_activo)
values ('Empresa Demo','Empresa Demo',true);

insert into public.configuracion_demo(empresa_id,activo,datos_cargados)
select id,true,false from public.empresa order by created_at limit 1
on conflict(empresa_id) do nothing;

insert into public.ia_configuracion_rol(empresa_id,rol,instrucciones)
select e.id,r.rol,r.instrucciones
from public.empresa e
cross join (values
 ('Administrador','Responder solo sobre configuración, usuarios, roles, cargas, auditoría y copias.'),
 ('Gerencia General','Responder con visión integrada de metas, cartera, inventario, pérdidas y riesgos.'),
 ('Gerencia Comercial','Responder sobre comerciales, metas, clientes, cartera comercial y ventas perdidas.'),
 ('Comercial','Responder únicamente con datos propios del comercial autenticado.'),
 ('Compras','Responder solo sobre inventario, agotados, costos, precios, lead time y reposición.'),
 ('Cartera','Responder solo sobre saldos, mora, vencimientos, bloqueos y acciones de cobro.'),
 ('Asistente Comercial','Sin acceso a IA; solo carga archivos.')
) as r(rol,instrucciones)
on conflict(empresa_id,rol) do update set instrucciones=excluded.instrucciones;


-- ============================================================
-- VINCULAR EL PRIMER ADMINISTRADOR CON SUPABASE AUTH
-- CAMBIE SOLAMENTE EL CORREO DE v_correo.
-- ============================================================

do $$
declare
  v_correo text := 'ortiz.javiermauricio@gmail.com';
  v_auth_id uuid := 'b3f1bc4e-3fcf-4281-950b-048dd403ad06'::uuid;
  v_correo_auth text;
  v_empresa_id uuid;
  v_rol_id uuid;
begin
  select email
    into v_correo_auth
  from auth.users
  where id = v_auth_id
  limit 1;

  if v_correo_auth is null then
    raise exception 'No existe en Authentication el User UID %.', v_auth_id;
  end if;

  if lower(trim(v_correo_auth)) <> lower(trim(v_correo)) then
    raise exception
      'El UID % pertenece al correo %, no al correo %.',
      v_auth_id, v_correo_auth, v_correo;
  end if;

  select id
    into v_empresa_id
  from public.empresa
  order by created_at
  limit 1;

  select id
    into v_rol_id
  from public.roles
  where nombre = 'Administrador'
  limit 1;

  if v_empresa_id is null then
    raise exception 'No se creó la empresa inicial.';
  end if;

  if v_rol_id is null then
    raise exception 'No se creó el rol Administrador.';
  end if;

  insert into public.usuarios (
    empresa_id,
    rol_id,
    nombre,
    usuario,
    correo,
    activo,
    auth_user_id
  )
  values (
    v_empresa_id,
    v_rol_id,
    'Javier Mauricio Ortiz',
    'admin',
    lower(trim(v_correo)),
    true,
    v_auth_id
  )
  on conflict (empresa_id, usuario)
  do update set
    rol_id = excluded.rol_id,
    nombre = excluded.nombre,
    correo = excluded.correo,
    activo = true,
    auth_user_id = excluded.auth_user_id,
    actualizado_en = now();
end $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- Debe devolver:
-- 22 tablas del aplicativo, 7 roles, 1 empresa,
-- 1 administrador vinculado y 4 buckets.
-- ============================================================

select count(*) as total_tablas_aplicativo
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'empresa','roles','zonas','sucursales','usuarios','comerciales',
    'categorias','clientes','productos','ventas','metas','cartera',
    'inventario','ventas_perdidas','parametros_empresa',
    'configuracion_demo','cargas_archivos','auditoria','ia_historial',
    'ia_configuracion_rol','alertas','copias_seguridad'
  );

select count(*) as total_roles
from public.roles;

select id, nombre, nombre_comercial, demo_activo, activo
from public.empresa;

select
  u.id,
  u.nombre,
  u.usuario,
  u.correo,
  u.activo,
  u.auth_user_id,
  r.nombre as rol,
  e.nombre as empresa,
  au.email as correo_auth,
  au.email_confirmed_at
from public.usuarios u
join public.roles r on r.id = u.rol_id
join public.empresa e on e.id = u.empresa_id
left join auth.users au on au.id = u.auth_user_id
where u.usuario = 'admin';

select id, name, public
from storage.buckets
where id in ('logos','archivos-cargados','evidencias','backups')
order by id;

do $$
declare
  v_total_tablas integer;
  v_total_roles integer;
  v_total_buckets integer;
  v_admin_ok boolean;
begin
  select count(*) into v_total_tablas
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'empresa','roles','zonas','sucursales','usuarios','comerciales',
      'categorias','clientes','productos','ventas','metas','cartera',
      'inventario','ventas_perdidas','parametros_empresa',
      'configuracion_demo','cargas_archivos','auditoria','ia_historial',
      'ia_configuracion_rol','alertas','copias_seguridad'
    );

  select count(*) into v_total_roles from public.roles;

  select count(*) into v_total_buckets
  from storage.buckets
  where id in ('logos','archivos-cargados','evidencias','backups');

  select exists (
    select 1
    from public.usuarios
    where auth_user_id = 'b3f1bc4e-3fcf-4281-950b-048dd403ad06'::uuid
      and lower(correo) = lower('ortiz.javiermauricio@gmail.com')
      and activo = true
  ) into v_admin_ok;

  if v_total_tablas <> 22 then
    raise exception 'Instalación incompleta: se esperaban 22 tablas y se encontraron %.', v_total_tablas;
  end if;

  if v_total_roles <> 7 then
    raise exception 'Instalación incompleta: se esperaban 7 roles y se encontraron %.', v_total_roles;
  end if;

  if v_total_buckets <> 4 then
    raise exception 'Instalación incompleta: se esperaban 4 buckets y se encontraron %.', v_total_buckets;
  end if;

  if not v_admin_ok then
    raise exception 'El administrador no quedó vinculado correctamente.';
  end if;

  raise notice 'INSTALACIÓN COMPLETA: 22 tablas, 7 roles, 4 buckets y administrador vinculado.';
end $$;
