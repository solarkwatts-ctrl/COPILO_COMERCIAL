# Reconstrucción limpia de Supabase

El proyecto de Next.js, GitHub y Vercel se conserva. Solo se reemplaza el proyecto de Supabase.

## 1. Cree el proyecto nuevo

En Supabase cree un proyecto vacío y espere a que termine la configuración.

## 2. Cree la base de datos

Abra **SQL Editor**, copie todo el archivo:

`supabase/01_SCHEMA_LIMPIO.sql`

y ejecútelo una sola vez.

Este script crea las tablas, relaciones, índices, RLS, roles y buckets requeridos por la aplicación.

## 3. Cree el administrador en Authentication

En **Authentication > Users > Add user**:

- use un correo real;
- defina una contraseña conocida;
- marque **Auto Confirm User**.

Luego abra:

`supabase/02_VINCULAR_PRIMER_ADMIN.sql`

Cambie únicamente:

`REEMPLACE_POR_SU_CORREO`

por el correo creado y ejecute todo el archivo.

## 4. Verifique

Ejecute:

`supabase/03_VERIFICACION.sql`

Debe mostrar las tablas, siete roles, una empresa, el administrador y cuatro buckets.

## 5. Variables de Vercel

Reemplace las variables anteriores por las del proyecto nuevo y aplíquelas a **Production, Preview y Development**:

- `NEXT_PUBLIC_SUPABASE_URL`: URL base, sin `/rest/v1/`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: llave `sb_publishable_...`.
- `SUPABASE_SERVICE_ROLE_KEY`: llave secreta del servidor.
- `GEMINI_API_KEY`: opcional.
- `AI_PROVIDER=gemini`
- `AI_MODEL=gemini-2.5-flash`

La llave secreta nunca debe llevar el prefijo `NEXT_PUBLIC_`.

## 6. Variables locales

Copie `.env.example` como `.env.local` y coloque las llaves nuevas. `.env.local` ya está excluido de Git.

## 7. Despliegue

Desde VS Code:

```powershell
git add .
git commit -m "Reconstruir Supabase limpio"
git push origin main
```

Espere un despliegue nuevo de Vercel. No reutilice un despliegue creado antes de cambiar las variables.

## Cambios aplicados al código

- Login con diagnóstico claro y normalización del correo.
- Configuración de Supabase sin URL antigua incrustada.
- Un solo esquema SQL limpio y compatible con las consultas actuales.
- Corrección del módulo Administración para cargar y guardar zonas.
- Consistencia entre tipos de archivos permitidos y tablas de importación.
- Inclusión de ventas y zonas en las copias de seguridad.
- Proyecto probado con `npm run build` exitosamente.
