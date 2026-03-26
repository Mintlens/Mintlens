import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

interface SubscriptionData {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  usage: { requests: number }
  limits: { requests: number }
  hasStripeCustomer: boolean
}

interface UsageData {
  period: string
  requests: number
  limit: number
  percentUsed: number
  plan: string
}

interface InvoiceItem {
  id: string
  stripeInvoiceId: string
  amountPaid: number
  currency: string
  status: string
  invoiceUrl: string | null
  invoicePdf: string | null
  periodStart: string
  periodEnd: string
  createdAt: string
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiFetch<SubscriptionData>('/v1/billing/subscription'),
    staleTime: 60_000,
  })
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: () => apiFetch<UsageData>('/v1/billing/usage'),
    staleTime: 30_000,
  })
}

export function useInvoices(limit = 5) {
  return useQuery({
    queryKey: ['invoices', limit],
    queryFn: () => apiFetch<InvoiceItem[]>(`/v1/billing/invoices?limit=${limit}`),
  })
}

export function useCheckout() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/v1/billing/checkout', { method: 'POST' }),
    onSuccess: (data) => { window.location.href = data.url },
  })
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/v1/billing/portal', { method: 'POST' }),
    onSuccess: (data) => { window.location.href = data.url },
  })
}

export function useCancelSubscription() {
  return useMutation({
    mutationFn: () => apiFetch('/v1/billing/cancel', { method: 'POST' }),
  })
}

export function useResumeSubscription() {
  return useMutation({
    mutationFn: () => apiFetch('/v1/billing/resume', { method: 'POST' }),
  })
}
