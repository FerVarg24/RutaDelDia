# Ruta del Día

Herramienta mobile-first para técnicos de campo. Muestra la ruta del día optimizada, permite registrar el estado de cada visita y deja evidencia del trabajo realizado.

**Contexto:** Reto técnico para el rol de Ingeniero de IA en [AROMARIA](https://aromaria.mx) — producto análogo a Camino x Ops, su plataforma de gestión de servicio en campo.

---

## Quick Start

### Prerrequisitos

- Node.js 18 o superior
- Docker Desktop corriendo
- Token de [Mapbox](https://account.mapbox.com/) (gratuito)
- API key de [OpenRouteService](https://openrouteservice.org/dev/#/signup) (gratuito, sin tarjeta)

### Configuración inicial

Copia el archivo de variables de entorno y rellena tus tokens:

```bash
cp .env.example .env
```

Edita `.env`:

```
DATABASE_URL="postgresql://rutadeldia:rutadeldia@localhost:5432/rutadeldia"
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."   # tu token de Mapbox
OPENROUTESERVICE_KEY="eyJ..."           # tu key de OpenRouteService
```

> **Por qué `NEXT_PUBLIC_`:** Mapbox GL JS se inicializa en el browser, no en el servidor. Next.js solo expone variables al cliente si tienen el prefijo `NEXT_PUBLIC_`. Sin él, el mapa no puede autenticarse.

### Correr localmente

```bash
# 1. Levantar la base de datos
docker compose up -d

# 2. Instalar dependencias
npm install

# 3. Crear tablas
npx prisma migrate dev --name init

# 4. Cargar datos de prueba (5 paradas en CDMX)
npx prisma db seed

# 5. Correr la app
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige automáticamente a `/day`.

### Verificar datos con Prisma Studio (opcional)

```bash
npx prisma studio
```

---

## Stack y decisiones técnicas

| Tecnología | Decisión | Razonamiento |
|---|---|---|
| Next.js 14 App Router | Framework principal | Full-stack en un solo repo. SSR mejora la carga inicial en móvil con conexión débil. |
| TypeScript estricto | Lenguaje | Type safety de punta a punta: DB → API → UI. Errores que sin tipos solo aparecen en runtime. |
| Tailwind CSS | Estilos | Desarrollo mobile-first natural. Tap targets y breakpoints sin cambiar de contexto. |
| Prisma 5 | ORM | Schema como fuente de verdad, migraciones versionadas, tipos generados automáticamente. |
| PostgreSQL 16 (Docker) | Base de datos | Relacional por la naturaleza del dominio. Docker evita instalar nada y paridad dev/prod. |
| Mapbox GL JS | Mapas | Visualmente superior a Leaflet. Tiles modernos, modo oscuro nativo, markers personalizables. |
| OpenRouteService | Optimización de rutas | Gratuito sin tarjeta de crédito. 500 req/día suficientes para el reto. Endpoint de VRP real. |

### Decisiones donde cuestioné a la IA

Estas son las decisiones donde la sugerencia inicial del modelo no fue la mejor y la rechacé o modifiqué. Detalle completo en [`AI_LOG.md`](./AI_LOG.md).

**1. Mapbox sobre Leaflet**
El modelo priorizó "evitar fricción de setup" y sugirió Leaflet + OpenStreetMap. Elegí Mapbox porque el impacto visual forma parte de la evaluación: AROMARIA evalúa que pensé en el usuario final, no solo en que el código funcione.

**2. Postgres desde el día uno, no SQLite**
El modelo sugirió SQLite en dev para reducir dependencias. Con Docker disponible, la complejidad extra es un solo comando. Usar el mismo motor en dev y prod elimina una clase entera de bugs relacionados con tipos de datos y comportamientos de la DB.

**3. Prisma 5, no Prisma 7**
Al instalar `prisma` sin pinear versión, npm instaló Prisma 7.8.0, que tiene un breaking change: elimina `url = env("DATABASE_URL")` del schema. El schema definido usa esa sintaxis. Detecté el error al correr `prisma validate` y fijé la versión en `^5`. Prisma 7 requeriría `prisma.config.ts` y cambiar el schema — innecesario para el alcance del reto.

**4. `NEXT_PUBLIC_MAPBOX_TOKEN`, no `MAPBOX_TOKEN`**
El prompt original decía `MAPBOX_TOKEN`. Sin el prefijo `NEXT_PUBLIC_`, Next.js no expone la variable al browser y Mapbox no puede inicializarse. Corrección silenciosa que habría tardado tiempo en debuggear.

---

## Arquitectura

```
[Móvil del técnico]
       │
       ▼
[Next.js 14 — App Router]
  /day              → Lista de paradas ordenadas
  /day/map          → Mapa con ruta trazada
  /stop/[id]        → Detalle + cambio de estado + notas
  /ops              → Dashboard Ops Manager (stretch)
       │
       ▼
[API Routes]
  GET  /api/routes/today        → Ruta del día con paradas
  POST /api/routes/optimize     → Llama ORS, persiste orden optimizado
  PATCH /api/stops/[id]/status  → Actualiza estado + notas + checkedInAt
  GET  /api/ops/summary         → Resumen para Ops Manager (stretch)
       │
  ┌────┴────────────────┐
  ▼                     ▼
[Prisma 5]    [OpenRouteService API]
  │             /optimization (VRP)
  ▼
[PostgreSQL 16]
  Route → Stop[] → Incident?
```

### Estructura de carpetas

```
├── app/
│   ├── page.tsx                    # redirect → /day
│   ├── day/page.tsx                # lista de paradas
│   ├── day/map/page.tsx            # vista mapa
│   ├── stop/[id]/page.tsx          # detalle de parada
│   ├── ops/page.tsx                # dashboard ops (stretch)
│   └── api/
│       ├── routes/optimize/route.ts
│       ├── routes/today/route.ts
│       └── stops/[id]/status/route.ts
├── components/
│   ├── StopCard.tsx
│   ├── MapView.tsx                 # siempre dynamic import, ssr: false
│   ├── StatusButtons.tsx
│   └── IncidentForm.tsx
├── lib/
│   ├── prisma.ts                   # singleton PrismaClient
│   ├── openroute.ts                # cliente OpenRouteService
│   └── geofence.ts                 # fórmula Haversine (stretch)
└── prisma/
    ├── schema.prisma
    └── seed.ts                     # 5 paradas reales en CDMX
```

---

## Funcionalidad

### Mínima (obligatoria)

- [ ] Endpoint que recibe paradas y devuelve ruta optimizada por ORS
- [ ] Persistencia de estado por parada (PENDING / COMPLETED / INCIDENT / SKIPPED)
- [ ] Lista de paradas en orden optimizado
- [ ] Mapa con ruta trazada y paradas numeradas
- [ ] Detalle de parada con botones de estado y campo de notas
- [ ] Nota obligatoria al marcar estado INCIDENT

### Stretch goals

- [ ] Geofencing: botones activos solo a menos de 100m de la parada
- [ ] Captura de foto como evidencia de visita
- [ ] Ops Dashboard con estado en tiempo real (polling cada 10s)
- [ ] Modo offline con sincronización posterior

---

## Qué dejé pendiente y qué haría con más tiempo

> Esta sección se actualiza honestamente al avanzar el proyecto.

### Estado actual

El proyecto tiene el setup completo (Bloque 1): scaffolding Next.js 14, schema de Prisma validado, seed con datos reales en CDMX, Docker Compose, singleton de Prisma. La API, la UI y los stretch goals están por construirse.

### Qué haría con más tiempo

- **Autenticación real por técnico.** Actualmente el `techId` es hardcodeado como `"tech-001"`. En producción, cada técnico tendría sesión propia y solo vería su ruta.
- **Optimistic updates en la UI.** Al cambiar el estado de una parada, la UI debería reflejar el cambio de inmediato sin esperar la respuesta del servidor.
- **Push notifications.** Cuando el Ops Manager asigna una parada nueva o cambia el orden, el técnico debería recibir una notificación sin tener que recargar la app.
- **PWA completa con Service Worker.** El modo offline del roadmap es la funcionalidad que más valor da en campo — zonas sin cobertura son comunes.
- **Tests de integración.** Los endpoints son candidatos naturales para tests con Playwright o Vitest + msw.
- **Rate limiting en la API.** `POST /api/routes/optimize` llama a un servicio externo — sin límite podría agotarse el cupo gratuito de ORS.

---

## Colaboración con IA

Este proyecto fue desarrollado con Cursor (Claude Sonnet 4.5) como copiloto.

El enfoque no fue "generar y copiar", sino usar la IA para discutir decisiones, detectar errores y avanzar más rápido — mientras mantengo criterio sobre qué aceptar. Los casos donde cuestioné o rechacé las sugerencias están documentados en [`AI_LOG.md`](./AI_LOG.md).

**Criterio aplicado:** Si no entiendo por qué la IA genera algo, no lo acepto hasta entenderlo.

---

## Entregables del reto

- [x] Repositorio en GitHub (público)
- [x] README con instrucciones, decisiones técnicas y pendientes ← este archivo
- [ ] Video 5-10 min (Loom): app funcionando + arquitectura + uso de IA
- [ ] AI_LOG.md completo con fase de desarrollo
