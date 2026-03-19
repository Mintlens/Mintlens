'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  from: string        // 'YYYY-MM-DD'
  to: string          // 'YYYY-MM-DD'
  onFromChange: (v: string) => void
  onToChange:   (v: string) => void
  className?: string
}

type SelectionState = 'idle' | 'selecting-end'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December']
const DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su']

function parseDate(s: string): Date | null {
  if (!s) return null
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function fmtDisplay(s: string): string {
  const d = parseDate(s)
  if (!d) return s
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  // Monday-based: 0 = Mon, 6 = Sun
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Last 7 days',  days: 7   },
  { label: 'Last 30 days', days: 30  },
  { label: 'Last 90 days', days: 90  },
  { label: 'This month',   days: -1  }, // special
]

function getPresetRange(days: number): { from: string; to: string } {
  const to = new Date()
  if (days === -1) {
    const from = new Date(to.getFullYear(), to.getMonth(), 1)
    return { from: fmt(from), to: fmt(to) }
  }
  const from = new Date(to)
  from.setDate(from.getDate() - days + 1)
  return { from: fmt(from), to: fmt(to) }
}

// ─── Calendar Month ───────────────────────────────────────────────────────────

function CalendarMonth({
  year, month, from, to, hovered,
  onDayClick, onDayHover,
}: {
  year: number
  month: number
  from: Date | null
  to: Date | null
  hovered: Date | null
  onDayClick: (d: Date) => void
  onDayHover: (d: Date | null) => void
}) {
  const daysInMonth  = getDaysInMonth(year, month)
  const firstOffset  = getFirstDayOfWeek(year, month)
  const today        = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: (Date | null)[] = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  // Effective range end for hover preview
  const rangeEnd = hovered ?? to

  return (
    <div className="w-full">
      {/* Month/year label */}
      <p className="mb-3 text-center text-[13px] font-semibold text-ink">
        {MONTHS[month]} {year}
      </p>

      {/* Day-of-week headers */}
      <div className="mb-1.5 grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />

          const isToday   = isSameDay(day, today)
          const isFrom    = from    && isSameDay(day, from)
          const isTo      = to      && isSameDay(day, to)
          const isHovered = hovered && isSameDay(day, hovered)

          const inRange = from && rangeEnd && day > from && day < rangeEnd

          const isEdge    = isFrom || isTo || isHovered
          const isRangeStart = isFrom
          const isRangeEnd   = (hovered ? isHovered : isTo)

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onDayClick(day)}
              onMouseEnter={() => onDayHover(day)}
              onMouseLeave={() => onDayHover(null)}
              className={cn(
                'relative h-8 w-full text-[12.5px] font-medium transition-all duration-100',
                // Base text
                !isEdge && 'text-ink',
                // In-range background (between from/to)
                inRange && 'bg-mint-50 text-mint-700',
                // Edge (selected) days
                isEdge && 'z-10 text-white',
                // Range start
                isRangeStart && inRange && 'rounded-l-full bg-mint-400',
                isRangeStart && !inRange && 'rounded-full bg-mint-400',
                // Range end
                isRangeEnd && from && inRange && 'rounded-r-full bg-mint-400',
                isRangeEnd && !from && 'rounded-full bg-mint-400',
                isRangeEnd && from && !inRange && !isFrom && 'rounded-full bg-mint-400',
                // Single selected (from == to or no range yet)
                isFrom && isTo && 'rounded-full bg-mint-400',
                // Today indicator (non-selected)
                isToday && !isEdge && 'font-bold text-mint-600',
                // Hover for unselected days
                !isEdge && !inRange && 'rounded-full hover:bg-surface-sunken',
              )}
            >
              {day.getDate()}
              {/* Today dot */}
              {isToday && !isEdge && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-mint-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DateRangePicker({ from, to, onFromChange, onToChange, className }: DateRangePickerProps) {
  const [open, setOpen]             = useState(false)
  const [state, setState]           = useState<SelectionState>('idle')
  const [hovered, setHovered]       = useState<Date | null>(null)
  const [tempFrom, setTempFrom]     = useState<Date | null>(null)

  // Calendars: show 2 consecutive months
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() === 0 ? 11 : today.getMonth() - 1)

  const containerRef = useRef<HTMLDivElement>(null)

  const fromDate = parseDate(from)
  const toDate   = parseDate(to)

  // Effective display while mid-selection
  const displayFrom = state === 'selecting-end' ? tempFrom : fromDate
  const displayTo   = state === 'selecting-end' ? null     : toDate

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setState('idle')
        setTempFrom(null)
        setHovered(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Navigate months
  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0 }
      return m + 1
    })
  }, [])

  // Second calendar month
  const rightMonth = viewMonth === 11 ? 0  : viewMonth + 1
  const rightYear  = viewMonth === 11 ? viewYear + 1 : viewYear

  function handleDayClick(day: Date) {
    if (state === 'idle') {
      // First click → set "from", wait for second click
      setTempFrom(day)
      setState('selecting-end')
      setHovered(null)
    } else {
      // Second click → finalize range
      const start = tempFrom!
      let end     = day
      if (end < start) {
        // swap
        onFromChange(fmt(end))
        onToChange(fmt(start))
      } else {
        onFromChange(fmt(start))
        onToChange(fmt(end))
      }
      setState('idle')
      setTempFrom(null)
      setHovered(null)
      setOpen(false)
    }
  }

  function applyPreset(days: number) {
    const { from: f, to: t } = getPresetRange(days)
    onFromChange(f)
    onToChange(t)
    setState('idle')
    setTempFrom(null)
    setOpen(false)
  }

  // Hover only active during second-click selection
  function handleHover(d: Date | null) {
    if (state === 'selecting-end') setHovered(d)
  }

  const triggerLabel = (state === 'selecting-end' && tempFrom)
    ? `${fmtDisplay(fmt(tempFrom))} → …`
    : (from && to)
      ? `${fmtDisplay(from)} – ${fmtDisplay(to)}`
      : 'Select range'

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'group flex h-9 items-center gap-2.5 rounded-xl border bg-white px-3.5',
          'text-[13px] font-medium text-ink',
          'transition-all duration-175',
          open
            ? 'border-mint-400 ring-2 ring-mint-400/20'
            : 'border-ink-ghost/70 hover:border-ink-faint',
        )}
      >
        <CalendarDays className={cn(
          'h-3.5 w-3.5 transition-colors',
          open ? 'text-mint-500' : 'text-ink-faint group-hover:text-ink-muted',
        )} />
        <span>{triggerLabel}</span>
        {/* Subtle separator + chevron */}
        <span className="ml-0.5 text-ink-ghost">|</span>
        <svg width="10" height="6" viewBox="0 0 10 6" className={cn(
          'text-ink-faint transition-transform duration-175',
          open && 'rotate-180',
        )}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-2',
            'flex rounded-2xl bg-white',
            'shadow-[0_8px_40px_-4px_rgb(0_0_0/0.12),0_2px_8px_-2px_rgb(0_0_0/0.06)]',
            'ring-1 ring-ink-ghost/30',
            'animate-[scale-in_150ms_ease-out]',
            'origin-top-right',
          )}
          style={{ minWidth: 580 }}
        >
          {/* Presets sidebar */}
          <div className="flex w-36 flex-col gap-0.5 border-r border-ink-ghost/30 p-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
              Quick select
            </p>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.days)}
                className={cn(
                  'rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-ink-muted',
                  'transition-colors duration-100 hover:bg-mint-50 hover:text-mint-700',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendars */}
          <div className="flex flex-col p-4">
            {/* Header nav */}
            <div className="mb-4 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Two-month grid */}
            <div className="grid grid-cols-2 gap-6">
              <CalendarMonth
                year={viewYear}  month={viewMonth}
                from={displayFrom} to={displayTo}
                hovered={state === 'selecting-end' ? hovered : null}
                onDayClick={handleDayClick}
                onDayHover={handleHover}
              />
              <CalendarMonth
                year={rightYear} month={rightMonth}
                from={displayFrom} to={displayTo}
                hovered={state === 'selecting-end' ? hovered : null}
                onDayClick={handleDayClick}
                onDayHover={handleHover}
              />
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-ink-ghost/30 pt-3">
              <div className="flex items-center gap-1.5 text-[12px] text-ink-faint">
                {state === 'selecting-end' ? (
                  <span className="text-mint-600 font-medium">Click to set end date</span>
                ) : (from && to) ? (
                  <>
                    <span className="font-medium text-ink">{fmtDisplay(from)}</span>
                    <span className="text-ink-ghost">→</span>
                    <span className="font-medium text-ink">{fmtDisplay(to)}</span>
                  </>
                ) : (
                  <span>Click a start date</span>
                )}
              </div>
              {state === 'idle' && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); setState('idle') }}
                  className="rounded-lg bg-mint-400 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-all hover:bg-mint-500 active:scale-[0.97]"
                >
                  Done
                </button>
              )}
              {state === 'selecting-end' && (
                <button
                  type="button"
                  onClick={() => { setState('idle'); setTempFrom(null); setHovered(null) }}
                  className="rounded-lg px-3.5 py-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:bg-surface-sunken"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
