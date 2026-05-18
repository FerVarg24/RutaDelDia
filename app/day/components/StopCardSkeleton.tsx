export default function StopCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 min-h-[72px] flex items-center gap-4">
      {/* Círculo de orden */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-gray-200 animate-pulse" />

      {/* Contenido */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-200 animate-pulse rounded w-3/5" />
        <div className="h-3 bg-gray-200 animate-pulse rounded w-4/5" />
      </div>

      {/* Badge placeholder */}
      <div className="shrink-0 h-6 w-20 bg-gray-200 animate-pulse rounded-full" />
    </div>
  )
}
