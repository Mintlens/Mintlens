'use client'

import { Suspense, useState } from 'react'
import { Key, Plus, Copy, Check, AlertTriangle, Trash2 } from 'lucide-react'
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

interface ApiKeyRow {
  id: string
  projectId: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  isRevoked: boolean
}

interface CreatedKeyResponse {
  keyId: string
  keyPrefix: string
  rawKey: string
  warning: string
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useApiKeys(projectId: string | null) {
  return useQuery({
    queryKey: ['api-keys', projectId],
    queryFn: () => apiFetch<ApiKeyRow[]>(`/v1/auth/api-keys?projectId=${projectId}`),
    enabled: !!projectId,
  })
}

function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { projectId: string; name: string; scopes?: string[] }) =>
      apiFetch<CreatedKeyResponse>('/v1/auth/api-keys', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

function useRevokeApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keyId: string) =>
      apiFetch(`/v1/auth/api-keys/${keyId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

function ApiKeysContent() {
  const projectId = useAuthStore((s) => s.selectedProjectId)
  const { data: keys, isLoading } = useApiKeys(projectId)
  const createKey = useCreateApiKey()
  const revokeKey = useRevokeApiKey()

  const [showCreate, setShowCreate]   = useState(false)
  const [newName, setNewName]         = useState('')
  const [createdKey, setCreatedKey]   = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)

  if (!projectId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Select a project above to manage API keys
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !projectId) return
    const result = await createKey.mutateAsync({ projectId, name: newName.trim() })
    setCreatedKey(result.rawKey)
    setNewName('')
    setShowCreate(false)
  }

  function copyKey() {
    if (!createdKey) return
    navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleRevoke(keyId: string) {
    if (confirm('Revoke this API key? This cannot be undone.')) {
      revokeKey.mutate(keyId)
    }
  }

  const activeKeys  = (keys ?? []).filter((k) => !k.isRevoked)
  const revokedKeys = (keys ?? []).filter((k) => k.isRevoked)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">API Keys</h2>
          <p className="text-sm text-slate-400">
            {activeKeys.length} active key{activeKeys.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setCreatedKey(null) }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-mint-600 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New key
        </button>
      </div>

      {/* Just-created key banner */}
      {createdKey && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  Save your API key — it won't be shown again
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-white px-3 py-1.5 text-xs font-mono text-slate-700 border border-amber-200">
                    {createdKey}
                  </code>
                  <button
                    onClick={copyKey}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 border border-amber-200 transition-colors hover:bg-amber-100"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-xs font-medium text-slate-500">Key name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Production SDK"
                  className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={createKey.isPending || !newName.trim()}
                className="h-9 rounded-xl bg-mint-500 px-4 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
              >
                {createKey.isPending ? 'Generating…' : 'Generate'}
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

      {/* Active keys */}
      {activeKeys.length === 0 && !showCreate ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white">
          <Key className="h-8 w-8 text-slate-200" />
          <p className="text-sm text-slate-400">No API keys yet</p>
          <p className="text-xs text-slate-300">Generate a key to start sending LLM events</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeKeys.map((k) => (
            <Card key={k.id} className="transition-all hover:shadow-card-hover">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint-50">
                  <Key className="h-4 w-4 text-mint-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{k.name}</p>
                  <p className="text-xs text-slate-400">
                    <code className="font-mono">{k.keyPrefix}…</code>
                    {' · '}
                    Created {formatDate(k.createdAt)}
                    {k.lastUsedAt && <> · Last used {formatDate(k.lastUsedAt)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {k.scopes.map((s) => (
                    <span key={s} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                      {s}
                    </span>
                  ))}
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="ml-2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Revoked ({revokedKeys.length})
          </p>
          <div className="space-y-2 opacity-60">
            {revokedKeys.map((k) => (
              <Card key={k.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-500 line-through">{k.name}</p>
                    <p className="text-xs text-slate-400">
                      <code className="font-mono">{k.keyPrefix}…</code>
                      {' · '}Revoked
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export default function ApiKeysPage() {
  return (
    <Suspense>
      <ApiKeysContent />
    </Suspense>
  )
}
