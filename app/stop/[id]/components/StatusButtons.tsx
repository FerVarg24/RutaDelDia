'use client'

import type { StopStatus } from '@/app/day/types'

interface StatusButtonsProps {
  currentStatus: StopStatus
  selectedStatus: StopStatus | null
  onSelect: (status: StopStatus) => void
  disabled?: boolean
}

interface ButtonConfig {
  status: StopStatus
  label: string
  idleClasses: string
  activeClasses: string
  icon: React.ReactNode
}

const BUTTONS: ButtonConfig[] = [
  {
    status: 'COMPLETED',
    label: 'Completada',
    idleClasses: 'bg-green-50 text-green-700 border-green-200',
    activeClasses: 'bg-green-600 text-white border-green-600 ring-2 ring-green-400',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
  {
    status: 'INCIDENT',
    label: 'Con incidente',
    idleClasses: 'bg-red-50 text-red-700 border-red-200',
    activeClasses: 'bg-red-600 text-white border-red-600 ring-2 ring-red-400',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    status: 'SKIPPED',
    label: 'Omitida',
    idleClasses: 'bg-amber-50 text-amber-700 border-amber-200',
    activeClasses: 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-300',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
      </svg>
    ),
  },
]

export default function StatusButtons({ currentStatus, selectedStatus, onSelect, disabled = false }: StatusButtonsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Actualizar estado</p>

      {currentStatus !== 'PENDING' && (
        <p className="text-xs text-gray-400">
          Estado actual:{' '}
          <span className="font-medium">
            {currentStatus === 'COMPLETED' && 'Completada'}
            {currentStatus === 'INCIDENT' && 'Con incidente'}
            {currentStatus === 'SKIPPED' && 'Omitida'}
            {currentStatus === 'PENDING' && 'Pendiente'}
          </span>
        </p>
      )}

      {BUTTONS.map(({ status, label, idleClasses, activeClasses, icon }) => {
        const isSelected = selectedStatus === status
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            disabled={disabled}
            className={`w-full h-12 flex items-center gap-3 px-4 rounded-xl border text-sm font-medium transition-all ${
              disabled
                ? 'opacity-50 cursor-not-allowed ' + idleClasses
                : isSelected
                  ? activeClasses
                  : idleClasses
            }`}
          >
            {icon}
            {label}
            {isSelected && !disabled && (
              <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
