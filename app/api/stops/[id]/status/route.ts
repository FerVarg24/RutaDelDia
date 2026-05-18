import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StopStatus } from '@prisma/client'

interface StatusRequestBody {
  status: StopStatus
  notes?: string
  description?: string
}

const VALID_STATUSES = Object.values(StopStatus)

function isValidStatus(value: unknown): value is StopStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as StopStatus)
}

function isValidBody(body: unknown): body is StatusRequestBody {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  if (!isValidStatus(b.status)) return false
  if (b.notes !== undefined && typeof b.notes !== 'string') return false
  if (b.description !== undefined && typeof b.description !== 'string') return false
  return true
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const body: unknown = await request.json()

    if (!isValidBody(body)) {
      return NextResponse.json(
        {
          error: `Body inválido. 'status' debe ser uno de: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const { status, notes, description } = body

    // La descripción del incidente es obligatoria cuando el status es INCIDENT
    if (status === StopStatus.INCIDENT) {
      if (!description || description.trim() === '') {
        return NextResponse.json(
          { error: "Se requiere 'description' cuando el status es INCIDENT" },
          { status: 400 }
        )
      }
    }

    // Verificar que la parada existe
    const existingStop = await prisma.stop.findUnique({
      where: { id },
    })

    if (!existingStop) {
      return NextResponse.json(
        { error: `Parada con id '${id}' no encontrada` },
        { status: 404 }
      )
    }

    // Actualizar la parada en una transacción para manejar el Incident atómicamente
    const updatedStop = await prisma.$transaction(async (tx) => {
      const stop = await tx.stop.update({
        where: { id },
        data: {
          status,
          notes: notes ?? existingStop.notes,
          checkedInAt: new Date(),
        },
      })

      if (status === StopStatus.INCIDENT && description) {
        // Upsert del incidente (puede actualizarse si ya existía)
        await tx.incident.upsert({
          where: { stopId: id },
          update: { description: description.trim() },
          create: { stopId: id, description: description.trim() },
        })
      } else if (status !== StopStatus.INCIDENT) {
        // Si se cambió de INCIDENT a otro estado, limpiar el incidente previo
        await tx.incident.deleteMany({ where: { stopId: id } })
      }

      return tx.stop.findUnique({
        where: { id: stop.id },
        include: { incident: true },
      })
    })

    return NextResponse.json({ stop: updatedStop }, { status: 200 })
  } catch (error) {
    console.error('[PATCH /api/stops/[id]/status]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
