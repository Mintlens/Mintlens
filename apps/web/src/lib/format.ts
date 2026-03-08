const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const PCT = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

export const microToUsd = (micro: number) => micro / 1_000_000

export const formatUsd = (micro: number) => USD.format(micro / 1_000_000)

export const formatNumber = (n: number) => COMPACT.format(n)

export const formatPercent = (n: number) =>
  `${n >= 0 ? '+' : ''}${PCT.format(n / 100)}`

export const formatLatency = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
