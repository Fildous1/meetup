import { fail, json, param, readJson, str } from './lib.js'
import { sendNewResponseEmail } from './email.js'

const LIMITS = {
  participantName: 100,
  comment: 1000,
  days: 400,
  state: 20,
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export async function saveResponse(request, env, ctx) {
  const input = await readJson(request)
  if (!input) return fail('Invalid request body.', 400)

  const code = str(input.code)
  const participantName = str(input.participant_name)
  const comment = str(input.comment)
  const availability = sanitizeAvailability(input.availability)
  const isEdit = Boolean(input.is_edit)

  if (code === '' || participantName === '' || !availability) {
    return fail('Code, participant name, and availability are required.', 400)
  }
  if (participantName.length > LIMITS.participantName) return fail('Name is too long.', 400)
  if (comment.length > LIMITS.comment) return fail('Comment is too long.', 400)

  const event = await env.DB.prepare('SELECT id, code, name, creator_email FROM events WHERE code = ?')
    .bind(code)
    .first()

  if (!event) return fail('Event not found.', 404)

  await env.DB.prepare(
    `INSERT INTO responses (event_id, participant_name, availability, comment)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (event_id, participant_name) DO UPDATE SET
       availability = excluded.availability,
       comment      = excluded.comment,
       updated_at   = datetime('now')`,
  )
    .bind(event.id, participantName, JSON.stringify(availability), comment || null)
    .run()

  // Notifikace jen u nové odpovědi, ne u úprav — a nikdy nezdržuje odpověď klientovi.
  if (!isEdit && event.creator_email) {
    ctx.waitUntil(sendNewResponseEmail(env, { event, participantName }))
  }

  return json({ success: true })
}

export async function checkParticipantName(request, env) {
  const url = new URL(request.url)
  const code = param(url, 'code')
  const name = param(url, 'name')

  if (code === '' || name === '') return fail('Code and name are required.', 400)

  const match = await env.DB.prepare(
    `SELECT 1 FROM responses r
     JOIN events e ON e.id = r.event_id
     WHERE e.code = ? AND r.participant_name = ?`,
  )
    .bind(code, name)
    .first()

  return json({ exists: match !== null })
}

/** Propustí jen mapu "YYYY-MM-DD" -> krátký stav; jinak null. */
function sanitizeAvailability(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const entries = Object.entries(value)
  if (entries.length > LIMITS.days) return null

  for (const [day, state] of entries) {
    if (!DATE_PATTERN.test(day)) return null
    if (typeof state !== 'string' || state.length > LIMITS.state) return null
  }

  return Object.fromEntries(entries)
}
