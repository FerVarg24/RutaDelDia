# CONTEXT.md — Ruta del Día

## Qué es esto
Reto técnico para el rol de Ingeniero de IA en AROMARIA.
App llamada "Ruta del Día": herramienta mobile-first para técnicos de campo.

**Producto real detrás del reto:** Camino x Ops — plataforma de gestión de
servicio en campo para coordinar técnicos, rutas, check-ins por ubicación,
capturas de evidencia y monitoreo en tiempo real desde una vista de Ops Manager.

---

## Problema que resuelve
Un técnico llega a trabajar y necesita saber:
1. A qué lugares tiene que ir hoy
2. En qué orden ir para no perder tiempo
3. Cómo registrar qué pasó en cada visita (completada, incidente, omitida)
4. Cómo dejar evidencia de su trabajo (notas, fotos)

El Ops Manager necesita ver en tiempo real el estado de todas las paradas
de todos los técnicos del día.

---

## Stack y justificaciones

| Tecnología | Decisión | Por qué |
|---|---|---|
| Next.js 14 App Router | Framework principal | Full-stack en un solo repo, SSR para carga rápida en móvil |
| TypeScript | Lenguaje | Type safety en toda la cadena: DB → API → UI |
| Tailwind CSS | Estilos | Desarrollo rápido, mobile-first natural |
| Prisma | ORM | Type safety con la DB, migraciones simples, schema como fuente de verdad |
| PostgreSQL (Docker) | Base de datos | Relacional por la naturaleza del dominio, Docker evita instalar nada |
| Mapbox GL JS | Mapas | Visualmente superior a Leaflet, tiles modernos, modo oscuro nativo |
| OpenRouteService | Optimización de rutas | Gratuito sin tarjeta, API REST simple, 500 req/día suficiente para el reto |

---

## Arquitectura

```
[Móvil del técnico]
       │
       ▼
[Next.js Frontend]
  /day           → Lista de paradas ordenadas
  /day/map       → Mapa con ruta trazada
  /stop/[id]     → Detalle + check-in + estado
  /ops           → Dashboard Ops Manager (stretch)
       │
       ▼
[Next.js API Routes]
  POST /api/routes/optimize     → Llama ORS, persiste orden
  GET  /api/routes/today        → Devuelve ruta del día
  PATCH /api/stops/[id]/status  → Actualiza estado + notas
  GET  /api/ops/summary         → Resumen para dashboard
       │
  ┌────┴────┐
  ▼         ▼
[Prisma]  [OpenRouteService API]
  │
  ▼
[PostgreSQL]
  Routes → Stops → Incidents
```

---

## Schema de base de datos

```prisma
model Route {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  techId    String
  createdAt DateTime @default(now())
  stops     Stop[]
  @@unique([date, techId])   // un técnico, una ruta por día
}

model Stop {
  id          String     @id @default(cuid())
  routeId     String
  order       Int        // orden optimizado por ORS
  name        String
  address     String
  lat         Float
  lng         Float
  status      StopStatus @default(PENDING)
  notes       String?
  photoUrl    String?    // stretch: evidencia fotográfica
  checkedInAt DateTime?  // timestamp del check-in
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  route       Route      @relation(fields: [routeId], references: [id])
  incident    Incident?
}

model Incident {
  id          String   @id @default(cuid())
  stopId      String   @unique  // máximo 1 incidente por parada
  description String
  createdAt   DateTime @default(now())
  stop        Stop     @relation(fields: [stopId], references: [id])
}

enum StopStatus {
  PENDING
  COMPLETED
  INCIDENT
  SKIPPED
}
```

**Decisiones del schema:**
- `@@unique([date, techId])` evita rutas duplicadas a nivel de DB, no solo en código
- `Incident` separado de `Stop` para que pueda crecer independientemente
- `checkedInAt` para que Ops Manager vea tiempos reales de visita
- `photoUrl` como String opcional, sin cambiar schema para el stretch goal

---

---

## Comandos para correr localmente

```bash
# 1. Levantar la base de datos
docker compose up -d

# 2. Instalar dependencias
npm install

# 3. Crear tablas
npx prisma migrate dev --name init

# 4. Cargar datos de prueba
npx prisma db seed

# 5. Correr el proyecto
npm run dev
```

---

## Funcionalidad mínima (obligatoria)

- [x] Endpoint que recibe paradas y devuelve ruta optimizada
- [x] Persistencia de estado por parada (PENDING / COMPLETED / INCIDENT / SKIPPED)
- [x] Lista de paradas en orden optimizado
- [x] Mapa con ruta y paradas numeradas
- [x] Detalle de parada con botones de estado y campo de notas
- [x] Nota obligatoria al marcar "con incidente"

## Stretch goals (opcionales)

- [ ] Geofencing: check-in solo activo a <100m de la parada
- [ ] Captura de foto como evidencia
- [ ] Ops Dashboard con estado en tiempo real
- [ ] Modo offline con sincronización posterior

---

## Criterios de evaluación

| Área | Peso | Qué buscan |
|---|---|---|
| Calidad de código y arquitectura | 25% | Estructura limpia, separación de responsabilidades, manejo de errores |
| Colaboración con IA | 30% | Prompts pensados, detectar cuando la IA se equivoca, no aceptar código a ciegas |
| Decisiones de producto | 15% | ¿Entendiste el problema del técnico de campo? ¿La UX tiene sentido en móvil? |
| Comunicación | 15% | README, video y AI_LOG claros y honestos |
| Stretch goals | 15% | Qué tan lejos llegaste y qué tan bien lo ejecutaste |

---

## Lo que más importa según AROMARIA

> "¿Sabes cuándo confiar en la IA y cuándo no?"
> "¿Pensaste en el técnico que va a usar esto?"
> "¿Eres honesto sobre tus límites?"

El técnico usa el celular con sol, con una mano, posiblemente con guantes.
Eso debe verse en la UX: botones grandes, estados claros, flujos cortos.

---

## Entregables

1. Repositorio en GitHub (público)
2. README con instrucciones, decisiones técnicas y pendientes
3. Video 5-10 min (Loom): app funcionando + arquitectura + uso de IA
4. AI_LOG.md: prompts importantes, errores del modelo, correcciones

---

## Notas de implementación importantes

- **Mapbox en Next.js**: siempre `dynamic(() => import('./MapView'), { ssr: false })`.
  Mapbox accede a `window` y rompe en SSR sin esto.
- **OpenRouteService**: usar el endpoint de optimización de vehículos, no solo directions.
  Endpoint: `https://api.openrouteservice.org/optimization`
- **Geofencing**: implementar con `navigator.geolocation` + fórmula Haversine.
  No requiere ninguna API externa.