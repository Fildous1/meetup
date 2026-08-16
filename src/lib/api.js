const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

export function createEvent(payload) {
  return request(`${BASE}/events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getEvent(code) {
  return request(`${BASE}/events?code=${encodeURIComponent(code)}&_t=${Date.now()}`)
}

export function checkName(code, name) {
  return request(
    `${BASE}/responses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}&_t=${Date.now()}`
  )
}

export function saveResponse(code, participantName, availability, comment, isEdit = false) {
  return request(`${BASE}/responses`, {
    method: 'POST',
    body: JSON.stringify({
      code,
      participant_name: participantName,
      availability,
      comment: comment || '',
      is_edit: isEdit,
    }),
  })
}
