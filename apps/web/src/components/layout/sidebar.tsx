'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Wallet, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import MintlensLogo from './logo'
import { apiFetch } from '@/lib/api-client'
import { invalidateCsrfToken } from '@/hooks/use-csrf'
import { useAuthStore } from '@/store/auth.store'

const NAV = [
  { href: '/overview',      label: 'Overview',      icon: LayoutDashboard },
  { href: '/cost-explorer', label: 'Cost Explorer',  icon: TrendingUp },
  { href: '/budgets',       label: 'Budgets',        icon: Wallet },
]

export function Sidebar() {
  const pathname    = usePathname()
  const router      = useRouter()
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

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-mint-50 text-mint-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  active ? 'text-mint-500' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint-400" />
              )}
            </Link>
          )
        })}
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
