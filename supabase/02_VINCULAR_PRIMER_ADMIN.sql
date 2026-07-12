-- PASO PREVIO:
-- 1. Cree el usuario en Authentication > Users > Add user.
-- 2. Use un correo real, una contraseña conocida y marque Auto Confirm User.
-- 3. Cambie el correo de la variable v_correo y ejecute todo este archivo.

do $$
declare
  v_correo text := 'REEMPLACE_POR_SU_CORREO';
  v_auth_id uuid;
  v_empresa_id uuid;
  v_rol_id uuid;
begin
  select id into v_auth_id
  from auth.users
  where lower(email)=lower(v_correo)
  limit 1;

  if v_auth_id is null then
    raise exception 'No existe % en Authentication > Users', v_correo;
  end if;

  select id into v_empresa_id from public.empresa order by created_at limit 1;
  select id into v_rol_id from public.roles where nombre='Administrador' limit 1;

  insert into public.usuarios(
    empresa_id,rol_id,nombre,usuario,correo,activo,auth_user_id
  ) values (
    v_empresa_id,v_rol_id,'Administrador Principal','admin',lower(v_correo),true,v_auth_id
  )
  on conflict (empresa_id,usuario) do update set
    rol_id=excluded.rol_id,
    nombre=excluded.nombre,
    correo=excluded.correo,
    activo=true,
    auth_user_id=excluded.auth_user_id,
    actualizado_en=now();
end $$;

select
  u.id,u.nombre,u.usuario,u.correo,u.activo,u.auth_user_id,
  r.nombre as rol,e.nombre as empresa,au.email as correo_auth,au.email_confirmed_at
from public.usuarios u
join public.roles r on r.id=u.rol_id
join public.empresa e on e.id=u.empresa_id
left join auth.users au on au.id=u.auth_user_id
where u.usuario='admin';
