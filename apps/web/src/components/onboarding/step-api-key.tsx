'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CopyButton } from '@/components/shared/copy-button'
import { toast } from 'sonner'

interface CreatedKeyResponse {
  keyId: string
  keyPrefix: string
  rawKey: string
  warning: string
}

interface StepApiKeyProps {
  projectId: string
  onComplete: (rawKey: string) => void
}

export function StepApiKey({ projectId, onComplete }: StepApiKeyProps) {
  const [rawKey, setRawKey] = useState<string | null>(null)

  const generateKey = useMutation({
    mutationFn: () =>
      apiFetch<CreatedKeyResponse>('/v1/auth/api-keys', {
        method: 'POST',
        body: JSON.stringify({ projectId, name: 'Onboarding SDK Key' }),
      }),
  })

  async function handleGenerate() {
    try {
      const result = await generateKey.mutateAsync()
      setRawKey(result.rawKey)
    } catch {
      toast.error('Failed to generate API key')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Generate an API key</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your SDK will use this key to send LLM usage events to Mintlens.
        </p>
      </div>

      {!rawKey ? (
        <Button variant="primary" onClick={handleGenerate} disabled={generateKey.isPending}>
          {generateKey.isPending ? 'Generating...' : 'Generate API key'}
        </Button>
      ) : (
        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-medium text-amber-800">
                    Save your API key — it won't be shown again
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-white px-3 py-1.5 text-xs font-mono text-slate-700 border border-amber-200">
                      {rawKey}
                    </code>
                    <CopyButton value={rawKey} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button variant="primary" onClick={() => onComplete(rawKey)}>
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}
