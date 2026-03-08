import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:   'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
        primary:   'bg-mint-400 text-white hover:bg-mint-500 active:bg-mint-600',
        outline:   'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
        ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        danger:    'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
        link:      'text-mint-500 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm:      'h-7 px-3 text-xs',
        default: 'h-9 px-4',
        lg:      'h-10 px-5 text-base',
        icon:    'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
