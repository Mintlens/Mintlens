import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Zap, Code, Server } from 'lucide-react'

export const metadata: Metadata = { title: 'Documentation — MintLens' }

const SECTIONS = [
  { icon: Zap, title: 'Quickstart', description: 'Track your first LLM cost in 5 minutes.', href: '/docs/quickstart' },
  { icon: Code, title: 'SDK Reference', description: 'Configuration, providers, wrappers, and manual tracking.', href: '/docs/sdk' },
  { icon: Server, title: 'API Reference', description: 'All 42 REST endpoints with request/response schemas.', href: '/docs/api' },
]

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documentation</h1>
      <p className="mt-3 text-base text-slate-500">Everything you need to integrate MintLens into your LLM application.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-mint-50 text-mint-500 transition-colors group-hover:bg-mint-100">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-semibold text-slate-900">Install the SDK</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-[#0F172A] p-4 text-sm text-slate-300">
          <code>npm install @mintlens/sdk</code>
        </pre>
        <p className="mt-3 text-xs text-slate-500">
          Then follow the <Link href="/docs/quickstart" className="font-medium text-mint-500 hover:underline">Quickstart guide</Link> to track your first cost in 5 minutes.
        </p>
      </div>
    </div>
  )
}
