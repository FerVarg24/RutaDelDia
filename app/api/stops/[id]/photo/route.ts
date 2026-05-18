import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existingStop = await prisma.stop.findUnique({ where: { id } })
    if (!existingStop) {
      return NextResponse.json(
        { error: `Parada con id '${id}' no encontrada` },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('photo')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Se requiere el campo 'photo' con un archivo de imagen" },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen (image/*)' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'La imagen no puede superar 5 MB' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${crypto.randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const photoUrl = `/uploads/${filename}`

    const updatedStop = await prisma.stop.update({
      where: { id },
      data: { photoUrl },
    })

    return NextResponse.json({ photoUrl: updatedStop.photoUrl }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/stops/[id]/photo]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
