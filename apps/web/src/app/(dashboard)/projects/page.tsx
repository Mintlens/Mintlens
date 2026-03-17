'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Plus, Globe, Code, FlaskConical, Calendar, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Project {
  id: string
  name: string
  slug: string
  environment: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/v1/projects'),
  })
}

function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; environment?: string }) =>
      apiFetch<Project>('/v1/projects', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const ENV_META: Record<string, { icon: typeof Globe; color: string; label: string }> = {
  production:  { icon: Globe,       color: 'text-emerald-500 bg-emerald-50', label: 'Production' },
  staging:     { icon: FlaskConical, color: 'text-amber-500 bg-amber-50',    label: 'Staging' },
  development: { icon: Code,        color: 'text-blue-500 bg-blue-50',       label: 'Development' },
}

function ProjectsContent() {
  const { data: projects, isLoading } = useProjects()
  const createProject = useCreateProject()
  const selectProject = useAuthStore((s) => s.selectProject)
  const selectedId    = useAuthStore((s) => s.selectedProjectId)
  const router        = useRouter()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newEnv, setNewEnv]         = useState<'production' | 'staging' | 'development'>('production')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await createProject.mutateAsync({ name: newName.trim(), environment: newEnv })
    setNewName('')
    setShowCreate(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Projects</h2>
          <p className="text-sm text-slate-400">
            {projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-mint-600 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-xs font-medium text-slate-500">Project name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My SaaS App"
                  className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Environment</label>
                <select
                  value={newEnv}
                  onChange={(e) => setNewEnv(e.target.value as typeof newEnv)}
                  className="h-9 rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-mint-300 focus:bg-white"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createProject.isPending || !newName.trim()}
                className="h-9 rounded-xl bg-mint-500 px-4 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
              >
                {createProject.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-9 rounded-xl border border-slate-100 px-4 text-sm text-slate-500 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Project grid */}
      {!projects || projects.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white">
          <FolderOpen className="h-8 w-8 text-slate-200" />
          <p className="text-sm text-slate-400">No projects yet</p>
          <p className="text-xs text-slate-300">Create your first project to start tracking costs</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const env = ENV_META[p.environment] ?? ENV_META.production
            const EnvIcon = env.icon
            const isSelected = p.id === selectedId

            return (
              <Card
                key={p.id}
                className={cn(
                  'group cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:scale-[1.01]',
                  isSelected && 'ring-2 ring-mint-400 ring-offset-2',
                )}
                onClick={() => {
                  selectProject(p.id)
                  router.push('/overview')
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{p.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{p.slug}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', env.color)}>
                      <EnvIcon className="h-3 w-3" />
                      {env.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    Created {formatDate(p.createdAt)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsContent />
    </Suspense>
  )
}
