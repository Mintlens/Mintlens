import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — MintLens' }

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-a:text-mint-500">
      <h1>Terms of Service</h1>
      <p className="text-sm text-slate-400">Last updated: March 29, 2026</p>

      <h2>1. Acceptance</h2>
      <p>By accessing or using MintLens, you agree to these terms. If you don't agree, don't use the service.</p>

      <h2>2. The Service</h2>
      <p>MintLens provides LLM cost tracking, budget enforcement, and analytics. We process usage metadata submitted by your applications via our SDK or API.</p>

      <h2>3. Your Account</h2>
      <ul>
        <li>You are responsible for maintaining the security of your account and API keys.</li>
        <li>You must provide accurate information during registration.</li>
        <li>One organisation per account. Team members can be invited by the organisation owner.</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>You may not:</p>
      <ul>
        <li>Use the service for any unlawful purpose.</li>
        <li>Attempt to gain unauthorized access to other accounts or systems.</li>
        <li>Submit data that violates third-party rights.</li>
        <li>Resell the service without written permission.</li>
      </ul>

      <h2>5. Payment & Billing</h2>
      <ul>
        <li>Free tier: No payment required. Subject to usage limits.</li>
        <li>Paid plans: Billed monthly via Stripe. Prices are in USD.</li>
        <li>Cancellations take effect at the end of the current billing period.</li>
        <li>No refunds for partial months.</li>
      </ul>

      <h2>6. Data & Privacy</h2>
      <p>We never store your LLM prompts or completions. See our <a href="/privacy">Privacy Policy</a> for details on data collection and retention.</p>

      <h2>7. Service Availability</h2>
      <p>We aim for 99.9% uptime but provide no guarantees outside of Enterprise SLAs. The service is provided "as is."</p>

      <h2>8. Limitation of Liability</h2>
      <p>MintLens is not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you've paid us in the last 12 months.</p>

      <h2>9. Changes</h2>
      <p>We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email.</p>

      <h2>10. Contact</h2>
      <p>Questions? Email <a href="mailto:legal@mintlens.io">legal@mintlens.io</a>.</p>
    </article>
  )
}
