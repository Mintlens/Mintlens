import { cn } from '@/lib/cn'

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-mint-50 text-mint-600',
  enterprise: 'bg-purple-50 text-purple-600',
}

export function PlanBadge({ plan, className }: { plan: string; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
      PLAN_STYLES[plan] ?? PLAN_STYLES.free,
      className,
    )}>
      {plan}
    </span>
  )
}
