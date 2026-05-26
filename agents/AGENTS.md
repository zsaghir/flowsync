# FlowSync — Codex Context

## What this is
Pomodoro / productivity app. Timer (pomodoro + break + stopwatch), task list, user accounts. Everything runs inside a single Next.js process — no external services.

## Stack
- **Next.js 16** (App Router, `output: standalone`)
- **React 19**, TypeScript, Tailwind v4
- **pixel-retroui** — all UI components (Card, Button, Input, Popup, DropdownMenu)
- **bcryptjs** — password hashing (cost 10)
- **jsonwebtoken** — 30-day JWT sessions stored in localStorage
- No Firebase, no PocketBase, no separate auth server

## How to run
```bash
npm run dev          # development
docker-compose up --build   # production (single container)
```

## Auth flow
1. `POST /api/auth/register` — bcrypt hashes password, writes user to `data/db.json`, returns JWT
2. `POST /api/auth/login` — bcrypt.compare, returns JWT
3. Client stores `{ user, token }` in localStorage via `Contexts.tsx`
4. All protected API routes read `Authorization: Bearer <token>` header via `lib/auth.ts → getAuthUserId()`

## Database (`data/db.json`)
Single JSON file on disk, read/written synchronously by `lib/db.ts`.
```json
{
  "users":  [{ "id", "email", "passwordHash" }],
  "tasks":  [{ "id", "title", "completed", "userId" }],
  "timers": [{ "userId", "mode", "seconds", "isRunning", "lastSaved" }]
}
```
- `data/db.json` is gitignored; `data/.gitkeep` keeps the directory tracked
- In Docker the `app_data` volume mounts `/app/data` so the file persists

## Timer state persistence
- `lib/db.ts → getTimer / saveTimer`
- `app/api/timer/route.ts` — GET returns saved state, PUT saves it
- `Timer.tsx` loads on user login, calculates drift (`Date.now() - lastSaved`):
  - Countdown: subtract drift from remaining seconds
  - Stopwatch: add drift to elapsed
- Saves on every start/pause/stop/mode-switch + every 30 s while running

## Key files
```
app/
  page.tsx                        — root page, SettingsContext provider
  components/
    buttons.tsx                   — PlayButton, PauseButton, Break
    Contexts.tsx                  — auth + settings contexts
    Timer.tsx                     — owns ALL timer state incl. stopwatch
    Stopwatch.tsx                 — pure display component, no internal state
    Tasks.tsx                     — guest (in-memory) task list
    user/
      UserProfile.tsx             — login/register popup + logout
      userTasks.tsx               — authenticated task list (calls /api/tasks)
  api/
    auth/login/route.ts
    auth/register/route.ts
    tasks/route.ts
    tasks/[id]/route.ts
    timer/route.ts
lib/
  db.ts                          — read/write data/db.json
  auth.ts                        — signToken, verifyToken, getAuthUserId
  pixel-retroui-setup.js         — imports pixel-retroui CSS/fonts (needed by layout.tsx)
DockerFile                        — 3-stage Next.js build
docker-compose.yml                — single app service + app_data volume
```

## Stopwatch break mapping
| Worked    | Break earned |
|-----------|-------------|
| < 25 min  | 5 min       |
| < 30 min  | 6 min       |
| < 40 min  | 10 min      |
| < 60 min  | 15 min      |
| ≥ 60 min  | 20 min      |

## Design tokens (pixel-retroui theme)
| Token | Value |
|-------|-------|
| Page bg | radial-gradient `#e3ddc6` |
| Header / buttons | `#D6DAC8` |
| Timer card | `#9CAFAA` |
| Text / borders | `#30210b` |
| Accent (play btn) | `#D6A99D` |

## What was deliberately removed
- Firebase (auth + Firestore)
- PocketBase
- MUI / @emotion / motion
- ESLint
- Google OAuth — email/password only, no third-party auth
- `app/Timer/page.tsx` — was a pointless wrapper
- `app/storage/helper.ts` — dead code

## Working style notes
- Keep answers short when the user asks a question without asking for changes
- Don't add error handling, fallbacks, or abstractions beyond what's needed
- No comments unless the WHY is non-obvious
- User prefers minimal implementations — avoid extra packages
