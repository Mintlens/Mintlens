import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton matching the Tenants page layout.
 */
export function TenantsSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3.5 w-44" />
        </div>
        <Skeleton className="h-9 w-56 rounded-xl" />
      </div>

      {/* Summary strip */}
      <div className="flex gap-6 rounded-2xl border border-slate-100 bg-white px-5 py-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center border-b border-slate-50 bg-slate-50/50 px-5 py-2.5">
            <Skeleton className="h-3 w-16" />
            <div className="ml-auto flex gap-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-14" />
              ))}
            </div>
          </div>

          {/* Body rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center border-b border-slate-50 px-5 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-8">
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-3.5 w-12" />
                <Skeleton className="h-3.5 w-12" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
