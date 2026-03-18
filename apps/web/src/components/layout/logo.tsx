import { cn } from '@/lib/cn'

interface LogoProps {
  className?: string
  showWordmark?: boolean
  /** "dark" (default) for light backgrounds, "light" for dark backgrounds */
  variant?: 'dark' | 'light'
}

export default function MintlensLogo({ className, showWordmark = false, variant = 'dark' }: LogoProps) {
  const isLight = variant === 'light'
  const strokeColor = isLight ? '#ffffff' : '#4ecba6'

  return (
    <div className={cn('flex items-center gap-2', showWordmark && 'gap-2.5')}>
      {/* Geometric hexagon mark */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0', className ?? 'h-7 w-7')}
        aria-hidden="true"
      >
        <path
          d="M20 2L35.5885 11V29L20 38L4.41154 29V11L20 2Z"
          stroke={strokeColor}
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M20 8L28.6603 13V23L20 28L11.3397 23V13L20 8Z"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill="none"
          opacity="0.6"
        />
        <path d="M20 2L20 38" stroke={strokeColor} strokeWidth="0.8" opacity="0.3" />
        <path d="M4.41154 11L35.5885 29" stroke={strokeColor} strokeWidth="0.8" opacity="0.3" />
        <path d="M35.5885 11L4.41154 29" stroke={strokeColor} strokeWidth="0.8" opacity="0.3" />
      </svg>

      {showWordmark && (
        <span className="text-base font-semibold tracking-tight">
          <span className={isLight ? 'text-white' : 'text-mint-500'}>Mint</span>
          <span className={isLight ? 'text-white/70' : 'text-slate-800'}>lens</span>
        </span>
      )}
    </div>
  )
}
