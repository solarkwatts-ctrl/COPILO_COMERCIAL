# Enterprise Data Integrity 1.2

Esta actualización elimina cifras fijas de los reportes y hace que todos los indicadores provengan exclusivamente de Supabase para la empresa activa.

## Cambios

- Borrar Demo deja ventas, metas, cartera, inventario, clientes y demás indicadores en cero.
- En una empresa tipo demo se eliminan todos sus datos operativos; en una empresa real solo se eliminan registros marcados como demo.
- Cargas con tres modos: Reemplazar, Agregar y Actualizar por clave.
- Reemplazar elimina únicamente la base seleccionada de la empresa activa.
- La importación se ejecuta en una transacción PostgreSQL: si una fila falla, la base anterior no se pierde.
- Auditoría e historial de cargas incluyen modo, cantidad eliminada e insertada.
- Reportes muestran estado “Sin datos cargados” cuando la empresa está vacía.

## Instalación

Ejecutar en Supabase SQL Editor:

`supabase/08_IMPORTACION_SEGURA_REPORTES_REALES.sql`
