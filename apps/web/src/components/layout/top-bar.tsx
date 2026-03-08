'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useProjects } from '@/hooks/use-projects'
import { useAuthStore } from '@/store/auth.store'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function TopBar() {
  const router         = useRouter()
  const pathname       = usePathname()
  const searchParams   = useSearchParams()
  const { data: projects } = useProjects()

  const selectedProjectId = useAuthStore((s) => s.selectedProjectId)
  const setSelectedProject = useAuthStore((s) => s.setSelectedProject)

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProject(projects[0]!.id)
    }
  }, [projects, selectedProjectId, setSelectedProject])

  const from = searchParams.get('from') ?? defaultFrom()
  const to   = searchParams.get('to')   ?? defaultTo()

  function updateDate(key: 'from' | 'to', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.replace(`${pathname}?${params.toString()}`)
  }

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

      {/* Date range */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => updateDate('from', e.target.value)}
          className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-mint-400 transition-colors"
        />
        <ChevronDown className="h-3 w-3 rotate-[-90deg] text-slate-400" />
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => updateDate('to', e.target.value)}
          className="h-8 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-mint-400 transition-colors"
        />
      </div>
    </header>
  )
}

function defaultFrom() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10)
}
