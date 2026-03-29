import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — MintLens' }

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-a:text-mint-500">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-400">Last updated: March 29, 2026</p>

      <h2>What We Collect</h2>
      <p>MintLens collects the minimum data necessary to provide cost tracking and governance for your LLM applications:</p>
      <ul>
        <li><strong>Account data:</strong> Email address, name, organisation name (provided during signup).</li>
        <li><strong>Usage metadata:</strong> Token counts, model names, provider names, latency, cost calculations, feature keys, tenant IDs.</li>
        <li><strong>Billing data:</strong> Managed by Stripe. We store Stripe customer IDs and invoice references. We never see or store your card details.</li>
      </ul>

      <h2>What We Never Collect</h2>
      <p><strong>MintLens never stores LLM prompt content or response text.</strong> We track metadata only — token counts, model IDs, cost, and latency. Your prompts and completions never leave your application.</p>

      <h2>How We Use Your Data</h2>
      <ul>
        <li>Provide cost analytics and budget enforcement.</li>
        <li>Send transactional emails (password reset, budget alerts, billing notifications).</li>
        <li>Improve the product based on aggregate usage patterns (never individual content).</li>
      </ul>

      <h2>Data Storage</h2>
      <p>Data is stored in PostgreSQL databases. All connections are encrypted with TLS. API keys are stored as SHA-256 hashes — we cannot recover your raw API key after creation.</p>

      <h2>Data Retention</h2>
      <ul>
        <li><strong>Free plan:</strong> 7 days of usage data.</li>
        <li><strong>Pro plan:</strong> 90 days.</li>
        <li><strong>Enterprise:</strong> Configurable, up to 1 year+.</li>
      </ul>
      <p>Account data is retained until you delete your account. Billing records are retained for 7 years per legal requirements.</p>

      <h2>Your Rights (GDPR)</h2>
      <p>You have the right to access, export, correct, or delete your personal data. Contact <a href="mailto:privacy@mintlens.io">privacy@mintlens.io</a> to exercise these rights.</p>

      <h2>Third-Party Services</h2>
      <ul>
        <li><strong>Stripe</strong> — Payment processing. Subject to <a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe's Privacy Policy</a>.</li>
        <li><strong>Resend</strong> — Transactional email delivery.</li>
      </ul>

      <h2>Contact</h2>
      <p>Questions about this policy? Email <a href="mailto:privacy@mintlens.io">privacy@mintlens.io</a>.</p>
    </article>
  )
}
