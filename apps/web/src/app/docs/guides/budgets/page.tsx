import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Budgets & Kill-Switch — MintLens Docs' }

export default function BudgetsGuidePage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-pre:bg-[#0F172A] prose-pre:text-slate-300 prose-a:text-mint-500 prose-code:text-mint-600 prose-code:before:content-[''] prose-code:after:content-['']">
      <h1>Budgets & Kill-Switch</h1>
      <p>Set spend limits at the project, tenant, or feature level. Get alerts at thresholds. Optionally auto-block requests when the budget is exceeded.</p>

      <h2>Create a budget</h2>
      <p>Via the dashboard: <strong>Budgets → New Budget</strong></p>
      <p>Via API:</p>
      <pre><code>{`POST /v1/budgets
{
  "projectId": "your-project-id",
  "name": "Monthly project cap",
  "scope": "project",
  "limitMicro": 500000000,
  "period": "monthly",
  "killSwitchEnabled": false,
  "alertThresholds": [75, 90, 100]
}`}</code></pre>
      <p><code>limitMicro</code> is in microdollars (1 USD = 1,000,000). So 500,000,000 = $500.</p>

      <h2>Scopes</h2>
      <ul>
        <li><strong>project</strong> — total spend across the entire project</li>
        <li><strong>tenant</strong> — per-customer spend (requires <code>tenantId</code>)</li>
        <li><strong>feature</strong> — per-feature spend (requires <code>featureId</code>)</li>
      </ul>

      <h2>Periods</h2>
      <ul>
        <li><strong>daily</strong> — resets at midnight UTC</li>
        <li><strong>monthly</strong> — resets on the 1st of each month</li>
        <li><strong>rolling_30d</strong> — sliding 30-day window, recalculated continuously</li>
      </ul>

      <h2>Alert thresholds</h2>
      <p>Set percentage thresholds (e.g. <code>[75, 90, 100]</code>). When spend reaches each threshold, MintLens sends an email notification and creates an in-app alert visible in the bell icon.</p>

      <h2>Kill-switch (Pro plan)</h2>
      <p>When <code>killSwitchEnabled: true</code> and the budget reaches 100%, MintLens sets a Redis flag that blocks new events for that scope.</p>
      <p>The SDK receives a <code>429</code> response. Handle it in your application:</p>
      <pre><code>{`try {
  const response = await openai.chat.completions.create({ ... })
} catch (err) {
  if (err.status === 429) {
    // Budget exceeded — show user a message or fall back
    console.warn('LLM budget exceeded, request blocked')
  }
}`}</code></pre>

      <h2>View alerts</h2>
      <p>Dashboard: click the bell icon in the top bar. API: <code>GET /v1/budgets/alerts</code></p>

      <p>Next: <Link href="/docs/guides/self-hosting">Self-hosting guide</Link> · <Link href="/docs/api">API reference</Link></p>
    </article>
  )
}
