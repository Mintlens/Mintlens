'use client'

import { useState } from 'react'
import { StepCreateProject } from '@/components/onboarding/step-create-project'
import { StepApiKey } from '@/components/onboarding/step-api-key'
import { StepSendEvent } from '@/components/onboarding/step-send-event'
import { cn } from '@/lib/cn'

const STEPS = ['Create project', 'API key', 'Send event'] as const

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      {/* Step indicator */}
      <div className="mb-10 flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  i <= step
                    ? 'bg-mint-500 text-white'
                    : 'bg-slate-100 text-slate-400',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  i <= step ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 transition-colors',
                  i < step ? 'bg-mint-400' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-slate-100 bg-white p-7 shadow-card">
        {step === 0 && (
          <StepCreateProject
            onComplete={(id) => {
              setProjectId(id)
              setStep(1)
            }}
          />
        )}
        {step === 1 && projectId && (
          <StepApiKey
            projectId={projectId}
            onComplete={(key) => {
              setApiKey(key)
              setStep(2)
            }}
          />
        )}
        {step === 2 && apiKey && (
          <StepSendEvent apiKey={apiKey} />
        )}
      </div>
    </div>
  )
}
