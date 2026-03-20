import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white',
        className,
      )}
    >
      <Icon className="h-8 w-8 text-slate-200" />
      <p className="text-sm text-slate-400">{title}</p>
      {description && (
        <p className="text-xs text-slate-300">{description}</p>
      )}
      {action}
    </div>
  )
}
