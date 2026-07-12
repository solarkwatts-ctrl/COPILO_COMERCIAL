# Copiloto Comercial IA — V10 Enterprise

## Cambios incluidos
- Administración central de empresa, marca, zonas y sucursales.
- Módulo de usuarios: creación en Supabase Authentication, edición, roles, sucursal, zona, comercial asociado y activación/desactivación.
- Nombre personalizado por usuario para el saludo.
- Menús y paneles segmentados por rol.
- Separación entre entorno DEMO y empresa REAL.
- Columnas `es_demo` para impedir mezcla de información.
- Copiloto IA con contexto estricto por rol.
- Trazabilidad de cambios administrativos.

## Paso obligatorio en Supabase
Ejecute una sola vez:

`supabase/04_V10_ENTERPRISE.sql`

## Variables obligatorias
En `.env.local` y Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `AI_PROVIDER=gemini`
- `AI_MODEL=gemini-2.5-flash`

La `SUPABASE_SERVICE_ROLE_KEY` solo debe estar en variables privadas del servidor. Nunca use el prefijo `NEXT_PUBLIC_` para esa llave.

## Validación realizada
`npm run build` completó compilación, tipado y generación de las 22 rutas.
