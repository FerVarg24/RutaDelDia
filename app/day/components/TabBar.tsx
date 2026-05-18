import Link from 'next/link'

interface TabBarProps {
  activeTab: 'list' | 'map'
}

export default function TabBar({ activeTab }: TabBarProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
      <Link
        href="/day"
        className={`flex-1 flex items-center justify-center h-12 text-sm font-medium transition-colors ${
          activeTab === 'list'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500'
        }`}
      >
        Lista
      </Link>

      {/* Mapa: deshabilitado hasta Bloque 4 */}
      <span
        className="flex-1 flex items-center justify-center h-12 text-sm font-medium text-gray-300 cursor-not-allowed"
        aria-disabled="true"
      >
        Mapa
      </span>
    </div>
  )
}
