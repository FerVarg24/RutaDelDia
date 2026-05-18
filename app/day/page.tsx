'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TabBar from './components/TabBar'
import StopCard from './components/StopCard'
import StopCardSkeleton from './components/StopCardSkeleton'
import EmptyState from './components/EmptyState'
import type { RouteData } from './types'

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function DayPage() {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ruta del Día</h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              {formatDate(new Date())}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {!loading && route && (
              <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                {completedCount}/{totalCount}
              </span>
            )}
            <Link
              href="/ops"
              className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              Ops
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <TabBar activeTab="list" />

      {/* Contenido */}
      <main className="flex-1 px-4 py-4 space-y-3">
        {loading && (
          <>
            <StopCardSkeleton />
            <StopCardSkeleton />
            <StopCardSkeleton />
            <StopCardSkeleton />
            <StopCardSkeleton />
          </>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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
          <>
            {route.stops.map((stop) => (
              <StopCard key={stop.id} stop={stop} />
            ))}
          </>
        )}
      </main>
    </div>
  )
}
