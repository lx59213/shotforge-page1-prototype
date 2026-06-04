# App Architecture

`prototype/` is the deployable Scriptly static app.

## Tree

- `server.mjs`: dependency-free Node preview server with static hosting and mock script API routes.
- `index.html`: public entry that redirects to the static app under `src/`.
- `.gitignore`: keeps generated screenshots and macOS metadata out of the public repo.
- `api/generate.js`: Vercel mock endpoint for customer-material-to-script generation.
- `api/save.js`: Vercel mock endpoint for saving a script version.
- `vercel.json`: rewrites static assets and API routes for online preview.
- `package.json`: start scripts for local or server deployment.
- `src/index.html`: app shell for login, new project, project library, bottom-left settings/account access, and admin backend.
- `src/styles/tokens.css`: color themes, typography, spacing, motion, and contrast tokens.
- `src/styles/shell.css`: reset, login, navigation rail, topbar, buttons, modal, and responsive shell.
- `src/styles/app.css`: composer, script preview, project library, admin backend, and microinteractions.
- `src/scripts/data.js`: accounts, account types, models, skill presets, seed projects, and script sections.
- `src/scripts/app.js`: single-page state, permissions, project creation, skill configuration, generation, editing, save, export, and backend flows.

## Boundaries

The entry journey is login -> new project -> upload or paste material -> choose model and skill -> generate script -> edit, save, export. Later image, production, and editing stages stay outside this app shell.

## Decisions

The new project composer is the first work surface. Account type is configured in the backend as admin, writer, or client; admin receives a backend navigation entry and can change other accounts. Settings and account identity live in the lower-left system area, following the Aura sidebar grouping pattern.

## Change Log

- 2026-06-03: Created deployable HTML app after Paper MCP quota blocked further canvas work.
- 2026-06-04: Re-scoped the app to customer material -> editable text script.
- 2026-06-04: Rebuilt the entry journey around new project creation, compact model/skill controls, and admin-configured account types.
- 2026-06-04: Renamed the visible product to Scriptly, fixed homepage line-breaking rules, and moved settings/account access into the lower-left system area.
