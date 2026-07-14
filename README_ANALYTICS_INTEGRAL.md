# Copiloto Comercial - Integración analítica integral

Esta versión conecta ventas, compras y remisiones históricas con Dashboard, Comercial 360, Compras e inventario 360, Inteligencia y Director IA.

Cambios principales:
- Parser de remisiones compatible con archivos planos XLS/XLSX/CSV con encabezados como remision, fecha, cliente, estado, referencia, descripcion, cantidad, pend_fact, facturada, devuelta, valor_unitario y total.
- Validación completa de todos los archivos antes de borrar una categoría en modo Reemplazar.
- Motor analítico central por empresa_id.
- Ventas históricas como fuente principal, con fallback a ventas operativas.
- Compras históricas y remisiones históricas incluidas en KPIs, gráficos, proveedores, referencias y contexto de IA.
- Filtros de fecha reales en Inteligencia.
- Build de producción verificado.

No requiere SQL adicional si ya existen las tablas históricas y registro_hash configurado.
