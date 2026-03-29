import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Multi-Tenant Cost Tracking — MintLens Docs' }

export default function MultiTenantGuidePage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-pre:bg-[#0F172A] prose-pre:text-slate-300 prose-a:text-mint-500 prose-code:text-mint-600 prose-code:before:content-[''] prose-code:after:content-['']">
      <h1>Multi-Tenant Cost Tracking</h1>
      <p>If you're a B2B SaaS using LLMs, you need per-customer cost visibility to protect margins and enable usage-based billing.</p>

      <h2>Set tenantId per-call</h2>
      <p>Pass the tenant identifier with each LLM call. This is the most flexible approach for multi-tenant request handlers:</p>
      <pre><code>{`const openai = wrapOpenAI(new OpenAI(), mintlens)

// In your API handler:
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: req.body.messages,
  mintlens: { tenantId: req.auth.customerId },
})`}</code></pre>

      <h2>Set tenantId as default</h2>
      <p>For single-tenant services where one wrapper instance serves one customer:</p>
      <pre><code>{`const openai = wrapOpenAI(new OpenAI(), mintlens, {
  tenantId: 'customer-123',
})`}</code></pre>

      <h2>Express middleware pattern</h2>
      <pre><code>{`import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'

const mintlens = new MintlensClient({ apiKey: process.env.MINTLENS_API_KEY! })

app.post('/api/chat', async (req, res) => {
  const openai = wrapOpenAI(new OpenAI(), mintlens, {
    tenantId: req.user.organisationId,
    featureKey: 'chat',
  })

  const result = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: req.body.messages,
  })

  res.json(result)
})`}</code></pre>

      <h2>View tenant costs</h2>
      <p>In the dashboard, navigate to <strong>Tenants</strong> to see cost, requests, tokens, and estimated margin per tenant. Data is searchable and sortable.</p>
      <p>Via API: <code>GET /v1/analytics/tenants?from=...&to=...</code></p>

      <h2>Set per-tenant budgets</h2>
      <p>Create budgets scoped to specific tenants with automatic kill-switch:</p>
      <pre><code>{`POST /v1/budgets
{
  "projectId": "...",
  "name": "Acme monthly cap",
  "scope": "tenant",
  "tenantId": "acme-corp",
  "limitMicro": 50000000,
  "period": "monthly",
  "killSwitchEnabled": true,
  "alertThresholds": [80, 100]
}`}</code></pre>

      <p>Next: <Link href="/docs/guides/budgets">Budgets & kill-switch</Link> · <Link href="/docs/api">API reference</Link></p>
    </article>
  )
}
