'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { useMe } from '@/hooks/use-me'
import { NotificationsPopover } from '@/components/layout/notifications-popover'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getInitials(firstName?: string | null, lastName?: string | null, email?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (firstName) return firstName[0]!.toUpperCase()
  if (email) return email[0]!.toUpperCase()
  return '?'
}

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/overview':      { title: 'Overview',         description: 'Key metrics and trends at a glance' },
  '/cost-explorer': { title: 'Cost Explorer',    description: 'Break down spend by model, feature, and tenant' },
  '/requests':      { title: 'Requests',         description: 'Browse and inspect individual API calls' },
  '/tenants':       { title: 'Tenants',          description: 'Monitor usage and costs per tenant' },
  '/features':      { title: 'Features',         description: 'Track cost breakdown by feature' },
  '/budgets':       { title: 'Budgets & Alerts', description: 'Set spend limits and alert thresholds' },
  '/projects':      { title: 'Projects',         description: 'Organize and manage your tracked projects' },
  '/api-keys':      { title: 'API Keys',         description: 'Create and manage SDK access keys' },
  '/settings':      { title: 'Settings',         description: 'Manage your account and preferences' },
}

/* ------------------------------------------------------------------ */
/*  TopBar — flat, directly on the canvas                              */
/* ------------------------------------------------------------------ */

export function TopBar() {
  const { data: me } = useMe()
  const pathname = usePathname()

  const initials = getInitials(me?.firstName, me?.lastName, me?.email)
  const meta     = PAGE_META[pathname] ?? { title: 'Dashboard', description: '' }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/40 px-6">
      {/* Left — Page title + description */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{meta.title}</h1>
        {meta.description && (
          <p className="text-[12px] leading-tight text-slate-400">{meta.description}</p>
        )}
      </div>

      {/* Right — Notifications + Settings + Profile */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <NotificationsPopover />

        {/* Settings */}
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-black/[0.04] hover:text-slate-600"
          title="Settings"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>

        {/* Divider */}
        <div className="mx-1.5 h-7 w-px bg-slate-200/50" />

        {/* Profile */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-200 hover:bg-black/[0.04]"
          title="Account settings"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-mint-300 to-mint-500 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          {me && (
            <div className="hidden sm:block">
              <p className="text-[13px] font-semibold leading-tight text-slate-700">
                {me.firstName ?? me.email?.split('@')[0]}
              </p>
              <p className="text-[10px] leading-tight text-slate-400">{me.role}</p>
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
