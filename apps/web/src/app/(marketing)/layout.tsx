import Link from 'next/link'
import MintlensLogo from '@/components/layout/logo'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <MintlensLogo className="h-7 w-7" showWordmark />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/#features" className="text-slate-500 hover:text-slate-900">Features</Link>
            <Link href="/#pricing" className="text-slate-500 hover:text-slate-900">Pricing</Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-900">Docs</Link>
            <Link href="/signup" className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white hover:bg-mint-600">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} MintLens. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
