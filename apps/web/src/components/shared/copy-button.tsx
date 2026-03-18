'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/cn'

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  value: string
}

export function CopyButton({ value, className, ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      onClick={handleCopy}
      {...props}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  )
}
