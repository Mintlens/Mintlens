'use client'

import { useState } from 'react'
import { CreditCard, ExternalLink } from 'lucide-react'
import { useSubscription, useUsage, useInvoices, useCheckout, useBillingPortal, useCancelSubscription, useResumeSubscription } from '@/hooks/use-subscription'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PlanBadge } from '@/components/billing/plan-badge'
import { UsageMeter } from '@/components/billing/usage-meter'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { cn } from '@/lib/cn'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function SubscriptionTab() {
  const { data: sub, isLoading: loadingSub } = useSubscription()
  const { data: usage, isLoading: loadingUsage } = useUsage()
  const { data: invoiceList } = useInvoices(5)
  const checkout = useCheckout()
  const portal = useBillingPortal()
  const cancelSub = useCancelSubscription()
  const resumeSub = useResumeSubscription()
  const qc = useQueryClient()
  const [showCancel, setShowCancel] = useState(false)

  if (loadingSub || loadingUsage) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    )
  }

  const plan = sub?.plan ?? 'free'
  const isFree = plan === 'free'
  const isPro = plan === 'pro'

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <PlanBadge plan={plan} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {isFree ? 'Free' : isPro ? '$29' : 'Enterprise'}
                {isPro && <span className="text-sm font-normal text-slate-400">/month</span>}
              </p>
              {sub?.currentPeriodEnd && (
                <p className="mt-1 text-xs text-slate-400">
                  {sub.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isFree && (
                <button
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                  className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
                >
                  {checkout.isPending ? 'Redirecting…' : 'Upgrade to Pro'}
                </button>
              )}
              {isPro && !sub?.cancelAtPeriodEnd && (
                <>
                  <button
                    onClick={() => portal.mutate()}
                    disabled={portal.isPending}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
                  >
                    Manage Billing
                  </button>
                  <button
                    onClick={() => setShowCancel(true)}
                    className="rounded-xl border border-red-100 px-4 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </>
              )}
              {isPro && sub?.cancelAtPeriodEnd && (
                <button
                  onClick={() => {
                    resumeSub.mutate(undefined, {
                      onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscription'] }); toast.success('Subscription reactivated') },
                      onError: () => toast.error('Failed to reactivate'),
                    })
                  }}
                  disabled={resumeSub.isPending}
                  className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-mint-600 disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageMeter
            current={usage?.requests ?? 0}
            limit={usage?.limit ?? 0}
            label="requests this period"
          />
        </CardContent>
      </Card>

      {/* Invoices */}
      {invoiceList && invoiceList.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Invoices</CardTitle>
              {sub?.hasStripeCustomer && (
                <button
                  onClick={() => portal.mutate()}
                  className="text-xs font-medium text-mint-500 hover:underline"
                >
                  View all
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {invoiceList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-slate-700">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-slate-700 font-medium">
                      ${(inv.amountPaid / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500',
                      )}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.invoicePdf && (
                        <a
                          href={inv.invoicePdf}
                          target="_blank"
                          rel="noopener"
                          className="text-xs text-slate-400 hover:text-mint-500"
                        >
                          <ExternalLink className="h-3.5 w-3.5 inline" /> PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Cancel dialog */}
      <ConfirmDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Cancel subscription"
        description="Your Pro plan will remain active until the end of the current billing period. After that, your account will be downgraded to the Free plan with reduced limits."
        confirmLabel="Cancel subscription"
        variant="danger"
        loading={cancelSub.isPending}
        onConfirm={() => {
          cancelSub.mutate(undefined, {
            onSuccess: () => {
              qc.invalidateQueries({ queryKey: ['subscription'] })
              toast.success('Subscription will be canceled at period end')
              setShowCancel(false)
            },
            onError: () => toast.error('Failed to cancel subscription'),
          })
        }}
      />
    </div>
  )
}
