import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/*  Color palette — deterministic per project name                     */
/* ------------------------------------------------------------------ */

const PALETTE = [
  { bg: '#4ecba6', light: '#d1f5ea' },  // mint
  { bg: '#6366f1', light: '#e0e0ff' },  // indigo
  { bg: '#f59e0b', light: '#fef3c7' },  // amber
  { bg: '#ec4899', light: '#fce7f3' },  // rose
  { bg: '#8b5cf6', light: '#ede9fe' },  // violet
  { bg: '#14b8a6', light: '#ccfbf1' },  // teal
  { bg: '#f97316', light: '#ffedd5' },  // orange
  { bg: '#0ea5e9', light: '#e0f2fe' },  // sky
] as const

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/** Returns the deterministic color for a project name */
export function getProjectColor(name: string) {
  return PALETTE[hashName(name) % PALETTE.length]!
}

/* ------------------------------------------------------------------ */
/*  Size configs                                                       */
/* ------------------------------------------------------------------ */

const SIZES = {
  sm: { w: 36, h: 32, tab: { w: 14, h: 6 }, r: 6, text: 'text-[10px]' },
  md: { w: 44, h: 40, tab: { w: 17, h: 7 }, r: 7, text: 'text-[11px]' },
  lg: { w: 56, h: 48, tab: { w: 20, h: 8 }, r: 8, text: 'text-xs' },
  xl: { w: 72, h: 60, tab: { w: 26, h: 10 }, r: 10, text: 'text-base' },
} as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface ProjectAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ProjectAvatar({ name, size = 'md', className }: ProjectAvatarProps) {
  const color = getProjectColor(name)
  const initials = getInitials(name)
  const s = SIZES[size]

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: s.w, height: s.h + s.tab.h - 1, paddingTop: s.tab.h - 1 }}
    >
      {/* Folder tab */}
      <div
        className="absolute left-0 top-0"
        style={{
          width: s.tab.w,
          height: s.tab.h,
          backgroundColor: color.bg,
          borderRadius: `${s.r}px ${s.r}px 0 0`,
          opacity: 0.85,
        }}
      />

      {/* Folder body */}
      <div
        className={cn('flex items-center justify-center font-bold text-white', s.text)}
        style={{
          width: s.w,
          height: s.h,
          backgroundColor: color.bg,
          borderRadius: `3px ${s.r}px ${s.r}px ${s.r}px`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        }}
      >
        {initials}
      </div>
    </div>
  )
}
