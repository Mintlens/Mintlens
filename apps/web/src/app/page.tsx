'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  Layers, Shield, Lock, FileSpreadsheet, Users, Bell,
  Terminal, Package, BarChart3, ChevronRight, Github,
  Check, ArrowRight, ExternalLink,
} from 'lucide-react'
import MintlensLogo from '@/components/layout/logo'
import { ProviderLogos } from '@/components/landing/provider-logos'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Navigation                                                         */
/* ------------------------------------------------------------------ */

function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent',
    )}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <MintlensLogo className="h-7 w-7" showWordmark />
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          <a href="#features" className="text-slate-500 transition-colors hover:text-slate-900">Features</a>
          <a href="#pricing" className="text-slate-500 transition-colors hover:text-slate-900">Pricing</a>
          <a href="https://github.com/Mintlens/Mintlens" target="_blank" rel="noopener" className="text-slate-500 transition-colors hover:text-slate-900">GitHub</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600 active:scale-[0.98]"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  const [tab, setTab] = useState<'typescript' | 'curl'>('typescript')

  const tsCode = `import OpenAI from 'openai'
import { MintlensClient, wrapOpenAI } from '@mintlens/sdk'

const mintlens = new MintlensClient({
  apiKey: process.env.MINTLENS_API_KEY!
})
const openai = wrapOpenAI(new OpenAI(), mintlens)

// That's it — every call is now tracked
const res = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
})`

  const curlCode = `curl -X POST https://api.mintlens.io/v1/events/llm-usage \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o",
    "tokensInput": 150,
    "tokensOutput": 80,
    "featureKey": "support_chat",
    "tenantId": "customer-123"
  }'`

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <FadeIn>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
                Open source · Apache 2.0
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Know what your AI
                <span className="relative">
                  <span className="relative z-10"> actually costs.</span>
                  <span className="absolute bottom-2 left-1 right-0 z-0 h-3 bg-mint-100/60 rounded-sm" />
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-500">
                Track every LLM call by model, feature, and tenant.
                Set budgets that enforce themselves. Kill runaway spend automatically.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-mint-600 hover:shadow-md active:scale-[0.98]"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://github.com/Mintlens/Mintlens"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  Read the Docs
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </FadeIn>

            {/* Provider logos */}
            <FadeIn delay={0.4}>
              <ProviderLogos className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-3" />
            </FadeIn>
          </div>

          {/* Right — Code snippet */}
          <FadeIn delay={0.2} className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-[#0F172A] shadow-2xl shadow-slate-900/10">
              {/* Tab bar */}
              <div className="flex items-center gap-0 border-b border-slate-700/50 bg-[#0B1120]">
                {(['typescript', 'curl'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'px-4 py-2.5 text-xs font-medium transition-colors',
                      tab === t ? 'text-mint-400 border-b-2 border-mint-400' : 'text-slate-500 hover:text-slate-400',
                    )}
                  >
                    {t === 'typescript' ? 'TypeScript' : 'cURL'}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1.5 pr-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                </div>
              </div>

              {/* Code */}
              <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
                <code className="text-slate-300">
                  {(tab === 'typescript' ? tsCode : curlCode).split('\n').map((line, i) => (
                    <div key={i}>
                      {line.split(/('.*?')/g).map((part, j) =>
                        part.startsWith("'") ? (
                          <span key={j} className="text-mint-400">{part}</span>
                        ) : part.startsWith('//') ? (
                          <span key={j} className="text-slate-600">{part}</span>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      icon: Package,
      title: 'Install',
      description: 'One package. Zero config.',
      code: 'npm install @mintlens/sdk',
    },
    {
      icon: Terminal,
      title: 'Wrap',
      description: 'Wrap your existing LLM client.',
      code: 'wrapOpenAI(new OpenAI(), mintlens)',
    },
    {
      icon: BarChart3,
      title: 'See costs',
      description: 'Every call tracked automatically.',
      code: 'dashboard → cost explorer',
    },
  ]

  return (
    <section className="bg-[#FAFBFC] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-mint-500">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Three steps. Under five minutes.</h2>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.1}>
              <div className="relative text-center">
                {/* Step number */}
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <step.icon className="h-5 w-5 text-mint-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{step.description}</p>
                <code className="mt-3 inline-block rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-600 font-mono">
                  {step.code}
                </code>

                {/* Connector arrow */}
                {i < 2 && (
                  <ChevronRight className="absolute right-0 top-6 hidden h-5 w-5 translate-x-1/2 text-slate-300 md:block" />
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

function Features() {
  const features = [
    {
      icon: Layers,
      title: 'Slice costs by any dimension',
      description: 'Break down spend by model, provider, feature, tenant, or environment. See exactly where every dollar goes.',
    },
    {
      icon: Shield,
      title: 'Budgets that enforce themselves',
      description: 'Set daily or monthly limits. Enable the kill switch to automatically block requests before you exceed the budget.',
    },
    {
      icon: Lock,
      title: 'Your prompts never leave your infra',
      description: 'MintLens tracks cost metadata — tokens, latency, model IDs — not prompt content. Self-host or use our cloud.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Export. Invoice. Bill your customers.',
      description: 'Per-tenant cost attribution with CSV export and REST APIs. Build usage-based billing without spreadsheet hacks.',
    },
    {
      icon: Users,
      title: 'Track every tenant separately',
      description: 'Multi-tenant cost visibility out of the box. Know what each customer costs you before they know it themselves.',
    },
    {
      icon: Bell,
      title: 'Real-time alerts before it hurts',
      description: 'Get notified at 75%, 90%, 100% of any budget. Email alerts and in-app notifications. No more surprise invoices.',
    },
  ]

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-mint-500">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Everything you need to control AI spend</h2>
            <p className="mt-4 mx-auto max-w-2xl text-base text-slate-500">
              Your LLM provider shows one number. MintLens shows you why.
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.05}>
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-mint-50 text-mint-500 transition-colors group-hover:bg-mint-100">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard Preview                                                  */
/* ------------------------------------------------------------------ */

function DashboardPreview() {
  return (
    <section className="bg-[#FAFBFC] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-mint-500">Dashboard</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Answers in seconds, not spreadsheets</h2>
            <p className="mt-4 mx-auto max-w-2xl text-base text-slate-500">
              Real-time overview of every dollar across every model, feature, and customer.
              Drill down from organization-wide spend to individual API calls.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-slate-200" />
                <div className="h-3 w-3 rounded-full bg-slate-200" />
                <div className="h-3 w-3 rounded-full bg-slate-200" />
              </div>
              <div className="ml-4 flex-1 rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs text-slate-400">
                app.mintlens.io/overview
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="p-8 bg-gradient-to-b from-white to-slate-50/50">
              <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
                {[
                  { label: 'Total cost', value: '$2,847.32', change: '+12%' },
                  { label: 'Requests', value: '184,291', change: '+8%' },
                  { label: 'Tokens', value: '47.2M', change: '+15%' },
                  { label: 'Avg cost/req', value: '$0.0154', change: '-3%' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-slate-400">{kpi.label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{kpi.value}</p>
                    <p className={cn('mt-1 text-xs font-medium', kpi.change.startsWith('+') ? 'text-mint-500' : 'text-red-500')}>
                      {kpi.change} vs last month
                    </p>
                  </div>
                ))}
              </div>

              {/* Chart placeholder */}
              <div className="rounded-xl border border-slate-100 bg-white p-6">
                <p className="text-xs font-medium text-slate-400 mb-4">Daily cost · Last 30 days</p>
                <div className="flex items-end gap-1 h-32">
                  {[32,45,38,52,41,58,35,62,48,55,42,68,51,44,72,56,49,75,60,53,78,64,57,82,70,63,88,76,69,95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-mint-400/80 transition-all hover:bg-mint-500"
                        style={{ height: `${h}%` }}
                      />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Trust & Open Source                                                */
/* ------------------------------------------------------------------ */

function Trust() {
  const techStack = ['TypeScript', 'Next.js', 'Fastify', 'PostgreSQL', 'Redis']

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12">
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <Github className="h-3.5 w-3.5" />
                  Open Source · Apache 2.0
                </div>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
                  No vendor lock-in. Ever.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  MintLens is fully open source. Self-host on your own infrastructure
                  or use our managed cloud. Your data stays yours.
                </p>
                <a
                  href="https://github.com/Mintlens/Mintlens"
                  target="_blank"
                  rel="noopener"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
                >
                  <Github className="h-4 w-4" />
                  Star on GitHub
                </a>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Built with</p>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <span key={tech} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Performance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900">&lt;1ms</span>
                    <span className="text-sm text-slate-500">overhead per tracked call</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Fire-and-forget async batching. Your LLM calls are never blocked.</p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Pricing                                                            */
/* ------------------------------------------------------------------ */

function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'For side projects and prototyping.',
      features: ['10,000 requests/month', '1 project', '2 budgets', '7-day data retention', 'Community support'],
      cta: 'Get Started Free',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For teams shipping AI to production.',
      features: ['100,000 requests/month', '5 projects', 'Unlimited budgets', '90-day retention', 'CSV export', 'Kill switch', 'Email support'],
      cta: 'Start Pro Trial',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For organizations with scale requirements.',
      features: ['Unlimited requests', 'Unlimited projects', 'SSO & audit logs', '1-year+ retention', 'Dedicated support', 'SLA guarantees', 'Self-hosting support'],
      cta: 'Contact Sales',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="bg-[#FAFBFC] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-mint-500">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Start free. Scale when ready.</h2>
            <p className="mt-4 text-base text-slate-500">No credit card required. Upgrade or self-host anytime.</p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <div className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-7 transition-all duration-200',
                plan.highlight
                  ? 'border-mint-400 shadow-lg shadow-mint-100/50'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
              )}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-mint-500 px-3 py-0.5 text-xs font-semibold text-white">
                    Popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && <span className="text-sm text-slate-500">{plan.period}</span>}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    plan.name === 'Enterprise' ? '#'
                    : plan.name === 'Pro' ? '/settings?tab=subscription'
                    : '/signup'
                  }
                  className={cn(
                    'mt-8 block rounded-xl py-2.5 text-center text-sm font-semibold transition-all',
                    plan.highlight
                      ? 'bg-mint-500 text-white hover:bg-mint-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-mint-50/30 p-12 md:p-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Your AI bill will only grow from here.
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-slate-500">
              Start tracking costs in under five minutes. Free tier, no credit card.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-mint-600 hover:shadow-md active:scale-[0.98]"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/Mintlens/Mintlens"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Dashboard', href: '/login' },
        { label: 'Changelog', href: '#' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'SDK Reference', href: '#' },
        { label: 'API Status', href: '#' },
        { label: 'GitHub', href: 'https://github.com/Mintlens/Mintlens' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Security', href: '#' },
        { label: 'License (Apache 2.0)', href: '#' },
      ],
    },
  ]

  return (
    <footer className="border-t border-slate-200 bg-[#F7F8F9] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-1">
            <MintlensLogo className="h-7 w-7" showWordmark />
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              LLM cost tracking &amp; governance for AI builders.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} MintLens. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <DashboardPreview />
      <Trust />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  )
}
