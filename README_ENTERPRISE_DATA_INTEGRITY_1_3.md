# Enterprise Data Integrity 1.3

Corrección integral de dependencia de datos:

- Dashboard, Comercial 360, Compras 360, Cartera 360 y Ventas perdidas consultan Supabase.
- Se eliminó el uso operativo de `lib/demo-data.ts`.
- Borrar demo deja todos los módulos sin cifras embebidas.
- El filtro de fechas de Inteligencia aplica a ventas y ventas perdidas; las metas se filtran por meses que intersectan el periodo.
- El botón Actualizar vuelve a consultar la empresa activa.
- La importación conserva los modos Reemplazar, Agregar y Actualizar por clave, siempre filtrados por `empresa_id`.

No requiere una migración SQL adicional si ya se ejecutaron 07 y 08.
