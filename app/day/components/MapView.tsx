'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { StopData } from '../types'

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
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [stops, router])

  return <div ref={containerRef} className="w-full h-full" />
}
