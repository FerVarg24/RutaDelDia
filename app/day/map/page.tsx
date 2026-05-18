'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import TabBar from '../components/TabBar'
import EmptyState from '../components/EmptyState'
import type { RouteData } from '../types'

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function MapSkeleton() {
  return (
    <div className="flex-1 bg-gray-100 animate-pulse flex items-center justify-center">
      <svg
        className="w-12 h-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
        />
      </svg>
    </div>
  )
}

const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

export default function MapPage() {
  const [route, setRoute] = useState<RouteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchRoute() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/routes/today')
      if (res.status === 404) {
        setRoute(null)
        return
      }
      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }
      const data = (await res.json()) as { route: RouteData }
      setRoute(data.route)
    } catch {
      setError('No se pudo cargar la ruta. Revisa tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoute()
  }, [])

  const completedCount =
    route?.stops.filter(
      (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'
    ).length ?? 0
  const totalCount = route?.stops.length ?? 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 pt-5 pb-4 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ruta del Día</h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              {formatDate(new Date())}
            </p>
          </div>

          {!loading && route && (
            <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full mt-1">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <TabBar activeTab="map" />

      {/* Contenido */}
      {loading && <MapSkeleton />}

      {!loading && error && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">
            Algo salió mal
          </p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchRoute}
            className="h-12 px-6 bg-blue-600 text-white text-sm font-medium rounded-xl active:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && !route && <EmptyState />}

      {!loading && !error && route && (
        <div className="flex-1 min-h-0">
          <MapView stops={route.stops} />
        </div>
      )}
    </div>
  )
}
