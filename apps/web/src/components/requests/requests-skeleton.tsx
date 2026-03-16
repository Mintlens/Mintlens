import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function RequestsSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3.5 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table skeleton */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-6 border-b border-slate-50 bg-slate-50/50 px-5 py-2.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-14" />
            ))}
          </div>

          {/* Body rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-slate-50 px-5 py-2.5"
            >
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))}

          {/* Pagination skeleton */}
          <div className="flex items-center justify-between px-5 py-3">
            <Skeleton className="h-3 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
