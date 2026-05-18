# ROADMAP.md — Ruta del Día
 
Checklist de desarrollo. Cursor actualiza este archivo al completar cada tarea.
 
**Instrucción para Cursor:** Al terminar cada tarea, marca el checkbox correspondiente
cambiando `[ ]` por `[x]`. No marques tareas que no estén completadas y funcionando.
 
---
 
## Bloque 1 — Setup inicial (~45 min)
 
- [x] Crear proyecto Next.js 14 con TypeScript, Tailwind y App Router (scaffolding manual — create-next-app rechaza mayúsculas en el nombre del directorio)
- [x] Instalar dependencias: `prisma@5 @prisma/client@5 mapbox-gl @types/mapbox-gl tsx` (nota: Prisma 7 tiene breaking change con url= en schema, se fijó en v5)
- [x] Crear `docker-compose.yml` con Postgres 16 Alpine
- [x] Crear `prisma/schema.prisma` con modelos Route, Stop, Incident y enum StopStatus — validado con `prisma validate`
- [x] Crear `.env` con DATABASE_URL, NEXT_PUBLIC_MAPBOX_TOKEN y OPENROUTESERVICE_KEY + `.env.example`
- [x] Crear `lib/prisma.ts` con singleton PrismaClient
- [x] Crear `prisma/seed.ts` con 5 paradas reales en CDMX (Polanco → Roma → Condesa → Del Valle → Coyoacán) con upsert idempotente
- [x] Correr `docker compose up -d` ← pendiente (comando manual)
- [x] Correr `npx prisma migrate dev --name init` ← pendiente (comando manual)
- [x] Correr `npx prisma db seed` y verificar datos en Prisma Studio ← pendiente (comando manual)
---
 
## Bloque 2 — API (~60 min)
 
- [x] Crear `lib/openroute.ts` con función `optimizeRoute(stops: Stop[])` que llama a OpenRouteService
- [x] Crear `POST /api/routes/optimize` — recibe paradas, llama ORS, persiste ruta y orden en DB
- [x] Crear `GET /api/routes/today` — devuelve ruta del día con todas sus paradas
- [x] Crear `PATCH /api/stops/[id]/status` — actualiza status, notes y checkedInAt
- [x] Manejo de errores con try/catch y status codes correctos en los 3 endpoints
- [ ] Probar los 3 endpoints con Thunder Client o similar antes de continuar
---
 
## Bloque 3 — UI: lista de paradas (~60 min)
 
- [x] Crear componente `StopCard.tsx` con nombre, dirección y badge de estado
- [x] Colores por estado: PENDING=gris, COMPLETED=verde, INCIDENT=rojo, SKIPPED=amarillo
- [x] Crear página `/day` que fetchea GET /api/routes/today y muestra lista ordenada
- [x] Estado de carga (skeleton o spinner) mientras fetchea
- [x] Estado vacío si no hay ruta del día
- [x] Navegar a `/stop/[id]` al tocar una tarjeta
- [x] Botón o tab para ir a la vista de mapa
---
 
## Bloque 4 — UI: mapa interactivo (~60 min)
 
- [ ] Instalar `mapbox-gl` y crear `MapView.tsx` — SIEMPRE con `dynamic import` y `ssr: false`
- [ ] Mostrar paradas como markers numerados según su orden
- [ ] Trazar línea de ruta entre paradas en orden
- [ ] Centrar y ajustar el zoom automáticamente para mostrar todas las paradas
- [ ] Crear página `/day/map` con el mapa a pantalla completa
- [ ] Navegación Lista ↔ Mapa con tabs en la parte superior
---
 
## Bloque 5 — UI: detalle de parada (~60 min)
 
- [ ] Crear página `/stop/[id]` con nombre, dirección y estado actual de la parada
- [ ] Crear componente `StatusButtons.tsx` con botones: Completada / Con incidente / Omitida
- [ ] Crear componente `IncidentForm.tsx` con campo de nota obligatoria al elegir INCIDENT
- [ ] Llamar `PATCH /api/stops/[id]/status` al confirmar cualquier estado
- [ ] Mostrar campo de notas opcionales para COMPLETED y SKIPPED
- [ ] Regresar a `/day` después de guardar y reflejar el estado actualizado
- [ ] Botones con altura mínima de 48px (h-12) para uso con el dedo
---
 
## Bloque 6 — Stretch: geofencing (~45 min)
 
- [ ] Crear `lib/geofence.ts` con fórmula Haversine para calcular distancia entre dos coordenadas
- [ ] En `/stop/[id]` obtener posición del usuario con `navigator.geolocation`
- [ ] Deshabilitar botones de acción si la distancia a la parada es mayor a 100m
- [ ] Mostrar distancia actual en texto ("Estás a 340m de esta parada")
- [ ] Manejar caso donde el usuario niega permisos de ubicación
- [ ] Manejar caso donde el navegador no soporta geolocation
---
 
## Bloque 7 — Stretch: foto de evidencia (~30 min)
 
- [ ] Agregar `<input type="file" accept="image/*" capture="environment">` en detalle de parada
- [ ] Guardar imagen en `/public/uploads/` con nombre único (cuid)
- [ ] Crear endpoint `POST /api/stops/[id]/photo` que recibe el archivo y actualiza photoUrl
- [ ] Mostrar thumbnail de la foto si ya existe en paradas completadas
- [ ] Solo mostrar el input de foto al marcar como COMPLETED
---
 
## Bloque 8 — Stretch: Ops Dashboard (~45 min)
 
- [ ] Crear `GET /api/ops/summary` — devuelve todas las paradas del día agrupadas por técnico
- [ ] Crear página `/ops` con tabla de estado de todas las paradas
- [ ] Contadores en la parte superior: pendientes / completadas / incidentes / omitidas
- [ ] Polling cada 10s con `useEffect` + `setInterval` para actualización en tiempo real
- [ ] Indicador visual de "última actualización" para que el Ops Manager sepa que es live
---
 
## Bloque 9 — Documentación (~30 min)
 
- [x] Escribir `README.md` con instrucciones completas para correr localmente
- [x] Sección de decisiones técnicas justificadas en README
- [x] Sección "qué dejé pendiente y qué haría con más tiempo" en README (documento vivo, se actualiza al avanzar)
- [ ] Completar `AI_LOG.md` con todas las entradas de la fase de desarrollo
- [ ] Revisar que `CONTEXT.md` refleje el estado final del proyecto
---
 
## Resumen de progreso
 
| Bloque | Estado |
|---|---|
| 1 — Setup inicial | ✅ Completado |
| 2 — API | 🔄 En progreso (5/6 — falta prueba manual de endpoints) |
| 3 — UI: lista de paradas | ✅ Completado |
| 4 — UI: mapa | ⬜ Pendiente |
| 5 — UI: detalle de parada | ⬜ Pendiente |
| 6 — Geofencing (stretch) | ⬜ Pendiente |
| 7 — Foto de evidencia (stretch) | ⬜ Pendiente |
| 8 — Ops Dashboard (stretch) | ⬜ Pendiente |
| 9 — Documentación | 🔄 En progreso (3/5 ítems — README completo, AI_LOG y CONTEXT.md al final) |
 
**Instrucción para Cursor:** Actualiza el emoji de la tabla al terminar cada bloque.
⬜ Pendiente → 🔄 En progreso → ✅ Completado
