'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  List,
  Users,
  Shield,
  FolderOpen,
  Key,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import MintlensLogo from './logo'
import { apiFetch } from '@/lib/api-client'
import { invalidateCsrfToken } from '@/hooks/use-csrf'
import { useAuthStore } from '@/store/auth.store'
import { useSidebarStore } from '@/store/sidebar.store'

import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Analytics',
    items: [
      { href: '/overview',      label: 'Overview',         icon: LayoutDashboard },
      { href: '/cost-explorer', label: 'Cost Explorer',    icon: TrendingUp },
      { href: '/requests',      label: 'Requests',         icon: List },
    ],
  },
  {
    title: 'Management',
    items: [
      { href: '/tenants',       label: 'Tenants',          icon: Users },
      { href: '/budgets',       label: 'Budgets & Alerts', icon: Shield },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { href: '/projects',      label: 'Projects',         icon: FolderOpen },
      { href: '/api-keys',      label: 'API Keys',         icon: Key },
      { href: '/settings',      label: 'Settings',         icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname     = usePathname()
  const router       = useRouter()
  const clearProject = useAuthStore((s) => s.clearProject)
  const collapsed    = useSidebarStore((s) => s.collapsed)
  const toggle       = useSidebarStore((s) => s.toggle)

  async function logout() {
    try {
      await apiFetch('/v1/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    invalidateCsrfToken()
    clearProject()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex h-screen shrink-0 flex-col border-r border-slate-100 bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center justify-between px-3">
        <div className={cn('flex items-center', collapsed ? 'mx-auto' : 'pl-2')}>
          <MintlensLogo showWordmark={!collapsed} className="h-6 w-6" />
        </div>
        {!collapsed && (
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button (visible when collapsed) */}
      {collapsed && (
        <div className="flex justify-center pb-2">
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}

            {/* Thin separator in collapsed mode */}
            {collapsed && (
              <div className="mx-auto mb-2 h-px w-6 bg-slate-100" />
            )}

            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')

                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'group relative flex items-center rounded-md text-sm font-medium transition-colors duration-150',
                      collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2',
                      active
                        ? 'bg-mint-50 text-mint-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    {/* Active indicator — vertical bar */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-mint-400" />
                    )}

                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-mint-500' : 'text-slate-400 group-hover:text-slate-600',
                      )}
                    />
                    {!collapsed && label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2">
        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex w-full items-center rounded-md text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
