import { Resend } from 'resend'
import { logger } from '../logger/logger.js'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env['RESEND_API_KEY'])
  return _resend
}

const FROM_EMAIL = process.env['FROM_EMAIL'] ?? 'noreply@mintlens.io'

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    return true
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, 'Failed to send email')
    return false
  }
}
