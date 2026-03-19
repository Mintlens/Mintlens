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
    } catch { /* ignore — cookie cleared client-side regardless */ }
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    invalidateCsrfToken()
    clearProject()
    router.push('/login')
  }

  return (
    <aside
      data-sidebar={collapsed ? 'collapsed' : 'expanded'}
      className={cn(
        'flex h-screen shrink-0 flex-col py-4 pl-4 transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex h-14 items-center',
        collapsed ? 'justify-center pl-3 pr-1' : 'justify-between px-3',
      )}>
        <div className={cn('flex items-center', collapsed ? '' : 'pl-1')}>
          <MintlensLogo showWordmark={!collapsed} variant="light" className="h-6 w-6" />
        </div>
        {!collapsed && (
          <button
            onClick={toggle}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:text-white"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button (visible when collapsed) */}
      {collapsed && (
        <div className="flex justify-center py-1 pl-3 pr-1">
          <button
            onClick={toggle}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:text-white"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav sections */}
      <nav className="mt-6 flex-1 space-y-3 overflow-y-auto pl-2 pr-0">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className={cn('mb-2', collapsed ? 'flex h-4 items-center justify-center' : 'px-3')}>
              {collapsed ? (
                <div className="h-px w-6 bg-white/30" />
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  {section.title}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')

                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'group relative flex items-center text-[13px] font-medium',
                      collapsed
                        ? 'justify-center py-2.5 px-2'
                        : 'gap-3 px-3 py-2.5',
                      active
                        ? 'sidebar-active-tab text-mint-700'
                        : 'rounded-xl text-white/80 sidebar-glass-hover hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        active ? 'text-mint-500' : 'text-white group-hover:text-white',
                      )}
                    />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — Sign out */}
      <div className="pl-0 pr-2 pb-1 pt-2">
        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex w-full items-center rounded-xl text-[13px] font-medium text-white/60 sidebar-glass-hover hover:text-white/80',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
