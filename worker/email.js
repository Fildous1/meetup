import { escapeHtml } from './lib.js'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'MeetUp <noreply@filiprosa.cz>'

/**
 * Upozorní tvůrce události na novou odpověď.
 * Bez nastaveného RESEND_API_KEY se e-maily tiše přeskočí, aplikace funguje dál.
 */
export async function sendNewResponseEmail(env, { event, participantName }) {
  if (!env.RESEND_API_KEY || !event.creator_email) return

  const baseUrl = (env.APP_BASE_URL || '').replace(/\/$/, '')
  const summaryUrl = `${baseUrl}/#/${event.code}/results`
  const unsubscribeUrl =
    `${baseUrl}/api/unsubscribe?code=${encodeURIComponent(event.code)}` +
    `&email=${encodeURIComponent(event.creator_email)}`

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM || DEFAULT_FROM,
        to: [event.creator_email],
        subject: `New response for "${event.name}"`,
        html: buildHtml({
          eventName: escapeHtml(event.name),
          participantName: escapeHtml(participantName),
          logoUrl: `${baseUrl}/logo-black.png`,
          summaryUrl,
          unsubscribeUrl,
        }),
      }),
    })

    if (!response.ok) {
      console.error('Email notification failed', response.status, await response.text())
    }
  } catch (error) {
    console.error('Email notification failed', error)
  }
}

function buildHtml({ eventName, participantName, logoUrl, summaryUrl, unsubscribeUrl }) {
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f4f4f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <img src="${logoUrl}" alt="MeetUp" style="height: 28px; margin-bottom: 24px;" />
    <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #18181b;">New response from ${participantName}</h2>
    <p style="color: #71717a; font-size: 14px; margin: 0 0 24px 0;">Someone responded to your event <strong>${eventName}</strong>.</p>
    <a href="${summaryUrl}" style="display: inline-block; padding: 10px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">View Results</a>
    <p style="margin: 32px 0 0 0; font-size: 11px; color: #a1a1aa; text-align: center;">
      <a href="${unsubscribeUrl}" style="color: #a1a1aa; text-decoration: underline;">I don't want to receive these notifications</a>
    </p>
  </div>
</body>
</html>`
}
