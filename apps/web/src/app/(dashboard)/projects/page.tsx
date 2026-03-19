'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Plus, Globe, Code, FlaskConical, Calendar, ChevronRight, Pencil, Trash2, X, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent } from '@/components/ui/card'
import { ProjectAvatar } from '@/components/ui/project-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { toast } from 'sonner'

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

function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; environment?: string }) =>
      apiFetch<Project>(`/v1/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/projects/${id}`, { method: 'DELETE' }),
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
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const selectProject = useAuthStore((s) => s.setSelectedProject)
  const selectedId    = useAuthStore((s) => s.selectedProjectId)
  const router        = useRouter()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newEnv, setNewEnv]         = useState<'production' | 'staging' | 'development'>('production')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? 's' : ''}
        </p>
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

      {/* Project grid — folder icons */}
      {!projects || projects.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white">
          <FolderOpen className="h-8 w-8 text-slate-200" />
          <p className="text-sm text-slate-400">No projects yet</p>
          <p className="text-xs text-slate-300">Create your first project to start tracking costs</p>
        </div>
      ) : (
        <div className="grid gap-x-4 gap-y-10 pt-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {projects.map((p) => {
            const env = ENV_META[p.environment] ?? ENV_META['production']!
            const EnvIcon = env.icon
            const isSelected = p.id === selectedId
            const isEditing = editingId === p.id
            const isDeleting = deletingId === p.id

            return (
              <div
                key={p.id}
                className={cn(
                  'folder-card group relative p-5 text-left',
                  isSelected && 'ring-2 ring-mint-400 ring-offset-2',
                )}
              >
                {/* Action buttons */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name) }}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    title="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(p.id) }}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Inline rename */}
                {isEditing ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-mint-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingId(null)
                        if (e.key === 'Enter' && editName.trim()) {
                          updateProject.mutate({ id: p.id, name: editName.trim() }, {
                            onSuccess: () => { setEditingId(null); toast.success('Project renamed') },
                            onError: () => toast.error('Failed to rename project'),
                          })
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          if (!editName.trim()) return
                          updateProject.mutate({ id: p.id, name: editName.trim() }, {
                            onSuccess: () => { setEditingId(null); toast.success('Project renamed') },
                            onError: () => toast.error('Failed to rename project'),
                          })
                        }}
                        className="rounded-lg bg-mint-500 p-1.5 text-white transition-colors hover:bg-mint-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-100 p-1.5 text-slate-400 transition-colors hover:bg-slate-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : isDeleting ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs text-red-600">Delete "{p.name}"?</p>
                    <p className="text-xs text-slate-400">This cannot be undone.</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          deleteProject.mutate(p.id, {
                            onSuccess: () => { setDeletingId(null); toast.success('Project deleted') },
                            onError: () => toast.error('Failed to delete project'),
                          })
                        }}
                        disabled={deleteProject.isPending}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleteProject.isPending ? 'Deleting…' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="rounded-lg border border-slate-100 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      selectProject(p.id)
                      router.push('/overview')
                    }}
                  >
                    {/* Top row: name + chevron */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                          {p.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-slate-400">{p.slug}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                    </div>

                    {/* Bottom row: env badge + date */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', env.color)}>
                        <EnvIcon className="h-3 w-3" />
                        {env.label}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(p.createdAt)}
                      </span>
                    </div>
                  </button>
                )}
              </div>
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
