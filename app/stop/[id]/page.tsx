'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusButtons from './components/StatusButtons'
import IncidentForm from './components/IncidentForm'
import { useGeolocation } from './hooks/useGeolocation'
import { haversineDistance, formatDistance, GEOFENCE_RADIUS } from '@/lib/geofence'
import type { StopData, StopStatus, RouteData } from '@/app/day/types'

interface StopPageProps {
  params: { id: string }
}

// ---------------------------------------------------------------------------
// Componente de estado GPS — inline para evitar prop drilling innecesario
// ---------------------------------------------------------------------------

interface GeoStatusBannerProps {
  geoLoading: boolean
  geoError: import('./hooks/useGeolocation').GeolocationError | null
  distance: number | null
}

function GeoStatusBanner({ geoLoading, geoError, distance }: GeoStatusBannerProps) {
  if (geoLoading) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin shrink-0" aria-hidden="true" />
        <p className="text-sm text-gray-500">Obteniendo ubicación...</p>
      </div>
    )
  }

  if (geoError === 'UNSUPPORTED') {
    return (
      <div className="bg-red-50 rounded-xl border border-red-100 px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-red-700">Tu navegador no soporta geolocalización. Usa un navegador moderno para registrar visitas.</p>
      </div>
    )
  }

  if (geoError === 'PERMISSION_DENIED') {
    return (
      <div className="bg-red-50 rounded-xl border border-red-100 px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-sm text-red-700">Ubicación no permitida. Activa el permiso en la configuración de tu navegador para registrar esta parada.</p>
      </div>
    )
  }

  if (geoError === 'TIMEOUT' || geoError === 'POSITION_UNAVAILABLE') {
    return (
      <div className="bg-amber-50 rounded-xl border border-amber-100 px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <p className="text-sm text-amber-700">No se pudo obtener tu ubicación. Verifica que el GPS esté activo.</p>
      </div>
    )
  }

  if (distance === null) return null

  const withinRange = distance <= GEOFENCE_RADIUS

  if (withinRange) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-100 px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <p className="text-sm text-green-700">Estás a <span className="font-semibold">{formatDistance(distance)}</span> de esta parada</p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-100 px-4 py-3 flex items-start gap-3">
      <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
      <p className="text-sm text-amber-700">
        Estás a <span className="font-semibold">{formatDistance(distance)}</span> de esta parada — acércate para registrar
      </p>
    </div>
  )
}

const STATUS_CONFIG: Record<StopStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-gray-100 text-gray-600' },
  COMPLETED: { label: 'Completada', classes: 'bg-green-100 text-green-700' },
  INCIDENT: { label: 'Incidente', classes: 'bg-red-100 text-red-700' },
  SKIPPED: { label: 'Omitida', classes: 'bg-yellow-100 text-yellow-700' },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function StopPage({ params }: StopPageProps) {
  const { id } = params
  const router = useRouter()

  const [stop, setStop] = useState<StopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [selectedStatus, setSelectedStatus] = useState<StopStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [incidentDescription, setIncidentDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showIncidentError, setShowIncidentError] = useState(false)

  const { coords, loading: geoLoading, error: geoError } = useGeolocation()

  useEffect(() => {
    async function fetchStop() {
      setLoading(true)
      setFetchError(null)
      try {
        const res = await fetch('/api/routes/today')
        if (!res.ok) {
          throw new Error(`Error ${res.status}`)
        }
        const data = (await res.json()) as { route: RouteData }
        const found = data.route.stops.find((s) => s.id === id)
        if (!found) {
          throw new Error('Parada no encontrada')
        }
        setStop(found)
        // Prellenar estado e incidente previos si existen
        if (found.status !== 'PENDING') {
          setSelectedStatus(found.status)
        }
        if (found.incident?.description) {
          setIncidentDescription(found.incident.description)
        }
        if (found.notes) {
          setNotes(found.notes)
        }
      } catch {
        setFetchError('No se pudo cargar la parada. Revisa tu conexión.')
      } finally {
        setLoading(false)
      }
    }
    fetchStop()
  }, [id])

  async function handleSave() {
    if (!selectedStatus) return

    if (selectedStatus === 'INCIDENT' && incidentDescription.trim() === '') {
      setShowIncidentError(true)
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const body: {
        status: StopStatus
        notes?: string
        description?: string
      } = { status: selectedStatus }

      if (notes.trim()) body.notes = notes.trim()
      if (selectedStatus === 'INCIDENT') body.description = incidentDescription.trim()

      const res = await fetch(`/api/stops/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? `Error ${res.status}`)
      }

      router.push('/day')
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'No se pudo guardar. Intenta de nuevo.'
      )
    } finally {
      setSaving(false)
    }
  }

  const distance =
    coords && stop
      ? haversineDistance(coords.lat, coords.lng, stop.lat, stop.lng)
      : null

  const geoBlocked =
    geoLoading ||
    geoError !== null ||
    (distance !== null && distance > GEOFENCE_RADIUS)

  const isConfirmDisabled =
    !selectedStatus ||
    (selectedStatus === 'INCIDENT' && incidentDescription.trim() === '') ||
    saving ||
    geoBlocked

  // --- Estados de carga y error del fetch ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 pt-5 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="h-5 w-32 rounded bg-gray-100 animate-pulse" />
        </header>
        <main className="flex-1 px-4 py-4 space-y-4">
          <div className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
        </main>
      </div>
    )
  }

  if (fetchError || !stop) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-gray-700 font-medium mb-1">Algo salió mal</p>
        <p className="text-sm text-gray-500 mb-4">{fetchError ?? 'Parada no encontrada'}</p>
        <Link href="/day" className="h-12 px-6 inline-flex items-center bg-blue-600 text-white text-sm font-medium rounded-xl active:bg-blue-700 transition-colors">
          Volver a la ruta
        </Link>
      </div>
    )
  }

  const { label: statusLabel, classes: statusClasses } = STATUS_CONFIG[stop.status]

  // --- Vista principal ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 pt-5 pb-4 flex items-center gap-3 shrink-0">
        <Link
          href="/day"
          className="h-10 w-10 flex items-center justify-center rounded-full text-gray-500 active:bg-gray-100 transition-colors shrink-0"
          aria-label="Volver a la ruta"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Parada #{stop.order}</h1>
      </header>

      {/* Contenido con scroll */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-32">
        {/* Tarjeta de información */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-gray-900 leading-snug">{stop.name}</p>
              <p className="text-sm text-gray-500 mt-1">{stop.address}</p>
            </div>
            <span className={`${statusClasses} text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0`}>
              {statusLabel}
            </span>
          </div>

          {stop.checkedInAt && (
            <p className="text-xs text-gray-400 mt-3">
              Check-in registrado a las {formatTime(stop.checkedInAt)}
            </p>
          )}
        </div>

        {/* Bloque de estado GPS / distancia */}
        <GeoStatusBanner geoLoading={geoLoading} geoError={geoError} distance={distance} />

        {/* Botones de estado */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
          <StatusButtons
            currentStatus={stop.status}
            selectedStatus={selectedStatus}
            disabled={geoBlocked}
            onSelect={(status) => {
              setSelectedStatus(status)
              setShowIncidentError(false)
              setSaveError(null)
            }}
          />
        </div>

        {/* Formulario de incidente */}
        {selectedStatus === 'INCIDENT' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
            <IncidentForm
              description={incidentDescription}
              onChange={(val) => {
                setIncidentDescription(val)
                if (val.trim()) setShowIncidentError(false)
              }}
              showError={showIncidentError}
            />
          </div>
        )}

        {/* Notas opcionales para COMPLETED y SKIPPED */}
        {(selectedStatus === 'COMPLETED' || selectedStatus === 'SKIPPED') && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 space-y-1.5">
            <label htmlFor="stop-notes" className="text-sm font-medium text-gray-700">
              Notas adicionales <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="stop-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega observaciones si lo deseas..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
            />
          </div>
        )}
      </main>

      {/* Footer sticky con boton confirmar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 safe-area-bottom">
        {saveError && (
          <p className="text-xs text-red-600 text-center mb-2">{saveError}</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isConfirmDisabled}
          className="w-full h-12 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white active:bg-blue-700"
        >
          {saving ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </div>
    </div>
  )
}
