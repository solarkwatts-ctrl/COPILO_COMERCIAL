-- Corrección integral: borrado completo y seguro de datos por empresa.
-- Conserva empresa, usuarios, roles, configuración y licencias.

create or replace function public.borrar_datos_empresa_total(p_empresa_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_count integer;
begin
  if not exists (select 1 from public.empresa where id = p_empresa_id) then
    raise exception 'La empresa indicada no existe.';
  end if;

  delete from public.alertas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('alertas', v_count);

  delete from public.ventas_perdidas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('ventas_perdidas', v_count);

  delete from public.cartera where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('cartera', v_count);

  delete from public.inventario where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('inventario', v_count);

  delete from public.metas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('metas', v_count);

  delete from public.ventas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('ventas', v_count);

  delete from public.ventas_historicas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('ventas_historicas', v_count);

  delete from public.compras_historicas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('compras_historicas', v_count);

  delete from public.remisiones_historicas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('remisiones_historicas', v_count);

  delete from public.clientes where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('clientes', v_count);

  delete from public.productos where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('productos', v_count);

  delete from public.categorias where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('categorias', v_count);

  delete from public.comerciales where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('comerciales', v_count);

  delete from public.cargas_archivos where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('cargas_archivos', v_count);

  -- Usuarios permanecen. Sus referencias a sucursal se liberan por ON DELETE SET NULL.
  delete from public.sucursales where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('sucursales', v_count);

  delete from public.zonas where empresa_id = p_empresa_id;
  get diagnostics v_count = row_count; v_result := v_result || jsonb_build_object('zonas', v_count);

  return jsonb_build_object('ok', true, 'eliminados', v_result);
end;
$$;

revoke all on function public.borrar_datos_empresa_total(uuid) from public;
grant execute on function public.borrar_datos_empresa_total(uuid) to service_role;

select 'BORRADO TOTAL POR EMPRESA INSTALADO' as resultado;
