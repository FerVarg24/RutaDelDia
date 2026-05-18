import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { optimizeRoute } from '@/lib/openroute'

interface StopBody {
  name: string
  address: string
  lat: number
  lng: number
}

interface OptimizeRequestBody {
  techId: string
  stops: StopBody[]
}

function isValidBody(body: unknown): body is OptimizeRequestBody {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  if (typeof b.techId !== 'string' || b.techId.trim() === '') return false
  if (!Array.isArray(b.stops) || b.stops.length === 0) return false
  return b.stops.every(
    (s) =>
      typeof s === 'object' &&
      s !== null &&
      typeof (s as Record<string, unknown>).name === 'string' &&
      typeof (s as Record<string, unknown>).address === 'string' &&
      typeof (s as Record<string, unknown>).lat === 'number' &&
      typeof (s as Record<string, unknown>).lng === 'number'
  )
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()

    if (!isValidBody(body)) {
      return NextResponse.json(
        { error: 'Body inválido. Se requiere techId (string) y stops (array no vacío con name, address, lat, lng)' },
        { status: 400 }
      )
    }

    const { techId, stops } = body

    // Crear stops temporales con IDs ficticios solo para llamar a ORS
    const stopsForOrs = stops.map((s, i) => ({
      id: String(i),
      lat: s.lat,
      lng: s.lng,
    }))

    let optimizedOrder: { id: string; order: number }[]
    try {
      optimizedOrder = await optimizeRoute(stopsForOrs)
    } catch (orsError) {
      const message = orsError instanceof Error ? orsError.message : 'Error desconocido en ORS'
      return NextResponse.json(
        { error: `Error al optimizar la ruta con OpenRouteService: ${message}` },
        { status: 502 }
      )
    }

    // Construir mapa de índice -> orden optimizado
    const orderMap = new Map(optimizedOrder.map(({ id, order }) => [id, order]))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Upsert de la ruta del día para este técnico
    const route = await prisma.route.upsert({
      where: {
        date_techId: { date: today, techId },
      },
      update: {},
      create: { date: today, techId },
    })

    // Eliminar Incidents y paradas existentes en orden correcto (FK: Incident → Stop)
    await prisma.$transaction(async (tx) => {
      const existingStops = await tx.stop.findMany({
        where: { routeId: route.id },
        select: { id: true },
      })
      const stopIds = existingStops.map((s) => s.id)

      if (stopIds.length > 0) {
        await tx.incident.deleteMany({ where: { stopId: { in: stopIds } } })
        await tx.stop.deleteMany({ where: { id: { in: stopIds } } })
      }

      await tx.stop.createMany({
        data: stops.map((stop, index) => ({
          routeId: route.id,
          order: orderMap.get(String(index)) ?? index + 1,
          name: stop.name,
          address: stop.address,
          lat: stop.lat,
          lng: stop.lng,
        })),
      })
    })

    // Devolver la ruta completa con paradas ordenadas
    const routeWithStops = await prisma.route.findUnique({
      where: { id: route.id },
      include: {
        stops: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json({ route: routeWithStops }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/routes/optimize]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
