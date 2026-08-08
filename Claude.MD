### TECH STACK CONSTRAINTS (Target: Wedos Shared Hosting):
- Backend: PHP 8.x (must use PDO for MySQL).
- Database: MySQL.
- Frontend: React with Tailwind CSS (Single Page Application).
- Routing: Use HashRouter (for easy deployment on shared hosting without complex .htaccess).

### CORE FEATURES:
1. **Landing Page:** Create event with fields: Event Name, Description, Creator Name, and Suggested Date.
2. **Event Logic:** - Generate a unique 6-character alphanumeric code for each event (e.g., `meetup.filiprosa.cz/#/aB3dE6`).
   - Store events and participant responses in MySQL.
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
- `/api` - PHP backend files (handling GET/POST requests).
- `/src` - React frontend source.
- `database.sql` - Schema for events and responses.

Please start by defining the database schema and then proceed to the API and Frontend. Ensure all PHP code is secure (prepared statements).