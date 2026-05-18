# Ruta del Día

> Herramienta mobile-first para técnicos de campo — reto técnico para el rol de Ingeniero de IA en [AROMARIA](https://aromaria.mx).

El producto real detrás del reto es **Camino x Ops**: plataforma de gestión de servicio en campo para coordinar técnicos, rutas optimizadas, check-ins verificados por ubicación, captura de evidencia y monitoreo en tiempo real desde una vista de Ops Manager.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox_GL_JS-3-000000?style=flat-square&logo=mapbox&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?style=flat-square&logo=docker&logoColor=white)

![Estado](https://img.shields.io/badge/estado-funcional-22c55e?style=flat-square)
![Stretch goals](https://img.shields.io/badge/stretch_goals-3%2F4%20completados-3b82f6?style=flat-square)
![Demo mode](https://img.shields.io/badge/demo_mode-disponible-f59e0b?style=flat-square)

---

## Índice

1. [Quick Start](#quick-start)
2. [Pantallas de la app](#pantallas-de-la-app)
3. [Cómo probar cada flujo](#cómo-probar-cada-flujo)
4. [Referencia de API](#referencia-de-api)
5. [Stack y decisiones técnicas](#stack-y-decisiones-técnicas)
6. [Arquitectura](#arquitectura)
7. [Schema de base de datos](#schema-de-base-de-datos)
8. [Funcionalidad completada](#funcionalidad-completada)
9. [Qué dejé pendiente y qué haría con más tiempo](#qué-dejé-pendiente-y-qué-haría-con-más-tiempo)
10. [Uso de IA](#uso-de-ia)
11. [Entregables del reto](#entregables-del-reto)

---

## Quick Start

### Prerrequisitos

| Herramienta | Versión mínima | Dónde obtener |
|---|---|---|
| Node.js | 18 | [nodejs.org](https://nodejs.org) |
| Docker Desktop | cualquiera | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Token Mapbox | — | [account.mapbox.com](https://account.mapbox.com/) — gratuito |
| API key OpenRouteService | — | [openrouteservice.org](https://openrouteservice.org/dev/#/signup) — gratuito, sin tarjeta |

### 1. Clonar y configurar variables de entorno

```bash
git clone <repo-url>
cd RutaDelDia
cp .env.example .env
```

Edita `.env` con tus tokens:

```bash
# Conexión a la base de datos (valores del docker-compose, no cambiar)
DATABASE_URL="postgresql://rutadeldia:rutadeldia@localhost:5432/rutadeldia"

# Token público de Mapbox — necesario para renderizar el mapa
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1..."

# API key de OpenRouteService — necesaria para optimizar rutas
OPENROUTESERVICE_KEY="eyJ..."

# Desactiva el bloqueo por distancia (geofencing) para poder hacer check-in
# desde cualquier ubicación. Recomendado en true para demo y evaluación.
NEXT_PUBLIC_DEMO_MODE=true
```

> **Por qué `NEXT_PUBLIC_`:** Mapbox GL JS y la lógica de geofencing se ejecutan en el navegador, no en el servidor. Next.js solo expone variables al cliente si tienen el prefijo `NEXT_PUBLIC_`. Sin él, el mapa no renderiza y el modo demo no funciona.

### 2. Levantar la base de datos

```bash
docker compose up -d
```

Esto arranca un contenedor PostgreSQL 16 en el puerto 5432 con usuario/contraseña `rutadeldia`.

### 3. Instalar dependencias y preparar la base de datos

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

El seed carga **9 paradas reales en CDMX** para dos técnicos:

| Técnico | Paradas |
|---|---|
| `tech-001` | Polanco → Roma Norte → Condesa → Del Valle → Coyoacán |
| `tech-002` | Reforma → Centro Histórico → Santa Fe → Nápoles |

> El seed es **idempotente**: correrlo varias veces no duplica datos. Usa `upsert` para la ruta y `findFirst` antes de crear cada parada.

### 4. Correr la app

```bash
npm run dev
```

Abre **[http://localhost:3000](http://localhost:3000)** — redirige automáticamente a `/day`.

### Verificar datos con Prisma Studio (opcional)

```bash
npx prisma studio
```

Abre una interfaz visual en [http://localhost:5555](http://localhost:5555) para inspeccionar y editar registros directamente.

---

## Pantallas de la app

| Ruta | Pantalla | Usuario | Descripción |
|---|---|---|---|
| `/` | — | — | Redirect automático a `/day` |
| `/day` | Lista de paradas | Técnico | Paradas del día en orden optimizado con badges de estado. Contador de progreso en el header. |
| `/day/map` | Mapa interactivo | Técnico | Mapa Mapbox con la ruta trazada, markers numerados, botón de geolocalización y botón "siguiente parada" que hace `flyTo` a la primera parada pendiente. |
| `/stop/[id]` | Detalle de parada | Técnico | Nombre, dirección, distancia actual al punto. Botones Completada / Con incidente / Omitida. Campo de notas. Captura de foto de evidencia. El check-in requiere estar a menos de 100m (o `DEMO_MODE=true`). |
| `/ops` | Dashboard de operaciones | Ops Manager | Vista desktop-first. Contadores globales por estado. Tabla por técnico con estado de cada parada, hora de check-in y notas. Polling automático cada 10 segundos con indicador live. |

---

## Cómo probar cada flujo

### Flujo del técnico _(vista móvil recomendada)_

1. Abre `/day` — verás la lista de 5 paradas de `tech-001` en orden.
2. Toca cualquier tarjeta para ir al detalle de esa parada.
3. En `/stop/[id]`, si `NEXT_PUBLIC_DEMO_MODE=true`, los botones estarán activos aunque no estés físicamente en CDMX. Si está en `false`, necesitas estar a menos de 100m de la parada.
4. Selecciona **Completada** — aparece el campo de notas y el botón de foto de evidencia.
5. Sube una foto (en móvil activa la cámara trasera; en escritorio abre el selector de archivos).
6. Pulsa **Guardar y continuar** — regresa a `/day` con el estado actualizado.
7. Prueba también **Con incidente**: el campo de descripción es obligatorio, no puedes guardar sin escribir algo.
8. Ve a `/day/map` — verás la ruta trazada. El botón flotante apunta a la siguiente parada pendiente.

### Flujo del Ops Manager

1. Abre `/ops` directamente, o pulsa el botón **Ops** en el header de `/day`.
2. Verás los contadores globales y la tabla con los dos técnicos.
3. A medida que el técnico actualiza paradas desde `/stop/[id]`, el dashboard se refresca solo cada 10 segundos.
4. El punto verde pulsa mientras la conexión está activa. Si el servidor no responde, cambia a ámbar y mantiene los últimos datos conocidos.

### Resetear estados para volver a probar

El seed no resetea estados de paradas existentes. Para volver todo a `PENDING`:

```bash
# Opción A: Prisma Studio (visual)
npx prisma studio
# → tabla Stop → seleccionar todas → cambiar status a PENDING

# Opción B: reset completo de la base de datos
npx prisma migrate reset
npx prisma db seed
```

---

## Referencia de API

Todos los endpoints devuelven `application/json`. Los errores siguen el formato `{ "error": "descripción" }`.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/routes/today` | Ruta del día de `tech-001` con paradas e incidentes |
| `POST` | `/api/routes/optimize` | Optimiza el orden de paradas via ORS y persiste la ruta |
| `PATCH` | `/api/stops/[id]/status` | Actualiza estado, notas y `checkedInAt` de una parada |
| `POST` | `/api/stops/[id]/photo` | Recibe imagen, guarda en disco y actualiza `photoUrl` |
| `GET` | `/api/ops/summary` | Todas las rutas del día con contadores globales |

---

### `GET /api/routes/today`

Devuelve la ruta del día para `tech-001` con todas sus paradas ordenadas e incidentes incluidos.

**Respuesta exitosa `200`:**
```json
{
  "route": {
    "id": "clx...",
    "date": "2026-05-17T00:00:00.000Z",
    "techId": "tech-001",
    "stops": [
      {
        "id": "clx...",
        "order": 1,
        "name": "Corporativo Antara Polanco",
        "address": "Ejército Nacional Mexicano 843-B, Polanco, CDMX",
        "lat": 19.4335,
        "lng": -99.2035,
        "status": "PENDING",
        "notes": null,
        "photoUrl": null,
        "checkedInAt": null,
        "incident": null
      }
    ]
  }
}
```

`404` si no hay ruta asignada para hoy.

```bash
curl http://localhost:3000/api/routes/today
```

---

### `PATCH /api/stops/[id]/status`

Actualiza el estado de una parada. Al cambiar a `COMPLETED` o `SKIPPED`, registra `checkedInAt` con el timestamp actual. Operación atómica con `prisma.$transaction`.

**Body para `COMPLETED` o `SKIPPED`:**
```json
{
  "status": "COMPLETED",
  "notes": "Visita realizada sin problemas"
}
```

**Body para `INCIDENT`** — `description` es obligatorio:
```json
{
  "status": "INCIDENT",
  "description": "Acceso denegado por el edificio",
  "notes": "Se intentó contactar al responsable sin éxito"
}
```

`200` con el objeto `stop` actualizado. `400` si `status` es `INCIDENT` y falta `description`.

```bash
curl -X PATCH http://localhost:3000/api/stops/STOP_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED","notes":"Sin novedad"}'
```

---

### `POST /api/routes/optimize`

Recibe un array de paradas, llama al endpoint VRP de OpenRouteService para optimizar el orden, persiste la ruta en la base de datos y devuelve las paradas reordenadas.

**Body:**
```json
{
  "techId": "tech-001",
  "stops": [
    { "name": "Parada A", "address": "...", "lat": 19.43, "lng": -99.20 },
    { "name": "Parada B", "address": "...", "lat": 19.41, "lng": -99.17 }
  ]
}
```

> Requiere `OPENROUTESERVICE_KEY` válida en `.env`. Sin ella el endpoint devuelve `500`.

---

### `POST /api/stops/[id]/photo`

Recibe `multipart/form-data` con campo `photo`, valida que sea imagen y que no supere 5 MB, guarda en `public/uploads/` con nombre `crypto.randomUUID()` y actualiza `photoUrl` en la base de datos.

```bash
curl -X POST http://localhost:3000/api/stops/STOP_ID/photo \
  -F "photo=@/ruta/a/imagen.jpg"
```

---

### `GET /api/ops/summary`

Devuelve todas las rutas del día de todos los técnicos con contadores calculados server-side.

**Respuesta exitosa `200`:**
```json
{
  "summary": { "total": 9, "pending": 6, "completed": 2, "incident": 1, "skipped": 0 },
  "routes": [
    { "id": "clx...", "techId": "tech-001", "stops": [ ... ] },
    { "id": "clx...", "techId": "tech-002", "stops": [ ... ] }
  ]
}
```

---

## Stack y decisiones técnicas

| Tecnología | Decisión | Razonamiento |
|---|---|---|
| ![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js&logoColor=white) | Framework principal | Full-stack en un solo repo. SSR mejora la carga inicial en móvil con conexión débil. |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Lenguaje | Type safety de punta a punta: DB → API → UI. Errores que sin tipos solo aparecen en runtime. |
| ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | Estilos | Desarrollo mobile-first natural. Tap targets de 48px mínimo y breakpoints sin cambiar de contexto. |
| ![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=flat-square&logo=prisma&logoColor=white) | ORM | Schema como fuente de verdad, migraciones versionadas, tipos generados automáticamente. Fijado en v5 — Prisma 7 tiene breaking changes incompatibles con `url = env(...)`. |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white) | Base de datos | Relacional por la naturaleza del dominio. Docker evita instalar nada y garantiza paridad dev/prod. |
| ![Mapbox](https://img.shields.io/badge/Mapbox_GL_JS-000000?style=flat-square&logo=mapbox&logoColor=white) | Mapas | Visualmente superior a Leaflet. Tiles modernos, markers personalizables, `GeolocateControl` nativo. |
| ![ORS](https://img.shields.io/badge/OpenRouteService-009900?style=flat-square) | Optimización de rutas | Gratuito sin tarjeta de crédito. 500 req/día suficientes para el reto. Endpoint de VRP real (no solo directions). |

---

## Arquitectura

```
[Móvil del técnico]              [Escritorio del Ops Manager]
        │                                     │
        │                                     │
        ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 14 — App Router                   │
│                                                             │
│  /day           Lista de paradas ordenadas                  │
│  /day/map       Mapa Mapbox + ruta + GeolocateControl       │
│  /stop/[id]     Detalle + geofencing + estado + foto        │
│  /ops           Dashboard Ops Manager (polling 10s)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes                             │
│                                                             │
│  GET  /api/routes/today           Ruta del día con paradas  │
│  POST /api/routes/optimize        Llama ORS, persiste orden │
│  PATCH /api/stops/[id]/status     Estado + notas + checkin  │
│  POST /api/stops/[id]/photo       Imagen → public/uploads/  │
│  GET  /api/ops/summary            Resumen para dashboard    │
└─────────────┬────────────────────────────┬──────────────────┘
              │                            │
              ▼                            ▼
     ┌──────────────┐          ┌──────────────────────┐
     │   Prisma 5   │          │  OpenRouteService API │
     │              │          │  /optimization (VRP)  │
     └──────┬───────┘          └──────────────────────┘
            │
            ▼
     ┌────────────────┐
     │ PostgreSQL 16  │
     │                │
     │ Route          │
     │  └─ Stop[]     │
     │      └─ Incident? │
     └────────────────┘
```

### Estructura de carpetas

```
├── app/
│   ├── page.tsx                          # redirect → /day
│   ├── layout.tsx                        # fuente Inter, metadata, viewport mobile
│   ├── globals.css
│   │
│   ├── day/
│   │   ├── page.tsx                      # lista de paradas (tech-001)
│   │   ├── types.ts                      # StopData, RouteData, StopStatus
│   │   ├── map/
│   │   │   └── page.tsx                  # mapa fullscreen (dynamic import, ssr:false)
│   │   └── components/
│   │       ├── MapView.tsx               # Mapbox: markers, línea de ruta, fitBounds
│   │       ├── StopCard.tsx              # tarjeta de parada con badge de estado
│   │       ├── StopCardSkeleton.tsx      # skeleton de carga (animate-pulse)
│   │       ├── TabBar.tsx                # tabs Lista / Mapa
│   │       └── EmptyState.tsx            # pantalla cuando no hay ruta
│   │
│   ├── stop/
│   │   └── [id]/
│   │       ├── page.tsx                  # detalle de parada + geofencing
│   │       ├── components/
│   │       │   ├── StatusButtons.tsx     # botones Completada / Incidente / Omitida
│   │       │   ├── IncidentForm.tsx      # textarea obligatoria para incidentes
│   │       │   └── PhotoCapture.tsx      # input cámara + preview + upload
│   │       └── hooks/
│   │           └── useGeolocation.ts     # watchPosition + clearWatch cleanup
│   │
│   ├── ops/
│   │   ├── page.tsx                      # dashboard Ops Manager (polling 10s)
│   │   └── components/
│   │       ├── SummaryCards.tsx          # 4 tarjetas de contadores globales
│   │       ├── TechRouteTable.tsx        # tabla de paradas por técnico
│   │       └── LastUpdated.tsx           # indicador live / sin conexión
│   │
│   └── api/
│       ├── routes/
│       │   ├── today/route.ts
│       │   └── optimize/route.ts
│       ├── stops/[id]/
│       │   ├── status/route.ts
│       │   └── photo/route.ts
│       └── ops/
│           └── summary/route.ts
│
├── lib/
│   ├── prisma.ts                         # singleton PrismaClient
│   ├── openroute.ts                      # cliente OpenRouteService VRP
│   └── geofence.ts                       # fórmula Haversine
│
├── prisma/
│   ├── schema.prisma                     # fuente de verdad del schema
│   ├── seed.ts                           # 9 paradas reales en CDMX, 2 técnicos
│   └── migrations/
│
└── public/
    └── uploads/                          # fotos de evidencia (en .gitignore)
```

---

## Schema de base de datos

```
Route ──────────────────────────────────────────────────────┐
  id        cuid (PK)                                        │
  date      Date                                             │
  techId    String                                           │
  @@unique([date, techId])  ← un técnico, una ruta por día   │
                                                             │
Stop ◄──────────────────────────────────────────────────────┘
  id          cuid (PK)
  routeId     FK → Route.id
  order       Int               ← orden optimizado por ORS
  name        String
  address     String
  lat / lng   Float
  status      PENDING | COMPLETED | INCIDENT | SKIPPED
  notes       String?
  photoUrl    String?           ← ruta en /public/uploads/
  checkedInAt DateTime?         ← timestamp del check-in
  createdAt   DateTime
  updatedAt   DateTime

Incident ◄── (1:1 con Stop, máximo uno por parada)
  id          cuid (PK)
  stopId      FK → Stop.id (unique)
  description String
  createdAt   DateTime
```

**Decisiones del schema:**
- `@@unique([date, techId])` garantiza una sola ruta por técnico por día a nivel de base de datos, no solo en código.
- `Incident` es una tabla separada de `Stop` para que pueda crecer independientemente (severidad, fotos de incidente, etc.) sin tocar la tabla principal.
- `checkedInAt` en `Stop` permite que el Ops Manager vea tiempos reales de visita sin joins adicionales.
- El `PATCH` de estado usa `prisma.$transaction` para que la actualización de `Stop` y el upsert/delete de `Incident` sean atómicos.

---

## Funcionalidad completada

### Mínima (obligatoria)

- [x] Endpoint que recibe paradas y devuelve ruta optimizada por OpenRouteService VRP
- [x] Persistencia de estado por parada: `PENDING / COMPLETED / INCIDENT / SKIPPED`
- [x] Lista de paradas en orden optimizado con badges de estado por color
- [x] Mapa con ruta trazada, markers numerados, GeolocateControl y botón a siguiente parada pendiente
- [x] Detalle de parada con botones de estado (mínimo 48px de altura para uso con el dedo)
- [x] Campo de notas obligatorio al marcar estado `INCIDENT`

### Stretch goals

- [x] **Geofencing:** botones activos solo a menos de 100m de la parada. `navigator.geolocation` (`watchPosition`) + Haversine en `lib/geofence.ts`. Distancia actualizada en tiempo real.
- [x] **Captura de foto:** `<input capture="environment">` activa la cámara trasera en móvil. Preview local antes del upload. UUID como nombre de archivo.
- [x] **Ops Dashboard:** contadores globales + tabla por técnico + polling cada 10s + degradación grácil ante pérdida de conexión.
- [ ] Modo offline con sincronización posterior

---

## Qué dejé pendiente y qué haría con más tiempo

**Seed e idempotencia de estados**
`prisma/seed.ts` crea paradas si no existen pero no resetea `status`, notas ni incidentes. Para volver a un estado limpio en desarrollo, usa Prisma Studio (`npx prisma studio`) o `npx prisma migrate reset && npx prisma db seed`.

**Almacenamiento de fotos**
Las imágenes se guardan en `public/uploads/` (disco local). En producción esto no escalaría: el filesystem no es compartido en entornos multi-instancia y los archivos se perderían en cada redeploy. La solución es reemplazar `fs.writeFile` por un `putObject` a S3 o Cloudflare R2 en el endpoint `POST /api/stops/[id]/photo` — es un cambio en un solo lugar.

**Técnico hardcodeado**
`GET /api/routes/today` devuelve siempre la ruta de `tech-001`. En un sistema real, el técnico se identificaría con un token de sesión. No se implementó auth para no agregar fricción al setup del evaluador.

**Roles y autenticación**
La app actual trata a técnico y Ops Manager como el mismo actor sin credenciales. En producción son personas distintas con permisos distintos: el técnico solo debe ver y actualizar su propia ruta; el Ops Manager debe ver todas las rutas sin poder modificar estados. La arquitectura correcta requiere autenticación (JWT o sesiones) y middleware de autorización en las API routes — `/ops` y `/api/ops/summary` protegidas para el rol de manager, y `/api/stops/[id]/status` validando que el técnico autenticado sea el dueño de esa parada.

**Diseño UI/UX antes del código**
Normalmente dedicaría tiempo a wireframes y diseño en Figma antes de escribir la primera línea de código: definir el flujo de pantallas, los estados de cada componente (vacío, cargando, error, éxito), los tap targets para uso con guantes o bajo el sol, y la paleta de colores. En este reto prioricé la funcionalidad por el enfoque del enunciado, y la interfaz quedó funcional pero no tan pulida como me gustaría en un producto real. Con más tiempo habría iterado sobre el flujo de check-in, mejorado los estados de transición y probado la pantalla con usuarios reales en condiciones de campo.

**Modo offline**
Sin conexión la app no funciona. El siguiente paso sería un Service Worker con cache de la ruta del día y cola de actualizaciones para sincronizar cuando vuelva la red.

**Consola**
El navegador puede pedir `/manifest.json` (PWA). Si no existe en `public/`, verás un 404 en la consola. Es cosmético y no afecta la funcionalidad.

---

## Uso de IA

Este proyecto fue desarrollado con **Cursor** como copiloto (modelos Claude Opus 4.6 y Sonnet 4.5).

El enfoque no fue "generar y copiar" sino usar la IA para discutir decisiones de arquitectura, anticipar errores y avanzar más rápido — mientras mantengo criterio sobre qué aceptar. Ejemplos de decisiones donde no seguí la sugerencia del modelo:

- Rechacé usar SQLite en favor de Postgres desde el inicio (paridad dev/prod).
- Rechacé una tabla `Location` separada para lat/lng (over-engineering para este scope).
- Corregí el uso de `cuid` para nombres de archivo — `crypto.randomUUID()` es nativo y no requiere dependencia extra.
- Pedí agregar `tech-002` al seed porque un dashboard con un solo técnico no demuestra el valor de la vista agrupada.

Los casos completos están documentados en [`AI_LOG.md`](./AI_LOG.md).

> **Criterio aplicado:** Si no entiendo por qué la IA genera algo, no lo acepto hasta entenderlo.

---

## Entregables del reto

- [x] Repositorio en GitHub (público)
- [x] README con instrucciones completas, decisiones técnicas y pendientes — este archivo
- [ ] Video 5–10 min (Loom): app funcionando + arquitectura + uso de IA
- [x] `AI_LOG.md` con todas las decisiones relevantes y errores del modelo documentados
