'use client'

import { Suspense, useState, useEffect } from 'react'
import { Settings, User, Building2, Bell, Palette, Users, CreditCard, Moon, Sun, Monitor } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/hooks/use-user'
import { apiFetch } from '@/lib/api-client'
import { cn } from '@/lib/cn'
import { toast } from 'sonner'
import { TeamContent } from '@/components/team/team-content'
import { SubscriptionTab } from '@/components/billing/subscription-tab'
import { PlanBadge } from '@/components/billing/plan-badge'

/* ------------------------------------------------------------------ */
/*  Settings page — static layout, no API needed for now               */
/* ------------------------------------------------------------------ */

type Tab = 'profile' | 'organization' | 'subscription' | 'team' | 'notifications' | 'appearance'

const TABS: { key: Tab; label: string; icon: typeof User }[] = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'organization',  label: 'Organization',  icon: Building2 },
  { key: 'subscription',  label: 'Subscription',  icon: CreditCard },
  { key: 'team',          label: 'Team',           icon: Users },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance',    label: 'Appearance',    icon: Palette },
]

function SettingsContent() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialTab = (searchParams?.get('tab') as Tab) ?? 'profile'
  const [tab, setTab] = useState<Tab>(
    ['profile', 'organization', 'subscription', 'team', 'notifications', 'appearance'].includes(initialTab)
      ? initialTab
      : 'profile'
  )

  return (
    <div className="p-6">
      <div className="mb-2" />

      <div className="flex gap-6">
        {/* Left nav */}
        <nav className="w-48 shrink-0 space-y-1">
          {TABS.map((t) => {
            const active = tab === t.key
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-mint-50 text-mint-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-mint-500' : 'text-slate-400')} />
                {t.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className={cn('flex-1', tab === 'team' ? 'max-w-4xl' : 'max-w-2xl')}>
          {tab === 'profile' && <ProfileTab />}
          {tab === 'organization' && <OrganizationTab />}
          {tab === 'subscription' && <SubscriptionTab />}
          {tab === 'team' && <TeamContent />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'appearance' && <AppearanceTab />}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab contents                                                       */
/* ------------------------------------------------------------------ */

function ProfileTab() {
  const { data, isLoading } = useMe()
  const qc = useQueryClient()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  useEffect(() => {
    if (data) {
      setFirstName(data.firstName ?? '')
      setLastName(data.lastName ?? '')
    }
  }, [data])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (body: { firstName: string; lastName: string }) =>
      apiFetch('/v1/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); toast.success('Profile updated') },
    onError: () => toast.error('Failed to update profile'),
  })

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />

  const inputClass = 'h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup label="First name">
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </FieldGroup>
        <FieldGroup label="Last name">
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </FieldGroup>
        <FieldGroup label="Email">
          <input type="email" value={data?.email ?? ''} disabled className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-400 outline-none" />
        </FieldGroup>
        <div className="pt-2">
          <button
            onClick={() => save({ firstName, lastName })}
            disabled={isPending}
            className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrganizationTab() {
  const { data, isLoading } = useMe()
  const qc = useQueryClient()
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    if (data) setOrgName(data.organisationName ?? '')
  }, [data])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (body: { name: string }) =>
      apiFetch('/v1/auth/org', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); toast.success('Organisation updated') },
    onError: () => toast.error('Failed to update organisation'),
  })

  if (isLoading) return <Skeleton className="h-48 rounded-2xl" />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup label="Organization name">
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
          />
        </FieldGroup>
        <FieldGroup label="Plan">
          <div className="flex items-center gap-3">
            <PlanBadge plan="free" />
            <span className="text-xs text-slate-400">Manage in the Subscription tab</span>
          </div>
        </FieldGroup>
        <div className="pt-2">
          <button
            onClick={() => save({ name: orgName })}
            disabled={isPending || orgName.trim().length < 2}
            className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationsTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Notifications</CardTitle>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">Coming soon</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 opacity-60 pointer-events-none">
        <ToggleRow
          label="Budget alerts"
          description="Get notified when budget thresholds are reached"
          defaultChecked
        />
        <ToggleRow
          label="Weekly digest"
          description="Receive a weekly summary of your LLM spend"
          defaultChecked={false}
        />
        <ToggleRow
          label="Anomaly detection"
          description="Alert on unusual spending patterns"
          defaultChecked
        />
      </CardContent>
    </Card>
  )
}

function AppearanceTab() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Appearance</CardTitle>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">Coming soon</span>
        </div>
      </CardHeader>
      <CardContent className="opacity-60 pointer-events-none">
        <p className="mb-4 text-sm text-slate-500">Choose your preferred theme</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'light'  as const, label: 'Light',  icon: Sun },
            { key: 'dark'   as const, label: 'Dark',   icon: Moon },
            { key: 'system' as const, label: 'System', icon: Monitor },
          ].map((t) => {
            const Icon = t.icon
            const active = theme === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                  active
                    ? 'border-mint-400 bg-mint-50 text-mint-600'
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  description,
  defaultChecked = false,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  const [on, setOn] = useState(defaultChecked)

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          on ? 'bg-mint-500' : 'bg-slate-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            on && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
