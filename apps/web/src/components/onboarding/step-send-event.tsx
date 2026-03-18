'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/shared/copy-button'

interface StepSendEventProps {
  apiKey: string
}

export function StepSendEvent({ apiKey }: StepSendEventProps) {
  const router = useRouter()

  const curlSnippet = `curl -X POST http://localhost:3001/v1/events/llm-usage \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "events": [{
      "provider": "openai",
      "model": "gpt-4o",
      "tokens_input": 1500,
      "tokens_output": 400,
      "feature_key": "chat",
      "latency_ms": 1200
    }]
  }'`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Send your first event</h2>
        <p className="mt-1 text-sm text-slate-500">
          Try sending a test event using curl, then head to the dashboard to see it.
        </p>
      </div>

      <div className="relative">
        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed">
          {curlSnippet}
        </pre>
        <div className="absolute right-3 top-3">
          <CopyButton value={curlSnippet} />
        </div>
      </div>

      <Button variant="primary" onClick={() => router.push('/overview')}>
        Go to dashboard
      </Button>
    </div>
  )
}
