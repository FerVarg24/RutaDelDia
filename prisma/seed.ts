import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TECH_ID = 'tech-001'

const stops = [
  {
    order: 1,
    name: 'Corporativo Antara Polanco',
    address: 'Ejército Nacional Mexicano 843-B, Polanco, CDMX',
    lat: 19.4335,
    lng: -99.2035,
  },
  {
    order: 2,
    name: 'Oficinas Roma Norte',
    address: 'Álvaro Obregón 171, Roma Norte, CDMX',
    lat: 19.4195,
    lng: -99.162,
  },
  {
    order: 3,
    name: 'Edificio Condesa',
    address: 'Ámsterdam 17, Condesa, CDMX',
    lat: 19.4115,
    lng: -99.174,
  },
  {
    order: 4,
    name: 'Torre Del Valle',
    address: 'Insurgentes Sur 1079, Del Valle Norte, CDMX',
    lat: 19.391,
    lng: -99.168,
  },
  {
    order: 5,
    name: 'Centro Coyoacán',
    address: 'Jardín Centenario 1, Coyoacán, CDMX',
    lat: 19.35,
    lng: -99.162,
  },
]

async function main() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const route = await prisma.route.upsert({
    where: {
      date_techId: {
        date: today,
        techId: TECH_ID,
      },
    },
    update: {},
    create: {
      date: today,
      techId: TECH_ID,
    },
  })

  console.log(`Ruta creada/existente: ${route.id}`)

  for (const stopData of stops) {
    const existing = await prisma.stop.findFirst({
      where: {
        routeId: route.id,
        order: stopData.order,
      },
    })

    if (!existing) {
      const stop = await prisma.stop.create({
        data: {
          ...stopData,
          routeId: route.id,
        },
      })
      console.log(`  ✓ Parada ${stop.order}: ${stop.name}`)
    } else {
      console.log(`  → Parada ${existing.order} ya existe: ${existing.name}`)
    }
  }

  console.log('\n¡Seed completado! 5 paradas cargadas para', TECH_ID)
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
