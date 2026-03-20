'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch, ApiRequestError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import MintlensLogo from '@/components/layout/logo'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', organisationName: '',
  })
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiFetch('/v1/auth/signup', { method: 'POST', body: JSON.stringify(form) })
      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <MintlensLogo className="h-10 w-10" />
          <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">Get started in under a minute</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-7 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="Jane" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Smith" value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org">Organisation</Label>
              <Input id="org" placeholder="Acme Inc." value={form.organisationName} onChange={set('organisationName')} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" value={form.email} onChange={set('email')} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" placeholder="Min. 8 characters" autoComplete="new-password" value={form.password} onChange={set('password')} minLength={8} required />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" variant="primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-mint-500 hover:text-mint-600 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
