### TECH STACK CONSTRAINTS (Target: Cloudflare Workers):
- Backend: Cloudflare Worker (ES modules, no dependencies). All SQL runs through prepared statements (`env.DB.prepare(...).bind(...)`).
- Database: Cloudflare D1 (SQLite), binding `DB`, database `meetup-db` (region WEUR).
- Frontend: React with Tailwind CSS (Single Page Application), built by Vite into `dist/` and served by the same Worker via the `ASSETS` binding.
- Routing: Use HashRouter (all app routes live behind `/#/`, so the Worker only serves `index.html` and `/api/*`).
- E-mail: optional, přes Resend API (secret `RESEND_API_KEY`). Bez klíče se notifikace přeskočí.

### CORE FEATURES:
1. **Landing Page:** Create event with fields: Event Name, Description, Creator Name, and Suggested Date.
2. **Event Logic:** - Generate a unique 6-character alphanumeric code for each event (e.g., `meetup.filiprosa.cz/#/aB3dE6`).
   - Store events and participant responses in D1.
3. **Event Detail Page (The Grid):**
   - User enters their name. If the name exists, ask: "Overwrite existing?" or "Create new (e.g. Name 2)".
   - Display a monthly calendar view based on the Suggested Date.
   - **Tri-state Toggle Logic:** Each day cycles through: Neutral (Gray, default) -> Busy (Red) -> Ideal (Green) on click.
   - **Onboarding:** First-time visitors see a brief, subtle animation explaining the click-to-cycle mechanic (use localStorage to track visits).
   - Auto-save or a "Save My Availability" button.

### DESIGN SPECIFICATIONS:
- Modern, minimalist aesthetic. High-quality typography (Inter or Geist).
- Full Dark/Light mode support (system preference by default).
- Mobile-first approach: The calendar must be usable on touch screens.
- Smooth transitions and micro-interactions.

### PROJECT STRUCTURE:
- `/worker` - Cloudflare Worker: `index.js` (router), `events.js`, `responses.js`, `unsubscribe.js`, `email.js`, `lib.js`.
- `/src` - React frontend source.
- `schema.sql` - D1 schema for events and responses.
- `wrangler.jsonc` - Worker name, D1 binding, static assets, vars.

### API (all under `/api`, `.php` suffix still accepted for old links):
- `POST /api/events` → `{ code }`; `GET /api/events?code=` → event + responses.
- `GET /api/responses?code=&name=` → `{ exists }`; `POST /api/responses` → upsert odpovědi.
- `GET /api/unsubscribe?code=&email=` → HTML potvrzení, smaže `creator_email`.

### LOCAL DEV:
- `npm run db:setup` (jednou) → schéma do lokální D1.
- `npm run dev:api` (Worker na :8787) + `npm run dev` (Vite na :5173, proxy `/api`).

### DEPLOY:
- Push do `main` → Cloudflare Workers Builds (build `npm run build`, deploy `npx wrangler deploy`).
- Ručně: `npm run deploy`. Migrace schématu: `npm run db:setup:remote`.