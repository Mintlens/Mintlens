import type { Metadata } from 'next'
import { Github, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'About — MintLens' }

export default function AboutPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">About MintLens</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-500">
        MintLens is the missing financial layer between your application and your LLM providers.
        We help engineering teams track, attribute, and control AI costs before they become a problem.
      </p>

      <div className="mt-12 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Why we built this</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We had a retry loop in an agent workflow that kept hitting the API with the same large context.
            40% cost increase in 3 days before anyone noticed. The OpenAI dashboard showed one number — total spend.
            It couldn't tell us which feature, which customer, or which model was responsible.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            So we built MintLens. A cost monitoring layer that wraps your existing LLM clients and gives you
            per-feature, per-tenant, per-model visibility — with budgets that actually enforce themselves.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Open source</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            MintLens is open source under the Apache 2.0 license. The core platform — API, dashboard, SDKs —
            is free to self-host. Enterprise features (SSO, audit logs, dedicated support) are available on our
            managed cloud.
          </p>
          <a
            href="https://github.com/Mintlens/Mintlens"
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Tech stack</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {['TypeScript', 'Next.js', 'Fastify', 'PostgreSQL', 'Redis', 'Drizzle ORM', 'BullMQ', 'Stripe'].map((t) => (
              <span key={t} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
