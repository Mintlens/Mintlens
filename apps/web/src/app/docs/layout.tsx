import Link from 'next/link'
import MintlensLogo from '@/components/layout/logo'

const DOCS_NAV = [
  { label: 'Overview', href: '/docs' },
  { label: 'Quickstart', href: '/docs/quickstart' },
  { label: 'SDK Reference', href: '/docs/sdk' },
  { label: 'API Reference', href: '/docs/api' },
]

const GUIDES_NAV = [
  { label: 'OpenAI', href: '/docs/guides/openai' },
  { label: 'Anthropic', href: '/docs/guides/anthropic' },
  { label: 'Multi-Tenant Tracking', href: '/docs/guides/multi-tenant' },
  { label: 'Budgets & Kill-Switch', href: '/docs/guides/budgets' },
  { label: 'Self-Hosting', href: '/docs/guides/self-hosting' },
]

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <MintlensLogo className="h-7 w-7" showWordmark />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-slate-500 hover:text-slate-900">Pricing</Link>
            <Link href="https://github.com/Mintlens/Mintlens" target="_blank" rel="noopener" className="text-slate-500 hover:text-slate-900">GitHub</Link>
            <Link href="/signup" className="rounded-xl bg-mint-500 px-4 py-2 font-medium text-white hover:bg-mint-600">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-slate-100 py-8 pr-6 pl-6 md:block">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Documentation</p>
          <nav className="space-y-1">
            {DOCS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">Guides</p>
          <nav className="space-y-1">
            {GUIDES_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 px-8 py-10 max-w-3xl">
          {children}
        </main>
      </div>
    </div>
  )
}
