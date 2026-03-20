'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api-client'
import MintlensLogo from '@/components/layout/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch('/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    } catch {
      // Always show success to prevent email enumeration
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <MintlensLogo className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-card">
            <p className="text-sm text-slate-700">
              If an account exists with <strong>{email}</strong>, we've sent a reset link.
            </p>
            <p className="mt-3 text-xs text-slate-400">Check your inbox and spam folder.</p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium text-mint-500 hover:underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@company.com"
                className="h-9 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-colors focus:border-mint-300 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="h-9 w-full rounded-xl bg-mint-500 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <p className="text-center text-xs text-slate-400">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-mint-500 hover:underline">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
