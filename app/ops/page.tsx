'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { StopData } from '@/app/day/types'
import SummaryCards from './components/SummaryCards'
import TechRouteTable from './components/TechRouteTable'
import LastUpdated from './components/LastUpdated'

interface Summary {
  total: number
  pending: number
  completed: number
  incident: number
  skipped: number
}

interface RouteWithStops {
  id: string
  techId: string
  stops: StopData[]
}

interface OpsData {
  summary: Summary
  routes: RouteWithStops[]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function OpsPage() {
  const [data, setData] = useState<OpsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [hasError, setHasError] = useState(false)

  async function fetchSummary() {
    try {
      const res = await fetch('/api/ops/summary')
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = (await res.json()) as OpsData
      setData(json)
      setLastUpdated(new Date())
      setHasError(false)
    } catch {
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    const interval = setInterval(fetchSummary, 10_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/day"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Volver a la ruta del día"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                Panel de Operaciones
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 capitalize ml-8">
              {formatDate(new Date())}
            </p>
          </div>
          <LastUpdated timestamp={lastUpdated} hasError={hasError} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Estado de carga inicial */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Sin datos */}
        {!loading && (!data || data.routes.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503-8.498 4.875-2.437a.75.75 0 0 1 1.122.65v13.5a.75.75 0 0 1-1.122.65l-4.875-2.437M9 6.75a.75 .75 0 0 0-1.122-.65L2.878 8.687A.75.75 0 0 0 2.25 9.337v13.5a.75.75 0 0 0 1.122.65l4.75-2.375A.75.75 0 0 0 9 20.337V6.75z"
                />
              </svg>
            </div>
            <p className="font-medium text-gray-700 mb-1">
              No hay rutas para hoy
            </p>
            <p className="text-sm text-gray-500">
              Las rutas aparecerán aquí cuando se asignen a los técnicos.
            </p>
          </div>
        )}

        {/* Contenido */}
        {!loading && data && data.routes.length > 0 && (
          <>
            <SummaryCards summary={data.summary} />
            <div className="space-y-4">
              {data.routes.map((route) => (
                <TechRouteTable
                  key={route.id}
                  techId={route.techId}
                  stops={route.stops}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
