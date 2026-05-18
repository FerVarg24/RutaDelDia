# AI_LOG.md — Ruta del Día

Bitácora honesta del proceso de desarrollo con IA.
Documenta prompts importantes, errores del modelo y decisiones donde no seguí la sugerencia.

---

## Fase 1 — Diseño de arquitectura (antes de escribir código)

### Herramienta: Claude (claude.ai)
Usé Claude para discutir y decidir la arquitectura completa antes de tocar Cursor.

---

### Decisión 1 — Librería de mapas: Leaflet vs Mapbox

**Sugerencia inicial del modelo:** Leaflet con OpenStreetMap (gratuito, sin tarjeta).

**Mi decisión: Mapbox.** El modelo inicialmente priorizó evitar fricción de setup,
pero al preguntar directamente, reconoció que Mapbox es visualmente superior.
Decidí asumir el costo de configurar un token porque el impacto visual es parte
de la evaluación — AROMARIA evalúa decisiones de producto y la UX para el técnico.

**Por qué importa:** Un mapa más bonito comunica que pensé en el usuario final,
no solo en que el código funcione.

---

### Decisión 2 — Base de datos: SQLite en dev vs Postgres desde el inicio

**Sugerencia inicial del modelo:** SQLite en desarrollo para evitar instalar dependencias.

**Mi decisión: Postgres desde el día uno con Docker.** El modelo sugirió SQLite
para reducir fricción inicial, pero yo tengo Docker instalado y la complejidad
extra es mínima (`docker compose up -d`). Usar el mismo motor en dev y prod
elimina una clase entera de bugs y es la decisión más honesta técnicamente.

**Error del modelo:** Optimizó para el caso donde el desarrollador no tiene Docker.
Al confirmar que sí lo tenía, el modelo estuvo de acuerdo en que Postgres directo
es la mejor decisión.

---

### Decisión 3 — Servicio de optimización de rutas: Google Maps vs Mapbox vs OpenRouteService

**Decisión: OpenRouteService.** El modelo recomendó ORS sobre Google Maps porque:
- Gratuito sin necesidad de ingresar tarjeta de crédito
- 500 requests/día suficientes para el reto
- API REST simple con endpoint de optimización de vehículos
- Google Maps requiere billing habilitado — riesgo innecesario en un reto técnico

**Seguí la sugerencia.** La justificación fue sólida y no hay downside real para
este caso de uso.

---

### Decisión 4 — ORM y estructura del schema

**Decisión: Prisma con schema explícito.**

Puntos donde seguí la sugerencia del modelo:
- `@@unique([date, techId])` en Route — garantiza una ruta por técnico por día
  a nivel de base de datos, no solo en código
- `Incident` como tabla separada de `Stop` — permite que crezca independientemente
  sin modificar el schema de paradas
- `checkedInAt` como campo en Stop — útil para el dashboard de Ops Manager sin
  costo adicional en el schema

Punto donde cuestioné al modelo:
- Inicialmente sugirió una tabla `Location` separada para lat/lng. Rechacé esto
  porque es over-engineering para el alcance del reto. Las coordenadas viven
  directamente en `Stop`.

---

### Decisión 5 — Stretch goals y orden de prioridad

El modelo sugirió este orden de impacto para los stretch goals:
1. Geofencing — demuestra que pensé en el técnico real, una sola función
2. Ops Dashboard — muy visible para AROMARIA como empresa de field ops
3. Captura de foto — `<input capture="environment">` activa cámara en móvil

**Seguí esta priorización.** El razonamiento de conectar cada stretch goal
con los criterios de evaluación fue convincente.

---

## Fase 2 — Desarrollo con Cursor

### Herramienta: Cursor (Claude Opus 4.6 y Sonnet 4.5)

---

### Bloque 1, Problema 1 — `create-next-app` rechaza el directorio

**Prompt usado:** "Inicializa el proyecto con `npx create-next-app@14 . --typescript --tailwind --app --no-src-dir`"

**Lo que generó Cursor:** Ejecutó el comando tal cual. npm rechazó el nombre
del paquete porque el directorio `RutaDelDia` tiene mayúsculas, y npm no
permite mayúsculas en nombres de paquetes:
`Could not create a project called "RutaDelDia" because of npm naming restrictions: name can no longer contain capital letters`

**Problema encontrado:** El comando falló silenciosamente — si no hubiera
revisado la salida del terminal, habría asumido que el proyecto se creó.

**Cómo lo corregí:** Cursor adaptó y creó el scaffolding manualmente
(package.json, tsconfig.json, tailwind.config.ts, layout.tsx, globals.css, etc.)
en lugar de insistir con el comando. El resultado es equivalente pero con más
control sobre cada archivo.

**Lección:** Siempre revisar la salida de los comandos, especialmente los de
scaffolding que parecen "infalibles". El nombre del directorio de trabajo es
algo que ni yo ni el modelo anticipamos como fuente de error.

---

### Bloque 1, Problema 2 — Prisma 7 breaking change (el más importante)

**Prompt usado:** "Instala dependencias: prisma @prisma/client mapbox-gl @types/mapbox-gl"

**Lo que generó Cursor:** `npm install prisma @prisma/client`, que instaló
Prisma 7.8.0 (última versión). Hasta aquí todo parecía normal.

**Problema encontrado:** Al correr `npx prisma validate`, el schema falló con:
`The datasource property 'url' is no longer supported in schema files.`

Prisma 7 eliminó `url = env("DATABASE_URL")` del bloque `datasource` en el
schema. Ahora requiere un archivo `prisma.config.ts` separado y cambia cómo
se configura el cliente. Esto es un breaking change mayor que habría roto
`prisma migrate dev` más adelante.

**Cómo lo corregí:** Downgrade a Prisma 5 con `npm install prisma@^5 @prisma/client@^5`.
El schema definido en CONTEXT.md usa la sintaxis de Prisma 4/5 y no hay razón
para migrar a Prisma 7 dentro del alcance de este reto.

**Lección:** Nunca instalar dependencias sin pinear la versión mayor cuando el
código depende de APIs específicas. `npm install prisma` sin `@^5` es una
bomba de tiempo. El hecho de que Cursor no pineó la versión automáticamente
demuestra que hay que validar cada paso — `prisma validate` fue lo que salvó
la situación. Sin esa verificación, el error habría aparecido recién al
intentar la migración, mucho más difícil de diagnosticar.

---

### Errores comunes a anticipar y documentar cuando ocurran

- Mapbox importado sin `dynamic` + `ssr: false` → rompe en SSR
- OpenRouteService: confundir endpoint de directions con el de optimization ← **resuelto en Bloque 2**
- `navigator.geolocation` llamado en Server Component → mover a Client Component

---

## Bloque 2 — API

### Herramienta: Cursor (Sonnet 4.6)

---

### Bloque 2, Decisión 1 — Orden de coordenadas en OpenRouteService

**Contexto:** OpenRouteService usa el estándar GeoJSON, que define las coordenadas como
`[longitude, latitude]` — el orden inverso a como los humanos (y Prisma/la DB) los almacenan
(`lat`, `lng`).

**Lo que hizo el modelo:** Lo implementó correctamente desde el primer intento en `lib/openroute.ts`,
usando `[stop.lng, stop.lat]` en el campo `location` de cada job y en el `start` del vehículo.

**Por qué lo documento:** Es uno de los errores más frecuentes con APIs de mapas y que estaba
anticipado en la sección de errores de esta bitácora. El hecho de que el modelo lo manejara
correctamente sin necesidad de corrección habla bien del contexto que se le dio (CONTEXT.md
especifica explícitamente el endpoint a usar). Lo verificaré al probar el endpoint POST /optimize.

---

### Bloque 2, Decisión 2 — Atomicidad en PATCH /stops/[id]/status con $transaction

**Decisión del modelo:** Envolver la actualización del Stop y el upsert/delete del Incident
en una transacción Prisma (`prisma.$transaction`).

**Seguí la sugerencia.** La razón es correcta: si el update del Stop tiene éxito pero el
upsert del Incident falla (o viceversa), la DB queda en un estado inconsistente — una parada
marcada como INCIDENT sin Incident, o un Incident huérfano. La transacción garantiza que
ambas operaciones ocurren juntas o ninguna ocurre.

**Detalle adicional:** Se implementó también la limpieza del Incident cuando el status cambia
de INCIDENT a otro valor (`deleteMany` dentro de la transacción). Esto no estaba en el
enunciado original pero es el comportamiento correcto — si el técnico corrige un error,
el incidente no debe quedar colgado.

---

### Bloque 2, Decisión 3 — Estrategia en POST /optimize: deleteMany + createMany vs update individual

**Contexto:** Al llamar POST /optimize con nuevas paradas (o re-optimizar), hay que decidir
cómo manejar las paradas existentes de la ruta en la DB.

**Opciones consideradas:**
1. `deleteMany` todas las paradas existentes y `createMany` las nuevas — más simple
2. Actualizar cada parada existente con su nuevo `order` — más conservador con los IDs

**Decisión del modelo: opción 1 (deleteMany + createMany).** Lo validé: para el alcance
del reto, donde POST /optimize se llama al inicio del día para crear la ruta, no hay paradas
con estado `COMPLETED` o `INCIDENT` que valga la pena conservar. Si en el futuro se quisiera
re-optimizar una ruta en progreso, habría que revisar esta decisión.

**Seguí la sugerencia** porque la simplicidad supera el riesgo en el contexto actual.

---

### Bloque 2, Resultado de pruebas

- `GET /api/routes/today` → ✅ Probado y funcionando. Devuelve ruta con 5 paradas ordenadas e Incidents incluidos.
- `PATCH /api/stops/[id]/status` → ✅ Probado con COMPLETED y con INCIDENT (description obligatoria validada).
- `POST /api/routes/optimize` → ⏳ Pendiente de probar con OPENROUTESERVICE_KEY activa.