-- COPILOTO ENTERPRISE 1.2
-- Importación segura por empresa y eliminación de cifras demo embebidas.
-- Idempotente. No borra datos al instalarse.

create or replace function public.importar_base_empresa(
  p_tabla text,
  p_empresa_id uuid,
  p_filas jsonb,
  p_modo text default 'reemplazar',
  p_clave text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tablas constant text[] := array[
    'ventas','cartera','inventario','clientes','comerciales',
    'metas','productos','sucursales','ventas_perdidas'
  ];
  v_columnas text;
  v_definiciones text;
  v_insertadas integer := 0;
  v_eliminadas integer := 0;
  v_item jsonb;
  v_valor text;
begin
  if not (p_tabla = any(v_tablas)) then
    raise exception 'Tabla de importación no autorizada: %', p_tabla;
  end if;
  if p_modo not in ('reemplazar','agregar','actualizar') then
    raise exception 'Modo de importación inválido: %', p_modo;
  end if;
  if jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) = 0 then
    raise exception 'No hay filas válidas para importar.';
  end if;

  -- Solo se insertan columnas reales presentes en el primer registro.
  -- Se excluyen columnas generadas/identity; sus valores se calculan en PostgreSQL.
  select
    string_agg(format('%I', a.attname), ', ' order by a.attnum),
    string_agg(format('%I %s', a.attname, format_type(a.atttypid, a.atttypmod)), ', ' order by a.attnum)
  into v_columnas, v_definiciones
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = p_tabla
    and a.attnum > 0
    and not a.attisdropped
    and a.attgenerated = ''
    and a.attidentity = ''
    and a.attname <> 'id'
    and (p_filas->0) ? a.attname;

  if v_columnas is null then
    raise exception 'El archivo no contiene columnas compatibles con %.', p_tabla;
  end if;
  if position('empresa_id' in v_columnas) = 0 then
    raise exception 'La importación no contiene empresa_id.';
  end if;

  if p_modo = 'reemplazar' then
    execute format('delete from public.%I where empresa_id = $1', p_tabla)
      using p_empresa_id;
    get diagnostics v_eliminadas = row_count;
  elsif p_modo = 'actualizar' then
    if p_clave is null or trim(p_clave) = '' then
      raise exception 'El modo actualizar requiere una columna clave.';
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name=p_tabla and column_name=p_clave
    ) then
      raise exception 'La clave % no existe en la tabla %.', p_clave, p_tabla;
    end if;
    for v_item in select value from jsonb_array_elements(p_filas)
    loop
      v_valor := nullif(v_item->>p_clave, '');
      if v_valor is not null then
        execute format(
          'delete from public.%I t where t.empresa_id=$1 and to_jsonb(t)->>$2=$3',
          p_tabla
        ) using p_empresa_id, p_clave, v_valor;
        v_eliminadas := v_eliminadas + 1;
      end if;
    end loop;
  end if;

  execute format(
    'insert into public.%I (%s) select %s from jsonb_to_recordset($1) as x(%s)',
    p_tabla, v_columnas, v_columnas, v_definiciones
  ) using p_filas;
  get diagnostics v_insertadas = row_count;

  return jsonb_build_object(
    'ok', true,
    'tabla', p_tabla,
    'modo', p_modo,
    'eliminadas', v_eliminadas,
    'insertadas', v_insertadas
  );
end;
$$;

revoke all on function public.importar_base_empresa(text,uuid,jsonb,text,text) from public;
grant execute on function public.importar_base_empresa(text,uuid,jsonb,text,text) to service_role;

select 'Importación segura instalada' as resultado;
