-- COPILOTO COMERCIAL IA - ENTERPRISE FOUNDATION 1.0
-- Migración aditiva e idempotente. No borra datos existentes.

alter table public.empresa add column if not exists estado_licencia text not null default 'prueba';
alter table public.empresa add column if not exists plan text not null default 'enterprise';
alter table public.empresa add column if not exists licencia_inicio date default current_date;
alter table public.empresa add column if not exists licencia_vencimiento date default (current_date + interval '30 day')::date;
alter table public.empresa add column if not exists color_primario text not null default '#0f172a';
alter table public.empresa add column if not exists color_acento text not null default '#2563eb';
alter table public.empresa add column if not exists idioma text not null default 'es-CO';
alter table public.empresa add column if not exists dominio text;
alter table public.empresa add column if not exists limite_usuarios integer not null default 25;
alter table public.empresa add column if not exists limite_ia_mensual integer not null default 1000;

alter table public.usuarios add column if not exists cargo text;
alter table public.usuarios add column if not exists telefono text;
alter table public.usuarios add column if not exists avatar_url text;
alter table public.usuarios add column if not exists jefe_id uuid references public.usuarios(id) on delete set null;
alter table public.usuarios add column if not exists fecha_ingreso date default current_date;
alter table public.usuarios add column if not exists ultimo_acceso timestamptz;

create table if not exists public.licencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresa(id) on delete cascade,
  plan text not null default 'enterprise',
  estado text not null default 'prueba' check (estado in ('prueba','activa','suspendida','vencida')),
  fecha_inicio date not null default current_date,
  fecha_vencimiento date,
  limite_usuarios integer not null default 25,
  limite_ia_mensual integer not null default 1000,
  observaciones text,
  actualizado_en timestamptz not null default now()
);

create table if not exists public.permisos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  modulo text not null,
  accion text not null,
  descripcion text,
  activo boolean not null default true
);

create table if not exists public.rol_permisos (
  rol_id uuid not null references public.roles(id) on delete cascade,
  permiso_id uuid not null references public.permisos(id) on delete cascade,
  permitido boolean not null default true,
  primary key (rol_id, permiso_id)
);

create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete cascade,
  titulo text not null,
  mensaje text not null,
  tipo text not null default 'info',
  prioridad text not null default 'media',
  leida boolean not null default false,
  enlace text,
  created_at timestamptz not null default now()
);

create table if not exists public.documentos_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete set null,
  nombre text not null,
  categoria text not null default 'General',
  archivo_url text not null,
  mime_type text,
  tamano_bytes bigint not null default 0,
  visible_ia boolean not null default true,
  estado text not null default 'activo',
  created_at timestamptz not null default now()
);

create table if not exists public.diagnosticos_sistema (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresa(id) on delete cascade,
  servicio text not null,
  estado text not null,
  detalle text,
  latencia_ms integer,
  verificado_en timestamptz not null default now()
);

create table if not exists public.configuracion_dashboard (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  widgets jsonb not null default '[]'::jsonb,
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, usuario_id)
);

insert into public.licencias (empresa_id,plan,estado,fecha_inicio,fecha_vencimiento,limite_usuarios,limite_ia_mensual)
select id,plan,estado_licencia,coalesce(licencia_inicio,current_date),licencia_vencimiento,limite_usuarios,limite_ia_mensual
from public.empresa
on conflict (empresa_id) do nothing;

insert into public.permisos(codigo,modulo,accion,descripcion) values
('dashboard.ver','Dashboard','ver','Consultar el panel'),
('empresas.ver','Empresas','ver','Consultar empresas'),
('empresas.crear','Empresas','crear','Crear empresas'),
('usuarios.ver','Usuarios','ver','Consultar usuarios'),
('usuarios.crear','Usuarios','crear','Crear usuarios'),
('usuarios.editar','Usuarios','editar','Editar usuarios'),
('datos.cargar','Datos','cargar','Cargar bases'),
('datos.borrar','Datos','borrar','Borrar o reemplazar bases'),
('reportes.ver','Reportes','ver','Consultar reportes'),
('reportes.exportar','Reportes','exportar','Exportar reportes'),
('ia.consultar','IA','consultar','Consultar Copiloto IA'),
('auditoria.ver','Auditoría','ver','Consultar trazabilidad'),
('backups.generar','Backups','generar','Generar respaldos'),
('documentos.gestionar','Documentos','gestionar','Gestionar biblioteca')
on conflict (codigo) do nothing;

-- Asignación base: Administrador recibe todos los permisos.
insert into public.rol_permisos(rol_id,permiso_id,permitido)
select r.id,p.id,true from public.roles r cross join public.permisos p
where r.nombre='Administrador'
on conflict (rol_id,permiso_id) do update set permitido=true;

-- Permisos mínimos por rol.
insert into public.rol_permisos(rol_id,permiso_id,permitido)
select r.id,p.id,true from public.roles r join public.permisos p on p.codigo in ('dashboard.ver','reportes.ver','ia.consultar')
where r.nombre in ('Gerencia General','Gerencia Comercial','Comercial','Compras','Cartera')
on conflict (rol_id,permiso_id) do nothing;
insert into public.rol_permisos(rol_id,permiso_id,permitido)
select r.id,p.id,true from public.roles r join public.permisos p on p.codigo='datos.cargar'
where r.nombre='Asistente Comercial'
on conflict (rol_id,permiso_id) do nothing;

create index if not exists idx_notificaciones_usuario on public.notificaciones(empresa_id,usuario_id,leida,created_at desc);
create index if not exists idx_documentos_empresa on public.documentos_empresa(empresa_id,created_at desc);
create index if not exists idx_diagnosticos_empresa on public.diagnosticos_sistema(empresa_id,verificado_en desc);

insert into storage.buckets(id,name,public) values
('documentos','documentos',false),('avatars','avatars',true)
on conflict (id) do nothing;

-- Comprobación final
select 'Enterprise Foundation instalada' as resultado,
       (select count(*) from public.permisos) as permisos,
       (select count(*) from public.licencias) as licencias,
       (select count(*) from storage.buckets where id in ('documentos','avatars')) as nuevos_buckets;
