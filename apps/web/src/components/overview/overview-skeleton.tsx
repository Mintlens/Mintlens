import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full-page skeleton matching the Overview layout.
 * Displayed while summary + cost-explorer data are loading.
 */
export function OverviewSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3.5 w-44" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>

      {/* 60/40 layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Chart skeleton (60%) */}
        <Card className="lg:col-span-3 p-5">
          <Skeleton className="mb-4 h-3.5 w-28" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </Card>

        {/* Side panels skeleton (40%) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Cost by model */}
          <Card className="p-5">
            <Skeleton className="mb-3 h-3.5 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-1.5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </Card>

          {/* Top consumers */}
          <Card className="p-5">
            <Skeleton className="mb-3 h-3.5 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </Card>

          {/* Alerts */}
          <Card className="p-5">
            <Skeleton className="mb-3 h-3.5 w-16" />
            <Skeleton className="h-3 w-36" />
          </Card>
        </div>
      </div>
    </div>
  )
}
