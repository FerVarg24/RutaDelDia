'use client'

import { useRouter } from 'next/navigation'
import type { StopData, StopStatus } from '../types'

interface StopCardProps {
  stop: StopData
}

const STATUS_CONFIG: Record<StopStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-gray-100 text-gray-600' },
  COMPLETED: { label: 'Completada', classes: 'bg-green-100 text-green-700' },
  INCIDENT: { label: 'Incidente', classes: 'bg-red-100 text-red-700' },
  SKIPPED: { label: 'Omitida', classes: 'bg-yellow-100 text-yellow-700' },
}

function getOrderColor(order: number): string {
  const colors = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-pink-500',
  ]
  return colors[(order - 1) % colors.length]
}

export default function StopCard({ stop }: StopCardProps) {
  const router = useRouter()
  const { label, classes } = STATUS_CONFIG[stop.status]

  return (
    <button
      type="button"
      onClick={() => router.push(`/stop/${stop.id}`)}
      className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 min-h-[72px] flex items-center gap-4 active:bg-gray-50 transition-colors"
    >
      {/* Número de orden */}
      <div
        className={`${getOrderColor(stop.order)} shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold`}
      >
        {stop.order}
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-gray-900 truncate">{stop.name}</p>
        <p className="text-sm text-gray-500 truncate mt-0.5">{stop.address}</p>
      </div>

      {/* Badge de estado + chevron */}
      <div className="shrink-0 flex items-center gap-2">
        <span
          className={`${classes} text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap`}
        >
          {label}
        </span>
        <svg
          className="w-4 h-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
