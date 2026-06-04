# Prototype Architecture

`prototype/` is the deployable Page 1 HTML prototype for ScriptForge.

## Tree

- `server.mjs`: dependency-free Node preview server with static hosting and mock script API routes.
- `index.html`: public entry that redirects to the static prototype under `src/`.
- `.gitignore`: keeps generated screenshots and macOS metadata out of the public repo.
- `api/generate.js`: Vercel mock endpoint for customer-material-to-script generation.
- `api/save.js`: Vercel mock endpoint for saving a script version.
- `vercel.json`: rewrites static assets and API routes for online preview.
- `package.json`: start scripts for local or server deployment.
- `src/index.html`: app shell for login, script workspace, project library, and settings.
- `src/styles/tokens.css`: color themes, typography, spacing, motion, and contrast tokens.
- `src/styles/shell.css`: reset, login, navigation rail, topbar, buttons, modal, and responsive shell.
- `src/styles/app.css`: script editor, project library, settings, progress states, and microinteractions.
- `src/scripts/data.js`: mock accounts, models, projects, materials, and script sections.
- `src/scripts/app.js`: single-page state, permissions, generation, editing, reorder, save, export, and library flows.

## Boundaries

This prototype only demonstrates Page 1: customer materials become editable text scripts. Image generation, later production stages, customer-facing review pages, and detailed production planning are outside this prototype.

## Decisions

The script document is the artifact. The library exists only to feed customer materials into that artifact. Account permissions are simulated as admin, normal use, and read-only, with admin-only password reset and permission controls in settings.

## Change Log

- 2026-06-03: Created deployable HTML prototype after Paper MCP quota blocked further canvas work.
- 2026-06-04: Removed overbuilt visual layers; tightened MVP flow and added editable script interactions.
- 2026-06-04: Added Vercel API shims so deployed previews keep generation and save flows alive.
- 2026-06-04: Added a public root entry for static preview.
- 2026-06-04: Re-scoped the prototype to customer material -> text script only, with account permissions and project library selection.
