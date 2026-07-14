# Enterprise Analytics 2.0

Esta entrega conecta en un solo motor:

- `ventas_historicas`
- `compras_historicas`
- `remisiones_historicas`
- inventario actual
- cartera actual
- metas
- ventas perdidas
- alertas

## Instalación

1. Conserve `.env.local`.
2. Reemplace los archivos del proyecto.
3. Ejecute en Supabase:
   `supabase/10_ENTERPRISE_ANALYTICS_TOTAL.sql`
4. Reinicie:
   `npm install`
   `npm run dev`

## Módulos conectados

- Dashboard empresarial
- Inteligencia empresarial con filtros de fecha
- Comercial 360°
- Compras e inventario 360°
- Cartera 360°
- Director IA por rol

## Reglas

- Todo se filtra por `empresa_id`.
- Un Comercial solo recibe el histórico asociado a su nombre de comercial.
- Los filtros de fecha recalculan las series y rankings.
- Si se reemplaza una categoría histórica, solo se reemplaza esa categoría de la empresa activa.
- Las recomendaciones de inventario cruzan stock actual, stock de seguridad, lead time y demanda de remisiones.
