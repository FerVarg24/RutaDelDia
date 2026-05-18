import type { StopData, StopStatus } from '@/app/day/types'

interface TechRouteTableProps {
  techId: string
  stops: StopData[]
}

const STATUS_CONFIG: Record<StopStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pendiente', classes: 'bg-gray-100 text-gray-600' },
  COMPLETED: { label: 'Completada', classes: 'bg-green-100 text-green-700' },
  INCIDENT: { label: 'Incidente', classes: 'bg-red-100 text-red-700' },
  SKIPPED: { label: 'Omitida', classes: 'bg-yellow-100 text-yellow-700' },
}

function formatCheckin(checkedInAt: string | null): string {
  if (!checkedInAt) return '—'
  return new Date(checkedInAt).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TechRouteTable({ techId, stops }: TechRouteTableProps) {
  const completed = stops.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'
  ).length

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Encabezado del técnico */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {techId.slice(-3).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-900 text-sm">{techId}</span>
        </div>
        <span className="text-xs font-medium text-gray-500">
          {completed}/{stops.length} completadas
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide w-10">
                #
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Parada
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">
                Dirección
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Estado
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">
                Check-in
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">
                Notas / Incidente
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stops.map((stop) => {
              const { label, classes } = STATUS_CONFIG[stop.status]
              return (
                <tr key={stop.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-medium">
                    {stop.order}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{stop.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-[200px] truncate">
                    {stop.address}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`${classes} text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap`}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {formatCheckin(stop.checkedInAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell max-w-[240px]">
                    {stop.incident ? (
                      <span className="text-red-600 truncate block">
                        {stop.incident.description}
                      </span>
                    ) : stop.notes ? (
                      <span className="truncate block">{stop.notes}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
