# Copiloto Comercial IA V14

Versión consolidada sobre la arquitectura multiempresa instalada.

## Incluye

- Fecha y hora actual de Colombia visibles en todos los módulos internos.
- Menú y protección real de rutas por rol; escribir una URL manualmente no permite abrir módulos no autorizados.
- Vistas diferenciadas para Administrador, Gerencia General, Gerencia Comercial, Comercial, Compras, Cartera y Asistente Comercial.
- Administración multiempresa y usuarios por empresa conservadas.
- Copiloto IA de pregunta libre: ya no depende de preguntas predefinidas.
- Contexto estricto por empresa, usuario y rol.
- Comercial limitado a sus propios datos.
- Asistente Comercial sin acceso a IA ni información estratégica.
- Respuestas ejecutivas, puntuales, con cifras disponibles, prioridades y acciones.
- SQL multiempresa corregido incluido en `supabase/05_V13_SAAS_MULTIEMPRESA_FINAL.sql`.

## Variables requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
GEMINI_API_KEY=...
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
```

No suba `.env.local` a GitHub.

## Prueba local

```powershell
npm install
npm run dev
```

Pruebe cada rol creando usuarios desde Administración. Cada usuario debe cerrar sesión e ingresar con su propio correo para validar menú, tablero y restricciones.
