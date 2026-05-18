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

---

## Bloque 4 — Mapa interactivo

---

### Bloque 4, Decisión 1 — `dynamic()` en la página, no dentro de MapView

El modelo puso el `dynamic(() => import('../components/MapView'), { ssr: false })` en la página `/day/map/page.tsx`, no dentro del propio `MapView.tsx`. Lo validé antes de aceptar: es la forma correcta. Si `MapView` se encargara de su propio dynamic import, el componente no podría importarse directamente en otros contextos (tests, otras páginas con distinta estrategia). El `ssr: false` es responsabilidad del consumidor, no del componente.

**Seguí la sugerencia** porque la separación de responsabilidades es correcta.

---

### Bloque 4, Decisión 2 — `fitBounds` con `maxZoom: 15`

El modelo incluyó `maxZoom: 15` en la llamada a `fitBounds`. Podría parecer un detalle menor, pero sin ese límite, si dos paradas estuvieran muy cerca (mismo edificio, mismo predio), Mapbox haría un zoom tan extremo que el mapa perdería contexto de navegación.

**Seguí la sugerencia.** Es el tipo de caso edge que se descubre probando con datos reales y que el modelo anticipó correctamente.

---

## Bloque 5 — Detalle de parada

---

### Bloque 5, Decisión 1 — Reutilizar `GET /api/routes/today` vs. crear `GET /api/stops/[id]`

El plan propuso fetchear la ruta completa del día y filtrar por `id` en el cliente, en lugar de crear un endpoint `GET /api/stops/[id]`. El tradeoff es real: la página trae todos los datos de la ruta para encontrar una sola parada. Acepté la decisión con conciencia: para 5 paradas en un demo local, la simplicidad gana. En producción con rutas de 30-50 paradas, el endpoint dedicado sería necesario. Lo dejé documentado en el código con un comentario.

**Seguí la sugerencia** pero reconociendo el límite explícitamente, no ciegamente.

---

### Bloque 5, Decisión 2 — `showError` como prop en IncidentForm

Diseñé `IncidentForm` para recibir `showError: boolean` desde la página padre en lugar de manejar el estado de error internamente. El modelo lo propuso así. La razón es correcta: el error de "descripción vacía" solo debe mostrarse cuando el usuario intenta confirmar, no mientras escribe. Si el componente manejara su propio estado de error, podría activarse demasiado pronto. El control del error en el padre garantiza que aparece solo cuando es accionable.

**Seguí la sugerencia** porque la decisión tiene una justificación de UX clara.

---

## Bloque 6 — Geofencing

### Herramienta: Cursor (agente / planificación + implementación)

---

### Bloque 6, Problema 1 — `navigator.geolocation` no puede vivir en Server Components

**Contexto:** El detalle `/stop/[id]` en App Router hay que tratarlo como Client Component (`'use client'`) donde se llame a `navigator.geolocation`. Ya estaba anticipado en la sección "Errores comunes" de esta bitácora.

**Lo que hizo el modelo:** Encapsuló la API en un hook `useGeolocation` con `useEffect`, igual que otras integraciones con `window`. Sin ese aislamiento, cualquier intento de leer GPS durante SSR rompería o daría `navigator is not defined`.

**Lección:** El checklist del CONTEXT.md sirve: lo que toca el navegador va en efectos del cliente, no en el árbol servidor.

---

### Bloque 6, Decisión 1 — `watchPosition` vs `getCurrentPosition`

**Sugerencia razonable del modelo / plan:** `watchPosition` con `clearWatch` en el cleanup del efecto.

**Por qué la acepté:** El técnico puede abrir el detalle mientras camina hacia la parada. Con una sola lectura (`getCurrentPosition`) la distancia queda congelada; con `watchPosition` el texto de metros y el bloqueo de botones reaccionan cuando entra o sale del radio de 100m sin recargar la página. Opciones alineadas con uso en campo: `enableHighAccuracy: true`, `maximumAge: 10_000`, `timeout: 15_000` para no martillar el GPS en vacío.

**Tradeoff:** Más actualizaciones y más renders que una lectura única; para 5 paradas y una pantalla a la vez es aceptable. Si en el futuro hubiera problema de batería, se podría pasar a lectura bajo demanda o aumentar `maximumAge`.

---

### Bloque 6, Decisión 2 — Permiso denegado o geolocalización no disponible

**Qué propuso el enfoque de producto:** Si no hay ubicación confiable, no se debe poder hacer PATCH de estado (sin "modo incógnito" que anule el geofencing).

**Lo que hice yo al revisarlo:** Alineado con apps de campo reales: mensaje claro en la UI (permiso, timeout, no soportado), página igualmente usable para **leer** datos de la parada, pero botones de estado y "Guardar y continuar" deshabilitados.

**Error que quise evitar:** Un aviso débil que el usuario ignore y así el reto de "check-in verificado por ubicación" pierde sentido frente a quien evalúa.

---

El técnico camina hacia la parada mientras la página está abierta. Con `getCurrentPosition` la distancia es una foto fija del momento en que se cargó la página; con `watchPosition` el indicador actualiza en tiempo real conforme el técnico se acerca, lo que sirve de guía visual. La limpieza con `clearWatch` en el `useEffect` cleanup previene fugas de batería al salir de la página. El riesgo de re-renders excesivos se mitiga con `maximumAge: 10000` — el navegador no emite actualizaciones más frecuentes que cada ~10s si la posición no cambió significativamente.

**Alternativa descartada:** `getCurrentPosition` + botón "Actualizar ubicación". Añade fricción innecesaria en el flujo del técnico y no aporta garantía extra de presencia física.

---

### Bloque 6, Problema 2 — Confundí "ruta completa" con "mapa roto"

**Síntoma:** En `/day/map` solo se veía el botón flotante ("Todo completado") y no el mapa; pensé que era porque todas las paradas estaban en estado distinto de `PENDING`.

**Problema real:** El contenedor que Mapbox usa para el canvas quedó sin altura útil (layout con `absolute`/`flex` mal encadenados). Los datos de la ruta seguían llegando bien; el fallo era de CSS, no de la base de datos ni del estado de las paradas.

**Cómo lo corregí:** Volví a un patrón estable: wrapper `relative h-full w-full` y el `div` que recibe `ref` para Mapbox en flujo con `h-full w-full`, con el botón encima en `absolute`. Así el mapa siempre tiene dimensiones antes de `new mapboxgl.Map(...)`.

**Lección:** Antes de achacar algo a Prisma o al seed, inspeccionar tamaño del contenedor en DevTools; Mapbox en altura 0 no siempre tira un error obvio en UI.

---

### Bloque 6, Problema 3 — Consola: `manifest.json` 404

**Lo que mostró el navegador:** `GET /manifest.json 404` en la pestaña Mapa.

**Problema encontrado:** Chrome pide el manifiesto PWA aunque el proyecto no lo tenga en `public/`. No está relacionado con Mapbox ni con el geofencing.

**Cómo lo traté:** Lo documenté en CONTEXT/README como ruido esperado; opcionalmente se puede añadir un `manifest.json` mínimo más adelante si molesta en la demo.

---

## Bloque 7 — Foto de evidencia

### Herramienta: Cursor (agente / planificación + implementación)

---

### Bloque 7, Decisión 2 — Almacenamiento en `public/uploads/` vs. servicio externo

**Opciones consideradas:** guardar las imágenes en disco local (`public/uploads/`) vs. configurar un servicio de objeto como S3 o Cloudflare R2.

**Decisión: disco local.** Para un reto técnico cuyo entorno de ejecución es localhost, añadir credenciales y SDK de un servicio cloud no aporta valor demostrable. La complejidad solo añadiría fricción al setup del evaluador. Se eligió la opción más simple que cumple el requisito funcional.

**Tradeoff documentado explícitamente:** en producción real, `public/uploads/` no escalaría (el filesystem del servidor no es compartido en entornos multi-instancia, y los archivos se perderían en cada redeploy). El punto de cambio es un único lugar: el endpoint `POST /api/stops/[id]/photo`, donde `writeFile` se reemplazaría por un `putObject` a S3/R2. Se dejó consignado en el README para que sea visible en la evaluación.

**Seguí la decisión del plan** porque el argumento de simplicidad vs. scope del reto es correcto.

---

### Bloque 7, Decisión 3 — `crypto.randomUUID()` para nombre de archivo único

**Sugerencia original del plan:** usar `cuid` para generar nombres únicos, consistente con el resto del schema de Prisma.

**Mi decisión: `crypto.randomUUID()`.** El plan mencionaba `cuid` por consistencia con los IDs de Prisma, pero instalar una dependencia para una sola función utilitaria disponible nativamente en Node 19+ y en el runtime de Next.js 14 es innecesario. `crypto.randomUUID()` produce UUIDs v4 estándar, sin colisiones y sin dependencia extra.

**Por qué lo cuestioné:** al revisar el código del endpoint, noté que el plan decía "cuid" pero la implementación ya usaba `crypto.randomUUID()`. Preferí documentar la decisión consciente: si el proyecto ya tiene `cuid` como dependencia (Prisma lo usa internamente), no habría problema en usarlo; pero exponer esa dependencia en código de aplicación sin necesidad no es correcto.

---

### Bloque 7, Decisión 5 — Demo Mode: variable de entorno vs. query param

**Contexto:** Para la demo de presentación del reto, los botones de check-in están bloqueados si el evaluador no está físicamente en las coordenadas de las paradas de CDMX. Era necesario un mecanismo que permitiera mostrar la funcionalidad completa (incluyendo foto de evidencia) sin estar en ubicación.

**Opciones evaluadas:**
1. `NEXT_PUBLIC_DEMO_MODE=true` en `.env` — un punto de control, documentado en `.env.example`, requiere reinicio del servidor al cambiar
2. `?demo=true` como query param en la URL — no requiere reinicio, pero es ad-hoc y más difícil de controlar y explicar

**Decisión: variable de entorno.** La razón principal no es técnica sino de presentación: en el video del reto se puede mostrar el `.env`, explicar la variable y su propósito, y demostrar que el geofencing real funciona simplemente cambiando el valor. Es más honesto y más fácil de auditar que un query param que cualquiera puede añadir a la URL. El geofencing no desaparece de la UI en demo mode — los banners de distancia siguen mostrándose de forma informativa; solo se deshabilita el bloqueo de botones.

**Seguí la sugerencia** porque el argumento de transparencia en la demo es correcto.

---