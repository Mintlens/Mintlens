'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch, ApiRequestError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MintlensLogo from '@/components/layout/logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiFetch('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      router.push('/overview')
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <MintlensLogo className="h-10 w-10" />
          <h1 className="text-xl font-semibold text-slate-900">Sign in to Mintlens</h1>
          <p className="text-sm text-slate-500">Track your LLM costs with clarity</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-100 bg-white p-7 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" variant="primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-mint-500 transition-colors">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-mint-500 hover:text-mint-600 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
