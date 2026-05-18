// Tipos para el request/response del endpoint VROOM de OpenRouteService
// Docs: https://openrouteservice.org/dev/#/api-docs/optimization

interface OrsJob {
  id: number
  location: [number, number] // [longitude, latitude] — orden GeoJSON
}

interface OrsVehicle {
  id: number
  profile: 'driving-car'
  start: [number, number] // [longitude, latitude]
}

interface OrsOptimizeRequest {
  jobs: OrsJob[]
  vehicles: OrsVehicle[]
}

interface OrsRouteStep {
  type: 'start' | 'job' | 'end'
  job?: number // índice del job (coincide con OrsJob.id)
}

interface OrsOptimizeResponse {
  routes: Array<{
    steps: OrsRouteStep[]
  }>
}

export interface StopInput {
  id: string
  lat: number
  lng: number
}

export interface OptimizedStop {
  id: string
  order: number
}

export async function optimizeRoute(
  stops: StopInput[]
): Promise<OptimizedStop[]> {
  const apiKey = process.env.OPENROUTESERVICE_KEY

  if (!apiKey) {
    throw new Error('OPENROUTESERVICE_KEY no está definida en las variables de entorno')
  }

  if (stops.length === 0) {
    throw new Error('Se requiere al menos una parada para optimizar la ruta')
  }

  // Si solo hay una parada, no hay nada que optimizar
  if (stops.length === 1) {
    return [{ id: stops[0].id, order: 1 }]
  }

  // ORS usa [longitude, latitude], NOT [lat, lng]
  const jobs: OrsJob[] = stops.map((stop, index) => ({
    id: index,
    location: [stop.lng, stop.lat],
  }))

  // El vehículo parte desde la primera parada del array original
  const vehicle: OrsVehicle = {
    id: 1,
    profile: 'driving-car',
    start: [stops[0].lng, stops[0].lat],
  }

  const requestBody: OrsOptimizeRequest = {
    jobs,
    vehicles: [vehicle],
  }

  const response = await fetch(
    'https://api.openrouteservice.org/optimization',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `OpenRouteService devolvió ${response.status}: ${errorText}`
    )
  }

  const data = (await response.json()) as OrsOptimizeResponse

  if (!data.routes || data.routes.length === 0 || !data.routes[0].steps) {
    throw new Error('OpenRouteService devolvió una respuesta inesperada sin rutas')
  }

  // Extraer solo los steps de tipo "job" (excluye start/end del vehículo)
  const jobSteps = data.routes[0].steps.filter(
    (step) => step.type === 'job' && step.job !== undefined
  )

  // Mapear el orden optimizado de vuelta a los IDs originales
  const optimized: OptimizedStop[] = jobSteps.map((step, orderIndex) => ({
    id: stops[step.job!].id,
    order: orderIndex + 1,
  }))

  return optimized
}
