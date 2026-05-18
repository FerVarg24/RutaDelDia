import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TECH_001 = 'tech-001'
const TECH_002 = 'tech-002'

const stopsTech001 = [
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

const stopsTech002 = [
  {
    order: 1,
    name: 'Torre Mayor Reforma',
    address: 'Paseo de la Reforma 505, Cuauhtémoc, CDMX',
    lat: 19.4318,
    lng: -99.1706,
  },
  {
    order: 2,
    name: 'Centro Histórico — Zócalo',
    address: 'Plaza de la Constitución 1, Centro, CDMX',
    lat: 19.4326,
    lng: -99.1332,
  },
  {
    order: 3,
    name: 'Parque Empresarial Santa Fe',
    address: 'Vasco de Quiroga 3000, Santa Fe, CDMX',
    lat: 19.3614,
    lng: -99.2598,
  },
  {
    order: 4,
    name: 'World Trade Center Nápoles',
    address: 'Montecito 38, Nápoles, CDMX',
    lat: 19.3961,
    lng: -99.1763,
  },
]

async function seedTech(techId: string, stops: typeof stopsTech001) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const route = await prisma.route.upsert({
    where: { date_techId: { date: today, techId } },
    update: {},
    create: { date: today, techId },
  })

  console.log(`\nRuta creada/existente para ${techId}: ${route.id}`)

  for (const stopData of stops) {
    const existing = await prisma.stop.findFirst({
      where: { routeId: route.id, order: stopData.order },
    })

    if (!existing) {
      const stop = await prisma.stop.create({
        data: { ...stopData, routeId: route.id },
      })
      console.log(`  ✓ Parada ${stop.order}: ${stop.name}`)
    } else {
      console.log(`  → Parada ${existing.order} ya existe: ${existing.name}`)
    }
  }
}

async function main() {
  await seedTech(TECH_001, stopsTech001)
  await seedTech(TECH_002, stopsTech002)

  console.log('\n¡Seed completado! 5 paradas para tech-001, 4 paradas para tech-002.')
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
