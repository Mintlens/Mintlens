import { Resend } from 'resend'
import { logger } from '../../../shared/logger/logger.js'

// Lazy singleton — avoids crash at startup when RESEND_API_KEY is not set (e.g. local dev)
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env['RESEND_API_KEY'])
  return _resend
}

const FROM_EMAIL = process.env['ALERT_FROM_EMAIL'] ?? 'alerts@mintlens.io'

export interface BudgetAlertPayload {
  budgetName:  string
  threshold:   number
  spentMicro:  number
  limitMicro:  number
  projectName: string
  recipient?:  string
}

function microToUsd(micro: number): string {
  return (micro / 1_000_000).toFixed(4)
}

export async function sendBudgetAlertEmail(payload: BudgetAlertPayload): Promise<void> {
  const to = payload.recipient ?? FROM_EMAIL // fallback to sender until user emails wired up
  const spentUsd = microToUsd(payload.spentMicro)
  const limitUsd = microToUsd(payload.limitMicro)
  const pct      = Math.round((payload.spentMicro / payload.limitMicro) * 100)

  try {
    await getResend().emails.send({
      from:    FROM_EMAIL,
      to,
      subject: `[Mintlens] Budget alert — ${payload.budgetName} at ${pct}%`,
      html: `
        <h2>Budget threshold reached</h2>
        <p>
          Your budget <strong>${payload.budgetName}</strong> for project
          <strong>${payload.projectName}</strong> has reached
          <strong>${pct}%</strong> of its limit.
        </p>
        <table>
          <tr><td>Spent</td><td>$${spentUsd}</td></tr>
          <tr><td>Limit</td><td>$${limitUsd}</td></tr>
          <tr><td>Threshold</td><td>${payload.threshold}%</td></tr>
        </table>
        <p>Log in to <a href="https://app.mintlens.io">Mintlens</a> to review your usage.</p>
      `,
    })
  } catch (err) {
    // Non-fatal — alert was already recorded in DB
    logger.error({ err, budgetName: payload.budgetName }, 'Failed to send budget alert email')
  }
}
