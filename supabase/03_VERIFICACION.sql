select table_name
from information_schema.tables
where table_schema='public'
order by table_name;

select id,nombre from public.roles order by nombre;
select id,nombre,nit,demo_activo from public.empresa;
select usuario,correo,activo,auth_user_id from public.usuarios;
select id,name,public from storage.buckets order by id;
