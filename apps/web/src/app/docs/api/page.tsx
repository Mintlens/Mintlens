import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'API Reference — MintLens Docs' }

const SECTIONS = [
  {
    title: 'Authentication',
    endpoints: [
      { method: 'GET', path: '/v1/auth/csrf-token', description: 'Get CSRF token for mutations' },
      { method: 'POST', path: '/v1/auth/signup', description: 'Create account and organisation' },
      { method: 'POST', path: '/v1/auth/login', description: 'Authenticate with email and password' },
      { method: 'POST', path: '/v1/auth/logout', description: 'Clear session cookie' },
      { method: 'GET', path: '/v1/auth/me', description: 'Get current user profile' },
      { method: 'PATCH', path: '/v1/auth/me', description: 'Update profile (name)' },
      { method: 'PATCH', path: '/v1/auth/org', description: 'Update organisation (owner only)' },
      { method: 'POST', path: '/v1/auth/forgot-password', description: 'Request password reset email' },
      { method: 'POST', path: '/v1/auth/reset-password', description: 'Reset password with token' },
      { method: 'POST', path: '/v1/auth/send-verification', description: 'Send email verification' },
      { method: 'POST', path: '/v1/auth/verify-email', description: 'Verify email with code' },
    ],
  },
  {
    title: 'API Keys',
    endpoints: [
      { method: 'POST', path: '/v1/auth/api-keys', description: 'Generate a new SDK API key' },
      { method: 'GET', path: '/v1/auth/api-keys', description: 'List API keys for a project' },
      { method: 'DELETE', path: '/v1/auth/api-keys/:keyId', description: 'Revoke an API key' },
    ],
  },
  {
    title: 'Team',
    endpoints: [
      { method: 'GET', path: '/v1/team/members', description: 'List organisation members' },
      { method: 'POST', path: '/v1/team/members', description: 'Invite a member' },
      { method: 'PATCH', path: '/v1/team/members/:userId/role', description: 'Change member role' },
      { method: 'DELETE', path: '/v1/team/members/:userId', description: 'Remove a member' },
    ],
  },
  {
    title: 'Events (Ingestion)',
    endpoints: [
      { method: 'POST', path: '/v1/events/llm-usage', description: 'Ingest a batch of LLM usage events (API key auth)' },
    ],
  },
  {
    title: 'Analytics',
    endpoints: [
      { method: 'GET', path: '/v1/analytics/summary', description: 'KPI summary (cost, tokens, requests, latency)' },
      { method: 'GET', path: '/v1/analytics/cost-explorer', description: 'Time-series cost breakdown with filters' },
      { method: 'GET', path: '/v1/analytics/tenants', description: 'Per-tenant cost and revenue overview' },
      { method: 'GET', path: '/v1/analytics/requests', description: 'Paginated request logs' },
    ],
  },
  {
    title: 'Projects',
    endpoints: [
      { method: 'GET', path: '/v1/projects', description: 'List all projects' },
      { method: 'POST', path: '/v1/projects', description: 'Create a project' },
      { method: 'GET', path: '/v1/projects/:projectId', description: 'Get a project' },
      { method: 'PATCH', path: '/v1/projects/:projectId', description: 'Update a project' },
      { method: 'DELETE', path: '/v1/projects/:projectId', description: 'Soft-delete a project' },
      { method: 'GET', path: '/v1/projects/:projectId/features', description: 'List features with cost' },
    ],
  },
  {
    title: 'Budgets',
    endpoints: [
      { method: 'POST', path: '/v1/budgets', description: 'Create a budget with kill-switch and alerts' },
      { method: 'GET', path: '/v1/budgets', description: 'List active budgets with current spend' },
      { method: 'DELETE', path: '/v1/budgets/:budgetId', description: 'Deactivate a budget' },
      { method: 'GET', path: '/v1/budgets/alerts', description: 'List budget alerts' },
      { method: 'PATCH', path: '/v1/budgets/alerts/:alertId/read', description: 'Mark alert as read' },
    ],
  },
  {
    title: 'Billing',
    endpoints: [
      { method: 'POST', path: '/v1/billing/checkout', description: 'Create Stripe Checkout session' },
      { method: 'POST', path: '/v1/billing/portal', description: 'Create Stripe billing portal session' },
      { method: 'GET', path: '/v1/billing/subscription', description: 'Get current plan, usage, and limits' },
      { method: 'POST', path: '/v1/billing/cancel', description: 'Cancel subscription at period end' },
      { method: 'POST', path: '/v1/billing/resume', description: 'Reactivate cancelled subscription' },
      { method: 'GET', path: '/v1/billing/invoices', description: 'List invoices' },
      { method: 'GET', path: '/v1/billing/usage', description: 'Get current period usage' },
    ],
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-50 text-emerald-600',
  POST: 'bg-blue-50 text-blue-600',
  PATCH: 'bg-amber-50 text-amber-600',
  DELETE: 'bg-red-50 text-red-600',
}

export default function ApiReferencePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">API Reference</h1>
      <p className="mt-3 text-base text-slate-500">
        All endpoints use JSON. Authentication via httpOnly cookie (dashboard) or Bearer API key (SDK).
        Base URL: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-mint-600">https://api.mintlens.io</code>
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-100 pb-2">{section.title}</h2>
            <div className="mt-4 space-y-2">
              {section.endpoints.map((ep) => (
                <div key={`${ep.method}-${ep.path}`} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 transition-colors hover:bg-slate-50">
                  <span className={`inline-flex shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${METHOD_COLORS[ep.method] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-medium text-slate-800">{ep.path}</code>
                  <span className="ml-auto text-xs text-slate-400">{ep.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
