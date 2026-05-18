'use client'

interface IncidentFormProps {
  description: string
  onChange: (description: string) => void
  showError: boolean
}

export default function IncidentForm({ description, onChange, showError }: IncidentFormProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="incident-description" className="text-sm font-medium text-gray-700">
        Descripción del incidente <span className="text-red-500">*</span>
      </label>
      <textarea
        id="incident-description"
        rows={3}
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe qué ocurrió en esta parada..."
        className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors ${
          showError && description.trim() === ''
            ? 'border-red-400 bg-red-50'
            : 'border-gray-200 bg-white'
        }`}
      />
      {showError && description.trim() === '' && (
        <p className="text-xs text-red-600">La descripción es obligatoria para reportar un incidente.</p>
      )}
    </div>
  )
}
