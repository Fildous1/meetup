import {
  daysBetween,
  fail,
  generateCode,
  isUniqueViolation,
  isValidDate,
  isValidEmail,
  json,
  param,
  readJson,
  str,
} from './lib.js'

const MAX_RANGE_DAYS = 92
const CODE_ATTEMPTS = 10

const LIMITS = {
  name: 255,
  description: 2000,
  creatorName: 100,
}

export async function createEvent(request, env) {
  const input = await readJson(request)
  if (!input) return fail('Invalid request body.', 400)

  const name = str(input.name)
  const description = str(input.description)
  const creatorName = str(input.creator_name)
  const creatorEmail = str(input.creator_email)
  const dateFrom = str(input.date_from)
  const dateTo = str(input.date_to)

  if (name === '') return fail('Event name is required.', 400)
  if (name.length > LIMITS.name) return fail('Event name is too long.', 400)
  if (description.length > LIMITS.description) return fail('Description is too long.', 400)
  if (creatorName.length > LIMITS.creatorName) return fail('Creator name is too long.', 400)

  if (dateFrom === '' || dateTo === '') return fail('Date range is required.', 400)
  if (!isValidDate(dateFrom) || !isValidDate(dateTo)) return fail('Invalid date format.', 400)
  if (dateFrom > dateTo) return fail('Start date must be before end date.', 400)
  if (daysBetween(dateFrom, dateTo) > MAX_RANGE_DAYS) {
    return fail('Date range cannot exceed 3 months.', 400)
  }

  if (creatorEmail !== '' && !isValidEmail(creatorEmail)) {
    return fail('Invalid email address.', 400)
  }

  const insert = env.DB.prepare(
    `INSERT INTO events (code, name, description, creator_name, creator_email, date_from, date_to)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )

  // Kolize kódu řeší databáze (UNIQUE), takže mezi kontrolou a zápisem nevznikne mezera.
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const code = generateCode()
    try {
      await insert
        .bind(
          code,
          name,
          description || null,
          creatorName || null,
          creatorEmail || null,
          dateFrom,
          dateTo,
        )
        .run()
      return json({ code }, 201)
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
    }
  }

  return fail('Could not generate unique code.', 500)
}

export async function getEvent(request, env) {
  const code = param(new URL(request.url), 'code')
  if (code === '') return fail('Event code is required.', 400)

  const [eventQuery, responsesQuery] = await env.DB.batch([
    env.DB.prepare(
      `SELECT code, name, description, creator_name, date_from, date_to, created_at
       FROM events WHERE code = ?`,
    ).bind(code),
    env.DB.prepare(
      `SELECT r.id, r.participant_name, r.availability, r.comment, r.updated_at
       FROM responses r
       JOIN events e ON e.id = r.event_id
       WHERE e.code = ?
       ORDER BY r.updated_at ASC, r.id ASC`,
    ).bind(code),
  ])

  const event = eventQuery.results[0]
  if (!event) return fail('Event not found.', 404)

  event.responses = responsesQuery.results.map((response) => ({
    ...response,
    availability: parseAvailability(response.availability),
  }))

  return json(event)
}

function parseAvailability(value) {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
