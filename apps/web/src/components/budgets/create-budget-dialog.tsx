'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreateBudget, type CreateBudgetPayload } from '@/hooks/use-budgets'
import { ApiRequestError } from '@/lib/api-client'

interface CreateBudgetDialogProps {
  projectId: string
}

export function CreateBudgetDialog({ projectId }: CreateBudgetDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name:        '',
    scope:       'project' as CreateBudgetPayload['scope'],
    limitUsd:    '',
    period:      'monthly' as CreateBudgetPayload['period'],
    killSwitch:  false,
    thresholds:  '80',
  })
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useCreateBudget()

  const set = (k: keyof typeof form) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const limitMicro = Math.round(parseFloat(form.limitUsd) * 1_000_000)
    if (isNaN(limitMicro) || limitMicro <= 0) {
      setError('Please enter a valid budget limit')
      return
    }
    const thresholds = form.thresholds
      .split(',')
      .map((t) => parseInt(t.trim(), 10))
      .filter((t) => !isNaN(t) && t > 0 && t <= 100)

    try {
      await mutateAsync({
        projectId,
        name:             form.name,
        scope:            form.scope,
        limitMicro,
        period:           form.period,
        killSwitchEnabled: form.killSwitch,
        ...(thresholds.length > 0 ? { alertThresholds: thresholds } : {}),
      })
      setOpen(false)
      setForm({ name: '', scope: 'project', limitUsd: '', period: 'monthly', killSwitch: false, thresholds: '80' })
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create budget')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <Plus className="h-3.5 w-3.5" />
          New budget
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create budget</DialogTitle>
          <DialogDescription>Set a spend limit with optional alerts and kill switch.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="e.g. GPT-4 monthly limit" value={form.name} onChange={(e) => set('name')(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Scope</Label>
              <Select value={form.scope} onValueChange={(v) => set('scope')(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select value={form.period} onValueChange={(v) => set('period')(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="rolling_30d">30-day rolling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Limit (USD)</Label>
            <Input type="number" min="0.01" step="0.01" placeholder="100.00" value={form.limitUsd} onChange={(e) => set('limitUsd')(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Alert thresholds (%)</Label>
            <Input placeholder="50, 80, 95" value={form.thresholds} onChange={(e) => set('thresholds')(e.target.value)} />
            <p className="text-xs text-slate-400">Comma-separated values, e.g. 50, 80, 95</p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.killSwitch}
              onChange={(e) => set('killSwitch')(e.target.checked)}
              className="h-3.5 w-3.5 accent-mint-400"
            />
            <span className="text-sm text-slate-700">Enable kill switch (block requests at 100%)</span>
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
