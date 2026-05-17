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

## Fase 2 — Desarrollo (por completar)

*Esta sección se llenará durante el desarrollo con Cursor.*

Formato a seguir para cada entrada:

```
### [Bloque N] — [Descripción corta]
**Prompt usado:** "..."
**Lo que generó Cursor:** ...
**Problema encontrado:** ...
**Cómo lo corregí:** ...
**Lección:** ...
```

Errores comunes a anticipar y documentar cuando ocurran:
- Mapbox importado sin `dynamic` + `ssr: false` → rompe en SSR
- PrismaClient instanciado múltiples veces → usar singleton en lib/prisma.ts
- OpenRouteService: confundir endpoint de directions con el de optimization
- `navigator.geolocation` llamado en Server Component → mover a Client Component