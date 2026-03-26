import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY']

if (process.env['NODE_ENV'] === 'production' && !STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set in production')
}

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

export const STRIPE_WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] ?? ''
export const STRIPE_PRICE_PRO_MONTHLY = process.env['STRIPE_PRICE_PRO_MONTHLY'] ?? ''
export const APP_URL = process.env['APP_URL'] ?? 'http://localhost:3000'
