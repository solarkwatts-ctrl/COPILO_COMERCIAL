# Motor de históricos 1.4

## Instalación
1. Ejecutar `supabase/09_MOTOR_HISTORICOS_PROYECCIONES.sql` en Supabase SQL Editor.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.

## Cómo cargar los archivos entregados

### Ventas históricas
En **Centro de datos → Ventas históricas**, seleccione simultáneamente:
- fact 2021 (1).csv
- fact 2022 (1).csv
- fact 2023 (1).csv
- fact 2024 (1).csv
- fact 2025 (1).csv

Use **Reemplazar categoría** la primera vez. La app depura el formato Sotosoft, unifica todos los años, evita duplicados por factura y carga en lotes.

### Compras históricas
Seleccione los cuatro trimestres de 2025 y/o `compras 1er trimestre.csv`. Admite CSV, XLS y XLSX.

### Remisiones históricas
Seleccione juntos los archivos 2022, 2023 y 2025. Se unifican por remisión y referencia.

## Seguridad multiempresa
Toda fila queda con `empresa_id` de la empresa activa. Reemplazar una categoría nunca borra datos de otra empresa ni otras categorías.
