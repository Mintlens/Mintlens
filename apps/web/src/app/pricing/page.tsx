'use client'

import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import MintlensLogo from '@/components/layout/logo'
import { cn } from '@/lib/cn'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For side projects and prototyping.',
    features: [
      '10,000 requests/month',
      '1 project',
      '2 budgets',
      '7-day data retention',
      '3 team members',
      'Community support',
    ],
    cta: 'Get Started Free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For teams shipping AI to production.',
    features: [
      '100,000 requests/month',
      '5 projects',
      'Unlimited budgets',
      '90-day retention',
      '10 team members',
      'CSV export',
      'Kill switch',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    href: '/settings?tab=subscription',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations at scale.',
    features: [
      'Unlimited requests',
      'Unlimited projects',
      'SSO & audit logs',
      '1-year+ retention',
      'Unlimited team members',
      'Dedicated support',
      'SLA guarantees',
      'Self-hosting support',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <MintlensLogo className="h-7 w-7" showWordmark />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/#features" className="text-slate-500 hover:text-slate-900">Features</Link>
            <Link href="/docs" className="text-slate-500 hover:text-slate-900">Docs</Link>
            <Link href="/signup" className="rounded-xl bg-mint-500 px-4 py-2 font-medium text-white hover:bg-mint-600">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Simple, transparent pricing</h1>
          <p className="mt-4 text-base text-slate-500">Start free. Upgrade when you need more. No surprises.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-7 transition-all duration-200',
                plan.highlight
                  ? 'border-mint-400 shadow-lg shadow-mint-100/50'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-mint-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
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
                href={plan.href}
                className={cn(
                  'mt-8 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
                  plan.highlight
                    ? 'bg-mint-500 text-white hover:bg-mint-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                )}
              >
                {plan.cta}
                {plan.highlight && <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400">All plans include: multi-provider support, real-time analytics, and API access.</p>
          <p className="mt-2 text-sm text-slate-400">
            Need something custom? <Link href="/contact" className="font-medium text-mint-500 hover:underline">Talk to us</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
