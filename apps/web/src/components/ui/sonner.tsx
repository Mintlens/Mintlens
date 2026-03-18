'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white border border-slate-100 shadow-card text-sm text-slate-900',
          description: 'text-slate-500',
          actionButton: 'bg-mint-500 text-white',
          cancelButton: 'bg-slate-100 text-slate-600',
        },
      }}
    />
  )
}
