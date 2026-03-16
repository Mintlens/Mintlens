import { cn } from '@/lib/cn'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Makes the skeleton a circle (equal width/height). */
  circle?: boolean
}

/**
 * Pulsing placeholder for loading states.
 * Apply width / height via className (e.g. `h-6 w-32`).
 */
export function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-100',
        circle ? 'rounded-full' : 'rounded-xl',
        className,
      )}
      {...props}
    />
  )
}
