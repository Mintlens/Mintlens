import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton matching the Cost Explorer page layout.
 */
export function CostExplorerSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header + filters */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Totals strip */}
      <Card className="flex gap-6 px-5 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </Card>

      {/* Chart */}
      <Card className="p-5">
        <Skeleton className="mb-4 h-3.5 w-28" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </Card>

      {/* Breakdown tables */}
      <Card className="p-5">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3.5 w-20" />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
