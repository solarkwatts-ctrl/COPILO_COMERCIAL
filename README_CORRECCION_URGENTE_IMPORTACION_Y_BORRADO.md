# Corrección urgente: carga de archivos y borrado total

## Corregido

1. La empresa activa se valida antes de importar. Si el selector local apunta a una empresa eliminada, el superadministrador usa automáticamente una empresa activa válida y evita el error `ventas_empresa_id_fkey`.
2. El botón de borrar elimina todos los datos operativos e históricos de la empresa activa, no solo filas marcadas como demo.
3. La carga operativa acepta varios archivos a la vez. En modo Reemplazar, el primer archivo reemplaza y los siguientes se agregan.
4. Los archivos `fact 2021` a `fact 2025` de Sotosoft se reconocen también como ventas operativas.
5. Los archivos de remisiones Sotosoft reconocen remisión, fecha, cliente, estado, referencia, descripción, cantidades y valores.
6. Se mantienen empresa, usuarios, roles, configuración y licencias.

## Archivos de prueba contemplados

- fact 2021 (1).csv
- fact 2022 (1).csv
- fact 2023 (1).csv
- fact 2024 (1).csv
- fact 2025 (1).csv
- compras 1er trimestre.csv
- primer trimestre 2025.xls
- 2do trimestre 2025.xls
- 3er trimestre 2025.xls
- 4to trimestre 2025.xls
- remisiones 2022 (1).csv
- remisiones 2023 (1).csv
- remisiones 2025 (1).csv
- facturas mym (1).xlsx
- remisiones mym.xlsx

## Instalación

1. Conserve `.env.local`.
2. Reemplace el contenido del proyecto con esta versión.
3. Ejecute en Supabase `supabase/10_BORRADO_TOTAL_Y_VALIDACION_EMPRESA.sql`.
4. Reinicie con `npm install` y `npm run dev`.
