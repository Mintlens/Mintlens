'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { apiFetch, ApiRequestError } from '@/lib/api-client'
import { PasswordInput } from '@/components/ui/password-input'
import MintlensLogo from '@/components/layout/logo'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await apiFetch('/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-slate-500">Invalid reset link.</p>
          <Link href="/forgot-password" className="mt-3 inline-block text-sm font-medium text-mint-500 hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <MintlensLogo className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-slate-900">Set new password</h1>
        </div>

        {success ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-card">
            <p className="text-sm text-slate-700">Your password has been reset.</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-xl bg-mint-500 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600"
            >
              Log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">New password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Confirm password</label>
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                placeholder="Type it again"
              />
            </div>
            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="h-9 w-full rounded-xl bg-mint-500 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
