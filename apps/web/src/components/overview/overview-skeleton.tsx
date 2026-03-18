import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function OverviewSkeleton() {
  return (
    <div className="space-y-4 p-5 animate-fade-in">
      <Skeleton className="h-6 w-40 rounded-full" />

      {/* ROW 1: Hero (6, 2rows) + 4 KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:grid-rows-2">
        <Card className="col-span-2 lg:col-span-6 lg:row-span-2 border-l-2 border-l-mint-400 p-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-10 w-36" />
          <Skeleton className="mt-2 h-3 w-28" />
          <Skeleton className="mt-6 h-16 w-full rounded-xl" />
        </Card>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="lg:col-span-3 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        ))}
      </div>

      {/* ROW 2: Chart (8) + Donut (4) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-8 p-5">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-3.5 w-28" />
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-8 rounded-md" />
              ))}
            </div>
          </div>
          <Skeleton className="h-36 w-full rounded-xl" />
        </Card>
        <Card className="lg:col-span-4 p-5">
          <Skeleton className="mb-4 h-3.5 w-24" />
          <div className="flex justify-center">
            <Skeleton className="h-[150px] w-[150px] rounded-full" />
          </div>
          <div className="mt-3 flex justify-center gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-14" />
            ))}
          </div>
        </Card>
      </div>

      {/* ROW 3: Bars (7) + List (5) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-7 p-5">
          <Skeleton className="mb-3 h-3.5 w-28" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-5 p-5">
          <Skeleton className="mb-3 h-3.5 w-20" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
