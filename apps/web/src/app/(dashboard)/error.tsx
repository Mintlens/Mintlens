'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="text-base font-semibold text-slate-900">Something went wrong</h2>
      <p className="max-w-sm text-center text-sm text-slate-500">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
