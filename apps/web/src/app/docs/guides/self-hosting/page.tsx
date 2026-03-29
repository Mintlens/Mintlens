import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Self-Hosting — MintLens Docs' }

export default function SelfHostingGuidePage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-pre:bg-[#0F172A] prose-pre:text-slate-300 prose-a:text-mint-500 prose-code:text-mint-600 prose-code:before:content-[''] prose-code:after:content-['']">
      <h1>Self-Hosting MintLens</h1>
      <p>MintLens is open source (Apache 2.0). Deploy it on your own infrastructure with Docker.</p>

      <h2>Requirements</h2>
      <ul>
        <li>Docker & Docker Compose</li>
        <li>PostgreSQL 15+</li>
        <li>Redis 7+</li>
        <li>Node.js 20+ (for building from source)</li>
      </ul>

      <h2>Quick start</h2>
      <pre><code>{`git clone https://github.com/Mintlens/Mintlens.git
cd Mintlens
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
pnpm install
pnpm db:migrate
pnpm dev`}</code></pre>

      <h2>Environment variables</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="py-2 pr-4 font-medium text-slate-600">Variable</th>
              <th className="py-2 pr-4 font-medium text-slate-600">Required</th>
              <th className="py-2 font-medium text-slate-600">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr><td className="py-2 pr-4"><code>DATABASE_URL</code></td><td className="py-2 pr-4">Yes</td><td className="py-2">PostgreSQL connection string</td></tr>
            <tr><td className="py-2 pr-4"><code>REDIS_URL</code></td><td className="py-2 pr-4">Yes</td><td className="py-2">Redis connection string</td></tr>
            <tr><td className="py-2 pr-4"><code>JWT_SECRET</code></td><td className="py-2 pr-4">Yes</td><td className="py-2">32+ character secret for signing JWTs</td></tr>
            <tr><td className="py-2 pr-4"><code>CSRF_HMAC_KEY</code></td><td className="py-2 pr-4">Yes</td><td className="py-2">HMAC key for CSRF token generation</td></tr>
            <tr><td className="py-2 pr-4"><code>API_KEY_SALT</code></td><td className="py-2 pr-4">Yes</td><td className="py-2">Salt for API key hashing</td></tr>
            <tr><td className="py-2 pr-4"><code>RESEND_API_KEY</code></td><td className="py-2 pr-4">No</td><td className="py-2">For email notifications (budget alerts, password reset)</td></tr>
            <tr><td className="py-2 pr-4"><code>STRIPE_SECRET_KEY</code></td><td className="py-2 pr-4">No</td><td className="py-2">For billing (leave empty to disable)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Point the SDK to your instance</h2>
      <pre><code>{`const mintlens = new MintlensClient({
  apiKey: 'sk_live_...',
  apiUrl: 'https://mintlens.yourcompany.com',
})`}</code></pre>

      <h2>Production checklist</h2>
      <ul>
        <li>Run behind a reverse proxy (nginx or Caddy) with TLS</li>
        <li>Set <code>NODE_ENV=production</code></li>
        <li>Use strong, unique values for <code>JWT_SECRET</code>, <code>CSRF_HMAC_KEY</code>, and <code>API_KEY_SALT</code></li>
        <li>Set up regular PostgreSQL backups</li>
        <li>Configure log aggregation (MintLens outputs structured JSON logs via Pino)</li>
        <li>Monitor Redis memory usage — budget and usage counters grow with active orgs</li>
      </ul>

      <p>Questions? <Link href="https://github.com/Mintlens/Mintlens/discussions" target="_blank" rel="noopener">Ask on GitHub Discussions</Link></p>
    </article>
  )
}
