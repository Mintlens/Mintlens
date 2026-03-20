'use client'

import { useState } from 'react'
import { Users, Plus, Shield, Crown, User, Trash2, X, Check, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { useMe } from '@/hooks/use-me'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Member {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => apiFetch<Member[]>('/v1/team/members'),
  })
}

function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; role?: string }) =>
      apiFetch<Member>('/v1/team/members', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-members'] }),
  })
}

function useChangeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch<{ id: string; role: string }>(`/v1/team/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-members'] }),
  })
}

function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch(`/v1/team/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-members'] }),
  })
}

/* ------------------------------------------------------------------ */
/*  Role helpers                                                       */
/* ------------------------------------------------------------------ */

const ROLE_META: Record<string, { icon: typeof Crown; variant: 'mint' | 'default' | 'outline'; label: string }> = {
  owner:  { icon: Crown,  variant: 'mint',    label: 'Owner' },
  admin:  { icon: Shield, variant: 'default', label: 'Admin' },
  member: { icon: User,   variant: 'outline', label: 'Member' },
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META['member']!
  const Icon = meta.icon
  return (
    <Badge variant={meta.variant} className={cn(
      role === 'admin' && 'bg-blue-50 text-blue-700 border border-blue-200',
    )}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}

function getMemberName(m: Member) {
  if (m.firstName && m.lastName) return `${m.firstName} ${m.lastName}`
  if (m.firstName) return m.firstName
  return m.email.split('@')[0]
}

function getInitials(m: Member) {
  if (m.firstName && m.lastName) return `${m.firstName[0]}${m.lastName[0]}`.toUpperCase()
  if (m.firstName) return m.firstName[0]!.toUpperCase()
  return m.email[0]!.toUpperCase()
}

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

function TeamContent() {
  const { data: me } = useMe()
  const { data: members, isLoading } = useMembers()
  const inviteMember = useInviteMember()
  const changeRole   = useChangeRole()
  const removeMember = useRemoveMember()

  const [showInvite, setShowInvite]   = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'member' | 'admin'>('member')
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [roleEditId, setRoleEditId]   = useState<string | null>(null)

  const myRole = me?.role ?? 'member'
  const myId   = me?.id
  const canInvite    = myRole === 'owner' || myRole === 'admin'
  const canChangeRole = myRole === 'owner'

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    try {
      await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole })
      toast.success('Member invited successfully')
      setInviteEmail('')
      setInviteRole('member')
      setShowInvite(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite member')
    }
  }

  if (isLoading) {
    return <TeamSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        {canInvite && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-mint-600 hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Invite member
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-xs font-medium text-slate-500">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                  className="h-9 rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-mint-300 focus:bg-white"
                >
                  <option value="member">Member</option>
                  {myRole === 'owner' && <option value="admin">Admin</option>}
                </select>
              </div>
              <button
                type="submit"
                disabled={inviteMember.isPending || !inviteEmail.trim()}
                className="h-9 rounded-xl bg-mint-500 px-4 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
              >
                {inviteMember.isPending ? 'Inviting...' : 'Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="h-9 rounded-xl border border-slate-100 px-4 text-sm text-slate-500 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members table */}
      {!members || members.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white">
          <Users className="h-8 w-8 text-slate-200" />
          <p className="text-sm text-slate-400">No team members yet</p>
          <p className="text-xs text-slate-300">Invite your first team member to collaborate</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50 text-left">
                  <th className="py-2.5 pl-5 pr-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                    Member
                  </th>
                  <th className="py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                    Email
                  </th>
                  <th className="py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                    Role
                  </th>
                  <th className="py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                    Joined
                  </th>
                  <th className="py-2.5 pl-3 pr-5 font-medium text-slate-500 text-xs uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((m) => {
                  const isMe = m.id === myId
                  const isOwner = m.role === 'owner'
                  const isDeleting = deletingId === m.id
                  const isRoleEditing = roleEditId === m.id
                  const canRemove = canInvite && !isMe && !isOwner && !(myRole === 'admin' && m.role === 'admin')

                  return (
                    <tr key={m.id} className="group transition-colors hover:bg-slate-50/50">
                      {/* Name + avatar */}
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-500">
                            {getInitials(m)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">
                              {getMemberName(m)}
                              {isMe && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 text-slate-500">{m.email}</td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        {isRoleEditing ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <select
                              defaultValue={m.role}
                              onChange={(e) => {
                                const newRole = e.target.value
                                changeRole.mutate(
                                  { userId: m.id, role: newRole },
                                  {
                                    onSuccess: () => { setRoleEditId(null); toast.success('Role updated') },
                                    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update role'),
                                  },
                                )
                              }}
                              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-mint-300"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                            <button
                              onClick={() => setRoleEditId(null)}
                              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                      </td>

                      {/* Joined */}
                      <td className="py-3 px-3 text-slate-400">{formatDate(m.createdAt)}</td>

                      {/* Actions */}
                      <td className="py-3 pl-3 pr-5 text-right">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-red-600">Remove?</span>
                            <button
                              onClick={() => {
                                removeMember.mutate(m.id, {
                                  onSuccess: () => { setDeletingId(null); toast.success('Member removed') },
                                  onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove member'),
                                })
                              }}
                              disabled={removeMember.isPending}
                              className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                              {removeMember.isPending ? 'Removing...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded-lg border border-slate-100 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-50"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            {canChangeRole && !isMe && !isOwner && (
                              <button
                                onClick={() => setRoleEditId(m.id)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                title="Change role"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canRemove && (
                              <button
                                onClick={() => setDeletingId(m.id)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                title="Remove member"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="h-8 w-8" circle />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export { TeamContent }
