interface Summary {
  total: number
  pending: number
  completed: number
  incident: number
  skipped: number
}

interface SummaryCardsProps {
  summary: Summary
}

const cards = [
  {
    key: 'pending' as const,
    label: 'Pendientes',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    number: 'text-gray-900',
  },
  {
    key: 'completed' as const,
    label: 'Completadas',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    number: 'text-green-800',
  },
  {
    key: 'incident' as const,
    label: 'Incidentes',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    number: 'text-red-800',
  },
  {
    key: 'skipped' as const,
    label: 'Omitidas',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    number: 'text-yellow-800',
  },
]

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ key, label, bg, border, text, number }) => (
        <div
          key={key}
          className={`${bg} border ${border} rounded-xl px-4 py-4 flex flex-col gap-1`}
        >
          <span className={`text-xs font-medium uppercase tracking-wide ${text}`}>
            {label}
          </span>
          <span className={`text-3xl font-bold ${number}`}>{summary[key]}</span>
          <span className={`text-xs ${text} opacity-70`}>
            de {summary.total} paradas
          </span>
        </div>
      ))}
    </div>
  )
}
