'use client'

import { Suspense, useState } from 'react'
import { Settings, User, Building2, Bell, Palette, Moon, Sun, Monitor } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/*  Settings page — static layout, no API needed for now               */
/* ------------------------------------------------------------------ */

type Tab = 'profile' | 'organization' | 'notifications' | 'appearance'

const TABS: { key: Tab; label: string; icon: typeof User }[] = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'organization',  label: 'Organization',  icon: Building2 },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appearance',    label: 'Appearance',    icon: Palette },
]

function SettingsContent() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-400">Manage your account and preferences</p>
      </div>

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
        <div className="flex-1 max-w-2xl">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'organization' && <OrganizationTab />}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup label="First name">
          <input
            type="text"
            defaultValue=""
            placeholder="Tony"
            className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
          />
        </FieldGroup>
        <FieldGroup label="Last name">
          <input
            type="text"
            defaultValue=""
            placeholder="Yonke"
            className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
          />
        </FieldGroup>
        <FieldGroup label="Email">
          <input
            type="email"
            defaultValue=""
            placeholder="demo@mintlens.dev"
            disabled
            className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-400 outline-none"
          />
        </FieldGroup>
        <div className="pt-2">
          <button className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50">
            Save changes
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrganizationTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldGroup label="Organization name">
          <input
            type="text"
            defaultValue=""
            placeholder="Mintlens Inc."
            className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
          />
        </FieldGroup>
        <FieldGroup label="Plan">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-mint-50 px-2.5 py-0.5 text-xs font-medium text-mint-600">
              Free
            </span>
            <button className="text-xs text-mint-500 hover:underline">
              Upgrade plan
            </button>
          </div>
        </FieldGroup>
        <div className="pt-2">
          <button className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600">
            Save changes
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
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
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
