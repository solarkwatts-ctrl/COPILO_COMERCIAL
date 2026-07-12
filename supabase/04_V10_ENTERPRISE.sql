-- Ejecutar una sola vez después de 01_INSTALACION_COMPLETA...
alter table public.empresa add column if not exists tipo_entorno text not null default 'demo' check (tipo_entorno in ('demo','real'));
alter table public.roles add column if not exists nombre_visible text;
alter table public.roles add column if not exists saludo text;

update public.roles set nombre_visible = case nombre
  when 'Administrador' then 'Administrador del Sistema'
  when 'Gerencia General' then 'Gerente General'
  when 'Gerencia Comercial' then 'Gerente Comercial'
  when 'Comercial' then 'Asesor Comercial'
  when 'Compras' then 'Líder de Compras e Inventarios'
  when 'Cartera' then 'Gestor de Cartera'
  when 'Asistente Comercial' then 'Asistente Comercial'
end where nombre_visible is null;

update public.roles set saludo = case nombre
  when 'Administrador' then 'Bienvenido, líder de configuración'
  when 'Gerencia General' then 'Buenos días, líder de la empresa'
  when 'Gerencia Comercial' then 'Buenos días, líder comercial'
  when 'Comercial' then 'Hola, vamos por la meta de hoy'
  when 'Compras' then 'Hola, protejamos el abastecimiento'
  when 'Cartera' then 'Hola, prioricemos la recuperación'
  when 'Asistente Comercial' then 'Gracias por mantener la información al día'
end where saludo is null;

alter table public.comerciales add column if not exists es_demo boolean not null default false;
alter table public.categorias add column if not exists es_demo boolean not null default false;
alter table public.clientes add column if not exists es_demo boolean not null default false;
alter table public.productos add column if not exists es_demo boolean not null default false;
alter table public.ventas add column if not exists es_demo boolean not null default false;
alter table public.metas add column if not exists es_demo boolean not null default false;
alter table public.cartera add column if not exists es_demo boolean not null default false;
alter table public.inventario add column if not exists es_demo boolean not null default false;
alter table public.ventas_perdidas add column if not exists es_demo boolean not null default false;
alter table public.alertas add column if not exists es_demo boolean not null default false;

create index if not exists idx_usuarios_empresa_activo on public.usuarios(empresa_id, activo);
create index if not exists idx_ventas_empresa_demo_fecha on public.ventas(empresa_id, es_demo, fecha);
create index if not exists idx_cartera_empresa_demo on public.cartera(empresa_id, es_demo);
create index if not exists idx_inventario_empresa_demo on public.inventario(empresa_id, es_demo);
