# Corrección administración, suspensión y borrado total

## Instalación

1. Conserve `.env.local`.
2. Reemplace los archivos del proyecto por el contenido de este paquete.
3. Ejecute en Supabase SQL Editor:
   `supabase/11_CORRECCION_ADMIN_SUSPENSION_BORRADO_TOTAL.sql`
4. Reinicie localmente:
   `npm install`
   `npm run dev`

## Prueba de borrado

1. Seleccione la empresa desde Empresas y usuarios.
2. Abra Demo.
3. Pulse Borrar datos demo.
4. El mensaje debe informar cuántos registros se eliminaron.
5. Dashboard, Inteligencia, Comercial 360, Compras 360, Cartera y Centro de datos deben quedar en cero.

El borrado conserva empresa, usuarios, roles, sucursales, zonas, configuración y licencia.

## Prueba de suspensión

1. En Empresas, pulse Suspender.
2. La tarjeta debe cambiar a Suspendida.
3. El superadministrador puede seguir administrándola y reactivarla.
4. Los usuarios normales de esa empresa no pueden usar los módulos operativos mientras esté suspendida.
