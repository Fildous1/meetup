import { createEvent, getEvent } from './events.js'
import { fail, preflight } from './lib.js'
import { checkParticipantName, saveResponse } from './responses.js'
import { unsubscribe } from './unsubscribe.js'

const ROUTES = {
  events: { GET: getEvent, POST: createEvent },
  responses: { GET: checkParticipantName, POST: saveResponse },
  unsubscribe: { GET: unsubscribe },
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (!url.pathname.startsWith('/api/')) {
      return serveApp(request, env)
    }

    if (request.method === 'OPTIONS') return preflight()

    // Přípona .php zůstává funkční kvůli odkazům ve starých e-mailech a záložkách.
    const route = url.pathname.slice('/api/'.length).replace(/\.php$/, '')
    const handlers = ROUTES[route]

    if (!handlers) return fail('Not found.', 404)
    if (!handlers[request.method]) return fail('Method not allowed.', 405)

    try {
      return await handlers[request.method](request, env, ctx)
    } catch (error) {
      console.error(`${request.method} ${url.pathname} failed`, error)
      return fail('Internal server error.', 500)
    }
  },
}

async function serveApp(request, env) {
  const response = await env.ASSETS.fetch(request)
  if (response.status !== 404) return response

  // SPA běží na HashRouteru, takže vše ostatní obsloužíme indexem.
  return env.ASSETS.fetch(new URL('/index.html', request.url))
}
