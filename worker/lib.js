const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...CORS_HEADERS,
    },
  })
}

export function fail(message, status) {
  return json({ error: message }, status)
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export function htmlPage(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

/** Vrátí objekt z těla requestu, nebo null při nevalidním JSONu. */
export async function readJson(request) {
  try {
    const data = await request.json()
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

/** Ekvivalent PHP trim() nad nejistým vstupem. */
export function str(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function param(url, key) {
  return str(url.searchParams.get(key))
}

const CODE_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode(length = 6) {
  // Horní hranice bez zbytku po dělení abecedou, aby žádný znak nebyl pravděpodobnější.
  const limit = 256 - (256 % CODE_ALPHABET.length)
  let code = ''
  while (code.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length))) {
      if (byte >= limit) continue
      code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
      if (code.length === length) break
    }
  }
  return code
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false
  // Date si přebytečné dny přetáčí (2026-02-31 -> 3. 3.), proto porovnáváme zpět.
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
}

export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 255
}

export function isUniqueViolation(error) {
  return /UNIQUE constraint failed/i.test(String(error?.message ?? error))
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
