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
NEXT_PUBLIC_DEMO_MODE=true              # desactiva geofencing para demos (quitar en producción)
```

> **Por qué `NEXT_PUBLIC_`:** Mapbox GL JS se inicializa en el browser, no en el servidor. Next.js solo expone variables al cliente si tienen el prefijo `NEXT_PUBLIC_`. Sin él, el mapa no puede autenticarse. Lo mismo aplica a `NEXT_PUBLIC_DEMO_MODE`, que se lee en el cliente para decidir si bloquear los botones por distancia.

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

---

## Arquitectura

```
[Móvil del técnico]
       │
       ▼
[Next.js 14 — App Router]
  /day              → Lista de paradas ordenadas
  /day/map          → Mapa con ruta trazada, GeolocateControl y botón a siguiente parada pendiente
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
│       ├── stops/[id]/status/route.ts
│       └── stops/[id]/photo/route.ts   # sube imagen, actualiza photoUrl
├── components/
│   ├── StopCard.tsx
│   ├── MapView.tsx                 # siempre dynamic import, ssr: false
│   ├── StatusButtons.tsx
│   ├── IncidentForm.tsx
│   └── PhotoCapture.tsx            # input cámara + preview + upload
├── lib/
│   ├── prisma.ts                   # singleton PrismaClient
│   ├── openroute.ts                # cliente OpenRouteService
│   └── geofence.ts                 # fórmula Haversine (stretch)
├── public/
│   └── uploads/                    # fotos de evidencia (no versionadas en git)
└── prisma/
    ├── schema.prisma
    └── seed.ts                     # 5 paradas reales en CDMX
```

---

## Funcionalidad

### Mínima (obligatoria)

- [x] Endpoint que recibe paradas y devuelve ruta optimizada por ORS
- [x] Persistencia de estado por parada (PENDING / COMPLETED / INCIDENT / SKIPPED)
- [x] Lista de paradas en orden optimizado
- [x] Mapa con ruta trazada y paradas numeradas; ubicación del usuario (Mapbox Geolocate); salto a primera parada pendiente
- [x] Detalle de parada con botones de estado y campo de notas
- [x] Nota obligatoria al marcar estado INCIDENT

### Stretch goals

- [x] Geofencing: botones activos solo a menos de 100m de la parada (Haversine + geolocalización en el cliente)
- [x] Captura de foto como evidencia de visita (`capture="environment"`, preview local, upload a `/public/uploads/`)
- [ ] Ops Dashboard con estado en tiempo real (polling cada 10s)
- [ ] Modo offline con sincronización posterior

---

## Qué dejé pendiente y qué haría con más tiempo

> Esta sección se actualiza honestamente al avanzar el proyecto.

- **Seed:** `prisma/seed.ts` crea paradas si no existen pero no resetea `status` ni incidentes. Para volver a probar flujos con todo en `PENDING`, usa [Prisma Studio](https://www.prisma.io/studio) (`npx prisma studio`) o borra datos y vuelve a migrar/seedear en entorno local.
- **Demo Mode:** `NEXT_PUBLIC_DEMO_MODE=true` en `.env` desactiva el bloqueo por distancia del geofencing, útil para demos y desarrollo. Los banners de distancia siguen apareciendo de forma informativa. Para producción real, esta variable debe eliminarse o ponerse en `false`.
- **Almacenamiento de fotos:** las imágenes se guardan en `public/uploads/` (disco local). Para producción se debería migrar a un servicio de objeto como S3 o Cloudflare R2; el endpoint `POST /api/stops/[id]/photo` es el único punto a cambiar.
- **Stretch sin hacer:** Ops dashboard, modo offline (ver ROADMAP Bloques 8–9).
- **Consola:** peticiones a `/manifest.json` pueden devolver 404 si no hay manifest en `public/`; es cosmético y no afecta la app.

Este proyecto fue desarrollado con Cursor como copiloto.

El enfoque no fue "generar y copiar", sino usar la IA para discutir decisiones, detectar errores y avanzar más rápido — mientras mantengo criterio sobre qué aceptar. Los casos donde cuestioné o rechacé las sugerencias están documentados en [`AI_LOG.md`](./AI_LOG.md).

**Criterio aplicado:** Si no entiendo por qué la IA genera algo, no lo acepto hasta entenderlo.

---

## Entregables del reto

- [x] Repositorio en GitHub (público)
- [x] README con instrucciones, decisiones técnicas y pendientes ← este archivo
- [ ] Video 5-10 min (Loom): app funcionando + arquitectura + uso de IA
- [x] AI_LOG.md actualizado con fases y decisiones relevantes (incl. mapa y geofencing)
