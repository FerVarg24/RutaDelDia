import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const route = await prisma.route.findUnique({
      where: {
        date_techId: {
          date: today,
          techId: 'tech-001',
        },
      },
      include: {
        stops: {
          orderBy: { order: 'asc' },
          include: { incident: true },
        },
      },
    })

    if (!route) {
      return NextResponse.json(
        { error: 'No hay ruta asignada para hoy' },
        { status: 404 }
      )
    }

    return NextResponse.json({ route }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/routes/today]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
