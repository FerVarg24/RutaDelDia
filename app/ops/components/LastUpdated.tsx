interface LastUpdatedProps {
  timestamp: Date | null
  hasError: boolean
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function LastUpdated({ timestamp, hasError }: LastUpdatedProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {hasError ? (
        <span className="inline-flex items-center gap-1.5 text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          Sin conexión — mostrando últimos datos
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          Actualizando en vivo
        </span>
      )}
      {timestamp && (
        <span className="text-gray-400 text-xs hidden sm:inline">
          · Última actualización: {formatTime(timestamp)}
        </span>
      )}
    </div>
  )
}
