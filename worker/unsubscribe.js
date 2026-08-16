import { htmlPage, param } from './lib.js'

export async function unsubscribe(request, env) {
  const url = new URL(request.url)
  const code = param(url, 'code')
  const email = param(url, 'email')

  if (code === '' || email === '') {
    return htmlPage(message('Invalid request.'), 400)
  }

  const result = await env.DB.prepare(
    'UPDATE events SET creator_email = NULL WHERE code = ? AND creator_email = ?',
  )
    .bind(code, email)
    .run()

  if (result.meta.changes === 0) {
    return htmlPage(message('Event not found or email does not match.'), 404)
  }

  return htmlPage(
    page(
      '<h2 style="margin: 0 0 12px 0; font-size: 18px; color: #18181b;">Unsubscribed</h2>' +
        '<p style="color: #71717a; font-size: 14px; margin: 0;">You will no longer receive email notifications for this event.</p>',
    ),
  )
}

function message(text) {
  return `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 40px; text-align: center;"><p>${text}</p></body></html>`
}

function page(content) {
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; background: #f4f4f5; text-align: center;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    ${content}
  </div>
</body>
</html>`
}
