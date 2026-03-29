import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Changelog — MintLens' }

const ENTRIES = [
  {
    date: 'March 29, 2026',
    version: '0.2.0',
    title: 'Subscription billing & feature gating',
    items: [
      'Stripe integration — upgrade to Pro from the dashboard',
      'Usage metering with plan limit enforcement',
      'Feature gating: CSV export, kill-switch, project/budget limits per plan',
      'Subscription management in Settings (plan card, usage meter, invoices)',
      'Plan badge in sidebar',
    ],
  },
  {
    date: 'March 19, 2026',
    version: '0.1.5',
    title: 'Team management, notifications & auth hardening',
    items: [
      'Team management (invite members, change roles, remove) in Settings',
      'Budget alert notifications with bell popover and unread badge',
      'Password reset flow (forgot + reset pages)',
      'Email verification with soft reminder',
      'Sliding window session (1h JWT, auto-renewed on activity)',
      'Auth rate limiting (5 req/min on login/signup)',
      'JWT algorithm locked to HS256',
    ],
  },
  {
    date: 'March 18, 2026',
    version: '0.1.0',
    title: 'Initial release',
    items: [
      'Dashboard: overview, cost explorer, requests, tenants, budgets',
      'SDK: 7 LLM providers (OpenAI, Anthropic, Gemini, Mistral, Cohere, Groq, DeepSeek)',
      'Budget enforcement with kill-switch',
      'Per-tenant and per-feature cost attribution',
      'CSV export from cost explorer',
      'Onboarding wizard (3-step)',
      'API key management',
      'Project CRUD with rename/delete',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Changelog</h1>
      <p className="mt-3 text-base text-slate-500">What's new in MintLens.</p>

      <div className="mt-12 space-y-12">
        {ENTRIES.map((entry) => (
          <div key={entry.version} className="relative border-l-2 border-slate-100 pl-6">
            <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-mint-400" />
            <p className="text-xs font-medium text-slate-400">{entry.date}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              v{entry.version} — {entry.title}
            </h2>
            <ul className="mt-3 space-y-1.5">
              {entry.items.map((item) => (
                <li key={item} className="text-sm text-slate-600">• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
