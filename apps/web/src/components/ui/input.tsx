import * as React from 'react'
import { cn } from '@/lib/cn'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 placeholder:text-slate-400',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-mint-400 focus:ring-offset-0 focus:border-mint-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
