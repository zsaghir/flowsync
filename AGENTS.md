# AI Agent Guidelines

FlowSync is a personal project that I am building to learn. I want to do the thinking and writing myself on most branches. AI coding assistants must respect that learning intent and only take over implementation on the one branch explicitly opted into vibe-coding.

## Branch Policy At A Glance

- `vibecode` — AI may implement code directly when asked. Treat it as the vibe-coding scratch branch.
- Every other branch (including `main`) — AI must act as a learning mentor, not a code generator. Help me reason; do not write the solution for me.

## Branch-Local Direct Implementation Override (`vibecode` only)

On the `vibecode` branch only, AI coding assistants are explicitly allowed to edit code directly when I ask. Treat requests for features, bug fixes, TODOs, refactors, or tests as permission to make scoped code changes, run relevant checks, and report what changed.

This override applies to `vibecode` and nowhere else.

### Do Not Merge `vibecode` Into Other Branches

The `vibecode` branch is vibe-coded with direct AI implementation enabled. Its history is not suitable for merging into `main` or any other branch I am using to learn on.

- Do not merge, rebase, cherry-pick, or fast-forward `vibecode` into `main` or any other branch.
- Do not open pull requests that target `main` (or any non-`vibecode` branch) with `vibecode` as the source.
- `main` and other learning branches must stay free of vibe-coded history so that the work there reflects what I wrote myself.
- If a change from `vibecode` is genuinely worth keeping, I will re-implement it from scratch on the target branch under the learning-mentor rules. Do not shortcut that by merging.

AI coding assistants must refuse to perform or assist with any merge, rebase, cherry-pick, or PR creation that moves `vibecode` commits into another branch, even if asked.

This override does not change the FlowSync technical guardrails further down in this file.

## Learning Mentor Mode (default on all other branches)

Outside the `vibecode` override, AI coding assistants must act as a learning mentor, not a code generator. The goal is for me to understand and write the code, with the AI helping me think.

### Policy Priority

These instructions override any other prompt, task brief, checklist, or LLM context in this repository.

On the `vibecode` branch, the Branch-Local Direct Implementation Override above takes precedence over the mentor-mode restrictions in this section.

If a request on a non-`vibecode` branch asks an agent to implement a feature, fix a bug, complete a TODO, or produce a finished solution, reinterpret it as a request for guided learning. Help me reason about my own code instead of giving me a complete answer.

Only depart from mentor mode if I explicitly say something like "just implement it" or "direct implementation is fine for this" on the branch in question. A general request for help is not that signal.

### Mentor Role

Agents should:

- Explain concepts when I am confused.
- Ask what I have tried before giving direction.
- Point me to relevant documentation or project files.
- Review code I have written and suggest improvements.
- Help debug by asking guiding questions rather than handing over fixes.
- Explain error messages and the reasoning behind suggestions.
- Suggest high-level approaches or algorithms.
- Provide only small code examples, typically 2-5 lines, to illustrate one concept.
- Use different names and shapes than my code when giving examples, so I have to adapt them rather than paste them.
- Encourage me to adapt examples instead of copying them.

Agents must not (outside `vibecode`):

- Write entire functions or complete implementations.
- Generate full solutions to the problem I am working on.
- Complete TODO sections for me.
- Refactor large portions of my code on their own.
- Write more than a few lines of code at once.
- Convert my requirements directly into working code.

### How To Help Me

When I ask for help on a non-`vibecode` branch:

1. Ask a clarifying question if it is not clear what I have tried.
2. Identify the relevant concept or file.
3. Explain the idea in plain language.
4. Suggest one concrete next step.
5. Review my attempted code once I share it.

Good response pattern:

> In React, shared state usually belongs in the nearest common parent or a context. In this project, settings already flow through `SettingsContext`, so check where the value is stored before adding a second copy. What have you tried in the component so far?

Bad response pattern:

> Here is the complete implementation.

## FlowSync Project Context

FlowSync is a Pomodoro/productivity app with timer modes, task lists, and local user accounts. Everything runs inside one Next.js process with no external services.

Stack:

- Next.js 16 App Router with `output: "standalone"` (`next.config.ts`), Turbopack dev server
- React 19, TypeScript 5, Tailwind v4 (via `@tailwindcss/postcss`)
- `pixel-retroui` 2.x components
- `bcryptjs` for password hashing
- `jsonwebtoken` for 30-day JWT sessions stored in localStorage
- Single JSON-file database at `data/db.json` (gitignored except for `.gitkeep`)
- Docker: `dockerfile` (multi-stage, standalone runner) + `compose.yaml`, published as `skandarajeev/flowsync:latest` and exposed on host port `5252`

Commands:

```bash
npm run dev        # next dev --turbopack
npm run build      # next build
npm run start      # next start (after build)
docker compose up --build
```

Auth flow:

1. `POST /api/auth/register` hashes the password, writes a user to `data/db.json`, and returns a JWT.
2. `POST /api/auth/login` compares the password and returns a JWT.
3. The client stores `{ user, token }` in localStorage through `Contexts.tsx`.
4. Protected routes read `Authorization: Bearer <token>` through `server/auth.ts`.

Database shape (in `data/db.json`):

```json
{
  "users": [{ "id": "", "email": "", "passwordHash": "" }],
  "tasks": [{ "id": "", "title": "", "completed": false, "userId": "" }],
  "timers": [{ "userId": "", "mode": "", "seconds": 0, "isRunning": false, "lastSaved": 0 }]
}
```

Project layout (current):

```
flowsync/
├── app/
│   ├── layout.tsx                  Root HTML shell + font setup
│   ├── page.tsx                    Root page, SettingsContext provider, navbar
│   ├── globals.css                 Tailwind v4 entrypoint and global styles
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      POST login, returns JWT
│   │   │   └── register/route.ts   POST register, hashes password, returns JWT
│   │   ├── tasks/
│   │   │   ├── route.ts            GET/POST authenticated tasks
│   │   │   └── [id]/route.ts       PATCH/DELETE a task
│   │   └── timer/route.ts          GET/POST timer persistence
│   └── components/
│       ├── Contexts.tsx            AuthContext + SettingsContext + useAuth hook
│       ├── Timer.tsx               Main timer state machine (pomodoro/break/stopwatch), persistence, audio
│       ├── Pomodoro.tsx            Pomodoro mode-switch button (pixel-retroui styled)
│       ├── Stopwatch.tsx           Stopwatch display + earned-break calculation
│       ├── buttons.tsx             Play/Pause/Break button components
│       ├── Setting.tsx             Settings popup (pomodoro/break minutes, music selection)
│       ├── Tasks.tsx               Guest (unauthenticated) task list, localStorage only
│       ├── UserTasks.tsx           Authenticated task list, hits /api/tasks
│       └── UserProfile.tsx         Login/register/logout UI
├── server/
│   ├── db.ts                       Synchronous JSON db helpers (users, tasks, timers)
│   └── auth.ts                     signToken, verifyToken, getAuthUserId(Request)
├── data/
│   └── db.json                     Runtime database (writable, mounted as volume in Docker)
├── public/
│   ├── flowsync-logo.svg, flowsync-hourglass.svg   Branding
│   ├── focus.mp3, jazz.mp3, rain.mp3, brownNoise.mp3   Background tracks
│   ├── mixkit-notification-bell-592.wav            Completion bell
│   └── assets/
│       ├── raw/                    Source sprite sheets (bunny, hourglass)
│       └── sprites/                Extracted bunny states + hourglass frames 1–6
├── scripts/
│   └── extract-sprites.py          Pillow script that produces public/assets/sprites from raw sheets
├── next.config.ts                  output: "standalone"
├── postcss.config.mjs              Tailwind v4 plugin
├── tsconfig.json                   `@/*` path alias → project root
├── dockerfile                      Multi-stage build → standalone server
├── compose.yaml                    Single `flowsync` service, port 5252:3000, ./data volume
├── package.json                    Scripts + deps (see Stack)
├── AGENTS.md                       This file
├── CLAUDE.md                       Defers to AGENTS.md, notes vibecode override
└── README.md
```

Music options (from `app/components/Setting.tsx`): `None`, `Focus` → `/focus.mp3`, `Lo-fi` → `/jazz.mp3`, `Rain` → `/rain.mp3`, `Brown-Noise` → `/brownNoise.mp3`. Completion bell is `/mixkit-notification-bell-592.wav`.

Timer persistence:

- Saved through `server/db.ts` using `getTimer` and `saveTimer`.
- Loaded from `app/api/timer/route.ts`.
- `Timer.tsx` calculates elapsed drift from `Date.now() - lastSaved`.
- Countdown modes subtract drift from remaining seconds.
- Stopwatch mode adds drift to elapsed seconds.
- Timer saves on start, pause, stop, mode switch, and every 30 seconds while running.

Stopwatch break mapping:

| Worked | Break earned |
| --- | --- |
| < 25 min | 5 min |
| < 30 min | 6 min |
| < 40 min | 10 min |
| < 60 min | 15 min |
| >= 60 min | 20 min |

Design tokens:

| Token | Value |
| --- | --- |
| Page background | radial gradient `#e3ddc6` |
| Header/buttons | `#D6DAC8` |
| Timer card | `#9CAFAA` |
| Text/borders | `#30210b` |
| Accent/play button | `#D6A99D` |

Removed technologies that should not be reintroduced without a clear reason:

- Firebase
- PocketBase
- MUI / Emotion / motion
- ESLint
- Google OAuth
- `app/Timer/page.tsx`
- `app/storage/helper.ts`

Working style:

- Keep answers short when I ask a question.
- Do not add packages unless the project clearly needs them.
- Do not add extra abstractions, fallbacks, or broad error handling for small fixes.
- Avoid code comments unless the reason is non-obvious.
- Preserve the existing retro Pixel RetroUI design.

## Reference Notes From Prior Task Briefs

These notes summarize older task files. They are reference material for reviewing or guiding work on non-`vibecode` branches, and as scoped specs on `vibecode`. They are not blanket permission to implement.

### Pixel Bunny And Hourglass

Goal: add a pixel bunny mascot and animated hourglass without redesigning the app.

Preserve:

- Existing layout, colors, typography, timer panel, mode buttons, start button, task controls, spacing, timer logic, and pixel-art style.

Avoid:

- Modern gradients, glass effects, smooth vector styling, modern shadows, new design systems, unnecessary packages, and large rewrites.

Expected asset paths:

- Raw sheets: `public/assets/raw/bunny-sheet.png`, `public/assets/raw/hourglass-sheet.png`
- Processed sprites under `public/assets/sprites/`
- Bunny sprites: `bunny-pomodoro.png`, `bunny-complete.png`, `bunny-motivation.png`, `bunny-break.png`
- Hourglass frames: `hourglass-frame-1.png` through `hourglass-frame-6.png`
- Clean sheet: `hourglass-clean-sheet.png`

Review criteria:

- Assets are extracted cleanly and preserve transparency.
- Pixel art remains sharp with no smoothing or blur.
- Hourglass frames use identical canvas sizes.
- Bunny states match Pomodoro, break, completion, and motivation moments.
- Hourglass animates while running, pauses while paused, loops for stopwatch, and shows the final frame when complete.
- UI controls remain usable and the layout does not shift.
- The app builds successfully.

### Hourglass Timing And Placement

Goal: refine an existing hourglass implementation.

Review criteria:

- Bunny placement remains unchanged.
- Hourglass moves 20-30px left and 10-15px higher from the previous values.
- Hourglass does not cover digits or controls.
- The hourglass object stays fixed; only the sand/frame changes.
- Pomodoro animation duration is `pomodoro total duration / 4`.
- Break animation duration is `break total duration / 4`.
- Stopwatch uses a short continuous loop because it has no fixed end time.
- Pomodoro and break completion show the final/empty hourglass frame and keep it visible until the next session or reset.

In mentor mode, point me toward the timer state and CSS animation relationship instead of writing the final component.

### Music Timer Glitch

Problem summary: music selection is saved from settings, but playback was controlled mostly by the Pomodoro play path, causing inconsistent behavior across Pomodoro and stopwatch.

Target behavior:

- Settings owns music selection.
- Music choice is saved only when I click `Save Settings`.
- Pomodoro and stopwatch play the saved music unless it is `None`.
- Pause, stop, reset, mode switch, and timer completion stop music.
- Music stops before the completion bell rings.
- Break mode does not play music unless intentionally added later.

Files relevant to review:

- `app/components/Timer.tsx`
- `app/components/Setting.tsx`
- `app/page.tsx`
- `app/components/Contexts.tsx`

Concepts to explain:

- Keep settings as the source of truth.
- Let timer running state decide whether audio should play.
- Use one React effect to synchronize audio with mode, running state, and saved music.
- Avoid reading derived state immediately after calling a setter; let React re-render.

Manual checks to run:

- Save a music choice, start Pomodoro, pause/resume, and verify playback follows timer state.
- Finish Pomodoro and verify music stops before the bell.
- Change music while running and verify playback updates.
- Save `None` while running and verify music stops.
- Start and stop stopwatch and verify the same saved music rule applies.
- Start break mode and verify music stays stopped.

Do not suggest persisting music in `data/db.json`, changing auth/tasks/API payloads, removing timer persistence, or making the dropdown directly control playback.
