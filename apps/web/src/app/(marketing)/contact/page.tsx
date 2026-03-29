import type { Metadata } from 'next'
import { Mail, Github, MessageSquare } from 'lucide-react'

export const metadata: Metadata = { title: 'Contact — MintLens' }

const CHANNELS = [
  {
    icon: Mail,
    title: 'General inquiries',
    description: 'Questions about MintLens, partnerships, or anything else.',
    action: 'hello@mintlens.io',
    href: 'mailto:hello@mintlens.io',
  },
  {
    icon: MessageSquare,
    title: 'Sales & Enterprise',
    description: 'Custom plans, SLAs, SSO, and dedicated support.',
    action: 'sales@mintlens.io',
    href: 'mailto:sales@mintlens.io',
  },
  {
    icon: Github,
    title: 'Bug reports & feature requests',
    description: 'Found a bug or have an idea? Open an issue on GitHub.',
    action: 'Open an issue',
    href: 'https://github.com/Mintlens/Mintlens/issues',
  },
]

export default function ContactPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact us</h1>
      <p className="mt-3 text-base text-slate-500">We're a small team and we read every message.</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {CHANNELS.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel={c.href.startsWith('http') ? 'noopener' : undefined}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-mint-50 text-mint-500 transition-colors group-hover:bg-mint-100">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{c.description}</p>
            <p className="mt-3 text-xs font-medium text-mint-500">{c.action} →</p>
          </a>
        ))}
      </div>
    </div>
  )
}
