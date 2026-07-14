# Corrección: borrado total del entorno demo

La acción **Borrar datos demo** ahora elimina, exclusivamente para la empresa activa:

- alertas
- ventas perdidas
- cartera
- inventario
- metas
- ventas operativas
- clientes
- productos
- categorías
- comerciales
- ventas históricas
- compras históricas
- remisiones históricas
- historial de cargas

No elimina usuarios, roles, configuración, empresa, licencia ni credenciales.

En empresas reales solo elimina filas operativas con `es_demo = true`; nunca elimina históricos reales mediante este botón.
