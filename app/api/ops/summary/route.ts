import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const routes = await prisma.route.findMany({
      where: { date: today },
      include: {
        stops: {
          orderBy: { order: 'asc' },
          include: { incident: true },
        },
      },
      orderBy: { techId: 'asc' },
    })

    const allStops = routes.flatMap((r) => r.stops)
    const summary = {
      total: allStops.length,
      pending: allStops.filter((s) => s.status === 'PENDING').length,
      completed: allStops.filter((s) => s.status === 'COMPLETED').length,
      incident: allStops.filter((s) => s.status === 'INCIDENT').length,
      skipped: allStops.filter((s) => s.status === 'SKIPPED').length,
    }

    return NextResponse.json({ summary, routes }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/ops/summary]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
