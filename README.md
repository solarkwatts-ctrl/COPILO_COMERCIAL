# Copiloto Comercial IA - V2 Operativa para Vercel

Versión enfocada en demo comercial real:

- Landing comercial sin mencionar Vercel/Supabase.
- Login sin mostrar usuarios ni claves.
- Roles: Administrador, Gerencia, Comercial, Compras, Cartera, Asistente Comercial.
- Menú por rol.
- Cerrar sesión.
- Administrador configura roles, saludos y demo.
- Asistente Comercial solo carga bases.
- Gerencia ve meta general, cumplimiento y decisiones.
- Gerente Comercial configura metas manualmente y usa sugerencia IA.
- Cálculo de días hábiles Colombia para cumplimiento esperado.
- Comerciales ven su meta, cumplimiento, cartera y alertas urgentes.
- Cartera envía avisos al comercial y puede sugerir bloqueo.
- Compras recibe alertas por agotados reportados en ventas perdidas.
- Compras configura lead time, stock de seguridad, punto de pedido y aplica sugerencias.
- IA responde con resumen y detalle accionable.
- SQL adicional en `supabase/v2_operativa.sql`.

## Usuarios demo

Ver `USUARIOS_DEMO_PRIVADO.md`.

## Deploy Vercel

```bash
git add .
git commit -m "V2 operativa comercial"
git push origin main
```

## Ajuste por rol

- Dashboard de Compras ya no muestra cartera ni ranking comercial.
- Compras administra lead time, stock seguridad y punto de pedido.
- Ventas perdidas es función del Comercial.
- Comercial puede adjuntar evidencia de competencia.
- Reportes del comercial incluyen base asignada, % de activación, paretos, sectores fuertes y clientes históricos.


## Fix compilación Vercel

- Corregido `app/reportes/page.tsx`.
- Se eliminó el error `Unexpected token AppLayout`.
- Reportes quedan segmentados por rol: Compras, Cartera, Comercial y Gerencia.


## IA por rol

- El Copiloto IA ya no muestra las mismas preguntas a todos.
- Compras ve inventario, agotados, lead time y compras sugeridas.
- Cartera ve cobranza, bloqueos, promesas y acciones al comercial.
- Comercial ve meta, clientes, productos, cartera asignada y ventas perdidas.
- Gerencia Comercial ve cumplimiento, ranking, clientes y metas.
- Administración ve parametrización, usuarios, demo y seguridad.
- Gerencia General ve decisiones ejecutivas cruzadas.


## Reportes PowerBI y ventas perdidas por rol

- Reportes ahora tienen gráficos con Recharts.
- Periodo de reporte incluye botones y rango de fechas editable.
- Comercial ve reportes visuales de base asignada, activación, sectores, clientes y productos.
- Compras ve gráficos de agotados, lead time, punto de pedido y pérdida por inventario.
- Cartera ve edad y saldo por cliente.
- Gerencia ve ventas vs meta, cumplimiento, motivos de pérdida y clientes Pareto.
- Ventas perdidas ya no muestra la leyenda de gerencia al comercial.
- Ventas perdidas cambia el enfoque según rol.


## V3 Gemini gratis con contexto por rol

Esta versión agrega un motor IA real con proveedor gratuito Gemini:

- API route: `app/api/ia/route.ts`.
- Cliente Gemini vía REST: `lib/ai/gemini.ts`.
- Constructor de contexto seguro por rol: `lib/ai/context-builder.ts`.
- IA solo recibe información autorizada según el rol.
- Asistente Comercial no tiene acceso a IA.
- Si no existe `GEMINI_API_KEY`, la IA funciona en modo local/fallback.
- Variables requeridas en Vercel:
  - `GEMINI_API_KEY`
  - `AI_PROVIDER=gemini`
  - `AI_MODEL=gemini-1.5-flash`
- SQL opcional: `supabase/ia_config.sql`.

### Importante

La API key de Gemini NO se pone en el frontend. Se configura en Vercel como variable de entorno del servidor.


## Fix menú móvil y regreso a bienvenida

- En celular aparece barra superior con botón Menú.
- El menú se abre como panel lateral móvil.
- Se agregó opción "Volver a bienvenida" dentro del menú.
- En la página inicial se agregó botón "Volver al panel".
- Se mantiene cerrar sesión desde móvil y escritorio.


## V4 IA clara, gráficos a color y navegación
- Respuestas IA más claras, amenas y accionables.
- Formato con resumen, semáforo, hallazgos, acciones y riesgos.
- Gráficos a color y semáforo ejecutivo.
- Botón Volver a bienvenida en login.


## V5 Meta diaria y semáforo personalizado

- Muestra fecha actual en panel y menú.
- Calcula días hábiles de Colombia por mes.
- Excluye fines de semana y festivos configurados para 2026 y 2027.
- Calcula cumplimiento esperado según días hábiles transcurridos.
- Compara cumplimiento real vs esperado.
- Semáforo verde, amarillo o rojo.
- Mensajes motivacionales personalizados para comerciales.
- Gerencia recibe alertas de vendedores que requieren acompañamiento.
- Meta general también usa semáforo y ritmo esperado.


## V6
Administración completa, logo, zonas, sucursales, motor empresarial, IA no truncada, trazabilidad y copias de seguridad. SQL: `supabase/v6_administracion_auditoria_backup.sql`.


## V7 Supabase empresarial

Esta versión migra la arquitectura principal a Supabase:

- Multiempresa por `empresa_id`.
- Usuarios y roles en `perfiles`.
- Configuración de empresa, zonas y sucursales en Supabase.
- Logo en Storage.
- Importaciones CSV a tablas reales.
- Auditoría central.
- Backups en bucket privado.
- IA consultando contexto real y estricto por rol.
- Asistente Comercial sin acceso a IA.
- Comercial solo consulta sus datos.
- Compras solo inventario y abastecimiento.
- Cartera solo cartera.
- Gerencia Comercial solo información comercial.
- Gerencia General visión integrada.
- Administrador solo configuración, usuarios, auditoría, backups e importaciones.

### Instalación
1. Ejecutar `supabase/V7_SCHEMA_COMPLETO.sql`.
2. Crear variables de entorno en Vercel.
3. Crear el primer usuario en Supabase Auth.
4. Insertar su perfil con rol Administrador y empresa asignada.
5. Crear buckets si no se generaron automáticamente.


# V8 Empresarial

## Cambios críticos

- Se eliminó el nombre conflictivo `current_role()`.
- Las funciones seguras ahora son:
  - `app_current_empresa_id()`
  - `app_current_user_role()`
  - `app_current_commercial_id()`
- El SQL es idempotente y puede ejecutarse después del intento fallido de V7.
- El ingreso ahora usa Supabase Auth.
- La API de IA ya no confía en el rol enviado por el navegador.
- El servidor valida el token y consulta el perfil real.
- El Comercial solo puede alimentar a la IA con sus propios datos.
- Compras, Cartera, Gerencia, Administrador y Asistente conservan contextos estrictos.
- El contexto enviado a Gemini está resumido y limitado para evitar respuestas cortadas.
- Administración, importaciones y backups requieren token y rol autorizado.
- Se agregaron vistas de cumplimiento, cartera e inventario.
- Se agregaron índices, triggers y políticas de Storage.

## Orden de instalación

1. En Supabase SQL Editor ejecute:
   `supabase/V8_MIGRACION_SEGURA.sql`

2. En Authentication cree el primer usuario administrador.

3. Edite y ejecute:
   `supabase/V8_CREAR_PRIMER_ADMIN.sql`

4. Ejecute:
   `supabase/V8_VERIFICACION.sql`

5. Configure en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `AI_PROVIDER=gemini`
   - `AI_MODEL=gemini-2.5-flash`

6. Haga un nuevo despliegue en Vercel.

## Seguridad

`SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` solo deben existir en Vercel. No se deben subir a GitHub.


# V9 compatible con la base Supabase existente

Esta versión usa exactamente las tablas ya creadas: `empresa`, `usuarios`, `roles`, `auditoria`, `cargas_archivos`, `ia_historial`, etc.
No crea `empresas`, `perfiles`, `auditoria_sistema` ni `importaciones` duplicadas.

Buckets utilizados:
- `logos`
- `EVIDENCIAS`
- `archivos-cargados`
- `backups` (único bucket nuevo)

Orden:
1. Ejecutar `supabase/V9_MIGRACION_SOBRE_BASE_ACTUAL.sql`.
2. Crear usuario en Supabase Auth.
3. Ejecutar `supabase/V9_VINCULAR_USUARIO_AUTH.sql`.
4. Ejecutar `supabase/V9_VERIFICACION.sql`.
5. Subir esta versión a GitHub/Vercel.


## V9.1 corrección integral
- Corrige la vista `vw_cartera_detalle` para evitar `comercial_id` duplicado.
- Usa las tablas existentes `usuarios`, `empresa` y `auditoria`.
- Conserva los buckets `archivos-cargados`, `logos` y `EVIDENCIAS`.
- Agrega únicamente `backups`.
- Ejecutar solamente `supabase/V9_MIGRACION_SOBRE_BASE_ACTUAL.sql`.


## V9.2
- Corrige compatibilidad de productos sin columnas nombre/codigo.
- Reconstruye la vista de inventario sin columnas duplicadas.
- Puede ejecutarse sobre la migración parcial previa.
