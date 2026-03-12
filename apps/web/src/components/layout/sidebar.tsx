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
} from 'lucide-react'
import { cn } from '@/lib/cn'
import MintlensLogo from './logo'
import { apiFetch } from '@/lib/api-client'
import { invalidateCsrfToken } from '@/hooks/use-csrf'
import { useAuthStore } from '@/store/auth.store'

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
      { href: '/overview',      label: 'Overview',       icon: LayoutDashboard },
      { href: '/cost-explorer', label: 'Cost Explorer',  icon: TrendingUp },
      { href: '/requests',      label: 'Requests',       icon: List },
    ],
  },
  {
    title: 'Management',
    items: [
      { href: '/tenants',       label: 'Tenants',        icon: Users },
      { href: '/budgets',       label: 'Budgets & Alerts', icon: Shield },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { href: '/projects',      label: 'Projects',       icon: FolderOpen },
      { href: '/api-keys',      label: 'API Keys',       icon: Key },
      { href: '/settings',      label: 'Settings',       icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname     = usePathname()
  const router       = useRouter()
  const clearProject = useAuthStore((s) => s.clearProject)

  async function logout() {
    try {
      await apiFetch('/v1/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    invalidateCsrfToken()
    clearProject()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <MintlensLogo showWordmark className="h-6 w-6" />
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>

            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
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
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
