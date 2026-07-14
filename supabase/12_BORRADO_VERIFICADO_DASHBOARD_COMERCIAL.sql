-- BORRADO VERIFICADO 12
-- Deja vacías las fuentes utilizadas por Dashboard, Comercial 360, Inteligencia,
-- Compras 360, Cartera y Director IA para una empresa específica.
-- Conserva empresa, usuarios, roles, sucursales, zonas, configuración y licencia.

create or replace function public.borrar_datos_empresa_definitivo(p_empresa_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_count integer := 0;
  v_remaining integer := 0;
begin
  if p_empresa_id is null or not exists (
    select 1 from public.empresa where id = p_empresa_id
  ) then
    raise exception 'COMPANY_NOT_FOUND';
  end if;

  -- Dependencias y datos analíticos.
  if to_regclass('public.notificaciones') is not null then
    execute 'delete from public.notificaciones where empresa_id = $1' using p_empresa_id;
    get diagnostics v_count = row_count;
    v_result := v_result || jsonb_build_object('notificaciones', v_count);
  end if;

  delete from public.alertas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('alertas', v_count);

  delete from public.ventas_perdidas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('ventas_perdidas', v_count);

  delete from public.cartera where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('cartera', v_count);

  delete from public.inventario where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('inventario', v_count);

  delete from public.metas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('metas', v_count);

  -- Fuentes exactas usadas por Dashboard y Comercial 360.
  delete from public.ventas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('ventas', v_count);

  delete from public.ventas_historicas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('ventas_historicas', v_count);

  delete from public.compras_historicas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('compras_historicas', v_count);

  delete from public.remisiones_historicas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('remisiones_historicas', v_count);

  if to_regclass('public.ia_historial') is not null then
    execute 'delete from public.ia_historial where empresa_id = $1' using p_empresa_id;
    get diagnostics v_count = row_count;
    v_result := v_result || jsonb_build_object('ia_historial', v_count);
  end if;

  if to_regclass('public.cargas_archivos') is not null then
    execute 'delete from public.cargas_archivos where empresa_id = $1' using p_empresa_id;
    get diagnostics v_count = row_count;
    v_result := v_result || jsonb_build_object('cargas_archivos', v_count);
  end if;

  -- Maestros operativos; se conservan estructura empresarial, usuarios y permisos.
  delete from public.clientes where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('clientes', v_count);

  delete from public.productos where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('productos', v_count);

  delete from public.categorias where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('categorias', v_count);

  delete from public.comerciales where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count;
  v_result := v_result || jsonb_build_object('comerciales', v_count);

  if to_regclass('public.configuracion_demo') is not null then
    update public.configuracion_demo
       set datos_cargados = false,
           actualizado_en = now()
     where empresa_id = p_empresa_id;
  end if;

  -- Verificación obligatoria dentro de la misma transacción.
  select
      (select count(*) from public.ventas where empresa_id = p_empresa_id)
    + (select count(*) from public.ventas_historicas where empresa_id = p_empresa_id)
    + (select count(*) from public.compras_historicas where empresa_id = p_empresa_id)
    + (select count(*) from public.remisiones_historicas where empresa_id = p_empresa_id)
    + (select count(*) from public.cartera where empresa_id = p_empresa_id)
    + (select count(*) from public.inventario where empresa_id = p_empresa_id)
    + (select count(*) from public.metas where empresa_id = p_empresa_id)
    + (select count(*) from public.ventas_perdidas where empresa_id = p_empresa_id)
    + (select count(*) from public.alertas where empresa_id = p_empresa_id)
    + (select count(*) from public.clientes where empresa_id = p_empresa_id)
    + (select count(*) from public.productos where empresa_id = p_empresa_id)
    + (select count(*) from public.comerciales where empresa_id = p_empresa_id)
  into v_remaining;

  if v_remaining <> 0 then
    raise exception 'DELETE_VERIFICATION_FAILED: % registros permanecen', v_remaining;
  end if;

  return jsonb_build_object(
    'ok', true,
    'empresa_id', p_empresa_id,
    'eliminados', v_result,
    'restantes', 0,
    'verificado_en', now()
  );
end;
$$;

revoke all on function public.borrar_datos_empresa_definitivo(uuid) from public;
grant execute on function public.borrar_datos_empresa_definitivo(uuid) to service_role;

select 'BORRADO VERIFICADO PARA DASHBOARD Y COMERCIAL INSTALADO' as resultado;
