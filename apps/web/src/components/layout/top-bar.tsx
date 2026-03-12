'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useProjects } from '@/hooks/use-projects'
import { useAuthStore } from '@/store/auth.store'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

function toIso(d: Date) {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toIso(d)
}

function startOfMonth() {
  const d = new Date()
  d.setDate(1)
  return toIso(d)
}

function startOfLastMonth() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1, 1)
  return toIso(d)
}

function endOfLastMonth() {
  const d = new Date()
  d.setDate(0) // last day of previous month
  return toIso(d)
}

const today = () => toIso(new Date())

interface Preset {
  label: string
  from: string
  to: string
}

function usePresets(): Preset[] {
  return useMemo(() => [
    { label: 'Today',      from: today(),           to: today() },
    { label: '7D',         from: daysAgo(7),        to: today() },
    { label: '30D',        from: daysAgo(30),       to: today() },
    { label: 'This month', from: startOfMonth(),    to: today() },
    { label: 'Last month', from: startOfLastMonth(), to: endOfLastMonth() },
    { label: '90D',        from: daysAgo(90),       to: today() },
  ], [])
}

/* ------------------------------------------------------------------ */
/*  TopBar                                                             */
/* ------------------------------------------------------------------ */

export function TopBar() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { data: projects } = useProjects()
  const presets      = usePresets()

  const selectedProjectId  = useAuthStore((s) => s.selectedProjectId)
  const setSelectedProject = useAuthStore((s) => s.setSelectedProject)

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProject(projects[0]!.id)
    }
  }, [projects, selectedProjectId, setSelectedProject])

  const from = searchParams.get('from') ?? daysAgo(30)
  const to   = searchParams.get('to')   ?? today()

  function setRange(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', newFrom)
    params.set('to', newTo)
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Detect which preset is active
  const activePreset = presets.find((p) => p.from === from && p.to === to)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-5">
      {/* Project selector */}
      {projects && projects.length > 0 && (
        <div className="w-48">
          <Select
            value={selectedProjectId ?? ''}
            onValueChange={setSelectedProject}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date presets */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1">
        {presets.map((preset) => {
          const isActive = activePreset?.label === preset.label
          return (
            <button
              key={preset.label}
              onClick={() => setRange(preset.from, preset.to)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

    </header>
  )
}
