# Corrección definitiva: borrado, Dashboard y Comercial 360

Esta versión corrige dos causas distintas:

1. El borrado ahora se ejecuta en Supabase mediante una función transaccional y **no devuelve éxito** hasta verificar que las tablas usadas por Dashboard y Comercial estén realmente en cero.
2. Las consultas analíticas usan `cache: no-store`, un identificador de revisión y actualización automática al borrar o cambiar de empresa, evitando que el navegador vuelva a mostrar indicadores anteriores.

## Instalación

1. Conserve su `.env.local` actual.
2. Reemplace el contenido de la carpeta del proyecto por esta versión.
3. En Supabase SQL Editor ejecute completo:
   `supabase/12_BORRADO_VERIFICADO_DASHBOARD_COMERCIAL.sql`
4. Reinicie:
   `Ctrl + C`
   `npm install`
   `npm run dev`

## Prueba obligatoria

1. Entre a Empresas y usuarios.
2. Seleccione exactamente la empresa que desea limpiar.
3. Pestaña Demo > Borrar datos demo.
4. El mensaje debe decir: `Datos borrados y verificados correctamente`.
5. Abra Dashboard y Comercial 360. Ambos deben mostrar `Sin datos cargados` / `Sin información comercial`.

Si Supabase conserva una sola fila, la aplicación ya no mostrará un falso mensaje de éxito: responderá indicando las tablas y cantidades pendientes.
