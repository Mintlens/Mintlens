import type { Metadata } from 'next'
import { Shield, Lock, Eye, Server, Key, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = { title: 'Security — MintLens' }

const FEATURES = [
  { icon: Lock, title: 'No prompt storage', description: 'MintLens never stores your LLM prompts or responses. We track metadata only — token counts, model IDs, cost, and latency.' },
  { icon: Key, title: 'API key security', description: 'API keys are stored as SHA-256 hashes. Raw keys are shown once at creation and cannot be recovered. Keys can be revoked instantly.' },
  { icon: Shield, title: 'Authentication', description: 'JWT tokens with HS256 algorithm, 1-hour sliding window sessions, httpOnly cookies, CSRF protection on all mutations.' },
  { icon: Server, title: 'Encryption', description: 'All data in transit is encrypted with TLS. Database connections use SSL. Passwords are hashed with bcrypt (12 rounds).' },
  { icon: Eye, title: 'Access control', description: 'Organisation-level data isolation. Role-based access (owner/admin/member). All analytics verify org ownership before returning data.' },
  { icon: AlertTriangle, title: 'Rate limiting', description: 'Authentication endpoints: 5 requests/min. Ingestion API: 500 requests/min. Prevents brute-force and DDoS attacks.' },
]

export default function SecurityPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security</h1>
      <p className="mt-3 text-base text-slate-500">How MintLens protects your data and your customers' data.</p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint-50">
              <f.icon className="h-5 w-5 text-mint-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-8">
        <h2 className="text-lg font-semibold text-slate-900">Responsible Disclosure</h2>
        <p className="mt-2 text-sm text-slate-500">
          Found a vulnerability? Email <a href="mailto:security@mintlens.io" className="font-medium text-mint-500 hover:underline">security@mintlens.io</a>.
          We respond within 48 hours and work with you to resolve the issue before any public disclosure.
        </p>
      </div>
    </div>
  )
}
