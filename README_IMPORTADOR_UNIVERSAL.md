# Importador universal empresarial

Esta versión incorpora un motor único para archivos CSV, XLS y XLSX en históricos y bases operativas.

## Bases operativas compatibles

- Ventas
- Cartera
- Inventario
- Clientes
- Productos
- Comerciales
- Metas
- Sucursales
- Ventas perdidas

## Reglas de seguridad

- La validación ocurre antes de reemplazar datos.
- Toda operación está filtrada por `empresa_id`.
- Reemplazar afecta únicamente la base seleccionada de la empresa activa.
- Agregar conserva la información existente.
- Actualizar utiliza claves como factura, NIT, código, SKU o nombre cuando están disponibles.
- Los archivos y la operación quedan registrados en cargas y auditoría.
- Los nombres de columnas se normalizan y se reconocen alias comunes.

## Instalación

1. Reemplace los archivos del proyecto conservando `.env.local`.
2. Ejecute `npm install`.
3. Ejecute `npm run dev`.
4. Abra Centro de datos y elija Históricos o Bases operativas.

No requiere SQL adicional si ya fue ejecutado `08_IMPORTACION_SEGURA_REPORTES_REALES.sql`.
