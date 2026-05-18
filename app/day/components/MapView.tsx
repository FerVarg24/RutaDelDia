'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { StopData } from '../types'

function getNextPendingStop(stops: StopData[]): StopData | undefined {
  return stops.find((s) => s.status === 'PENDING')
}

interface MapViewProps {
  stops: StopData[]
}

const MARKER_COLORS: string[] = [
  '#3B82F6', // blue-500
  '#6366F1', // indigo-500
  '#8B5CF6', // violet-500
  '#A855F7', // purple-500
  '#EC4899', // pink-500
]

function getMarkerColor(order: number): string {
  return MARKER_COLORS[(order - 1) % MARKER_COLORS.length]
}

function createMarkerElement(order: number, color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: ${color};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 13px;
    font-weight: 700;
    font-family: system-ui, sans-serif;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: pointer;
  `
  el.textContent = String(order)
  return el
}

export default function MapView({ stops }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const router = useRouter()

  const nextStop = useMemo(() => getNextPendingStop(stops), [stops])

  function flyToNextStop() {
    if (!mapRef.current || !nextStop) return
    mapRef.current.flyTo({
      center: [nextStop.lng, nextStop.lat],
      zoom: 16,
      essential: true,
    })
  }

  useEffect(() => {
    if (!containerRef.current || stops.length === 0) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.error('[MapView] NEXT_PUBLIC_MAPBOX_TOKEN no configurado')
      return
    }

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [stops[0].lng, stops[0].lat],
      zoom: 12,
    })

    mapRef.current = map

    map.on('load', () => {
      // Trazar linea de ruta entre paradas en orden
      const coordinates = stops.map((s) => [s.lng, s.lat])

      map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {},
        },
      })

      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#3B82F6',
          'line-width': 3,
        },
      })

      // Agregar markers numerados
      for (const stop of stops) {
        const color = getMarkerColor(stop.order)
        const el = createMarkerElement(stop.order, color)

        el.addEventListener('click', () => {
          router.push(`/stop/${stop.id}`)
        })

        new mapboxgl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map)
      }

      // Auto-centrar con fitBounds para que todas las paradas sean visibles
      const lngs = stops.map((s) => s.lng)
      const lats = stops.map((s) => s.lat)
      const bounds: mapboxgl.LngLatBoundsLike = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ]

      map.fitBounds(bounds, { padding: 60, maxZoom: 15 })

      // El usuario pulsa el botón para activar — no se dispara automáticamente
      // para evitar solicitar permisos sin interacción explícita.
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          maximumAge: 10_000,
          timeout: 15_000,
        },
        trackUserLocation: true,
        showUserLocation: true,
        showAccuracyCircle: true,
      })

      map.addControl(geolocate, 'bottom-right')
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [stops, router])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="h-full w-full" />

      <button
        type="button"
        onClick={flyToNextStop}
        disabled={!nextStop}
        aria-label="Centrar mapa en la siguiente parada pendiente"
        className="absolute bottom-4 left-4 h-12 px-4 flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow-md text-sm font-medium text-gray-800 active:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4 shrink-0 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        {nextStop
          ? <span className="truncate max-w-[140px]">#{nextStop.order} — {nextStop.name}</span>
          : <span>Todo completado</span>
        }
      </button>
    </div>
  )
}
