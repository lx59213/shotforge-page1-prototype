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
- `src/index.html`: app shell for login, collapsible sidebar, project home, material library, new script input, full script document, Skill management, account settings, and admin backend.
- `src/assets/`: local SVG model logos so the prototype never depends on CDN icon loading.
- `src/styles/tokens.css`: color themes, typography, spacing, motion, and contrast tokens.
- `src/styles/shell.css`: reset, login, base navigation rail, topbar, buttons, modal, and responsive shell.
- `src/styles/sidebar.css`: account popover, sidebar icons, collapsed rail behavior, and lower-left account polish.
- `src/styles/app.css`: composer, script document, project library, material library, admin backend, and microinteractions.
- `src/styles/flow.css`: current stage layout, Laper-style project cards, Aura-style input menus, Skill page, material page, settings theme picker, and independent scroll rules.
- `src/scripts/data.js`: accounts, account types, real model labels, skill presets, mock material library, seed projects, and script sections.
- `src/scripts/sidebar.js`: pure sidebar markup for rail projects and account popover.
- `src/scripts/app.js`: single-page state, permissions, native file upload, model selection, Skill CRUD, Prompt input, generation, script editing, save, export, and backend flows.

## Boundaries

The entry journey is login -> project home -> new script or existing script -> drag/click upload, pick library material, or paste material -> optional one-line Prompt -> choose Skill and model from input menus -> generate script -> full-width script document -> edit, tune by modal, save, export. Later image, production, and editing stages stay outside this app shell.

## Decisions

Project home is the first work surface. New script input and generated script document are separate stages, so upload controls never fight with script editing. The rail follows the cleaner YouMind/Laper pattern: project, material library, Skill, admin when allowed, and a bottom-left account popover. Account type is configured in the backend as admin, writer, or client; admin receives a backend navigation entry and can change other accounts, reset passwords, and configure or delete model API keys. Skill is a reusable instruction object with add/edit/delete; Prompt is a one-line per-run direction and never shares the same field.

## Change Log

- 2026-06-03: Created deployable HTML app after Paper MCP quota blocked further canvas work.
- 2026-06-04: Re-scoped the app to customer material -> editable text script.
- 2026-06-04: Rebuilt the entry journey around new project creation, compact model/skill controls, and admin-configured account types.
- 2026-06-04: Renamed the visible product to Scriptly, fixed homepage line-breaking rules, and moved settings/account access into the lower-left system area.
- 2026-06-04: Added native drag/click upload, real model-version icon picker, collapsible sidebar, separated Skill CRUD from one-line Prompt, and moved generated scripts into a full-width document stage.
- 2026-06-04: Localized model logo SVGs to remove CDN failures in browser previews.
- 2026-06-04: Removed quick task/search/recent-project rail, made project home the default route, moved Skill into a full management page, moved themes into settings, and added nested input menus for Skill/file/model.
- 2026-06-04: Added material library as its own rail entry, moved Prompt above the customer material box, tightened project cards and spacing tokens, changed per-section optimization to a modal flow, and added model API deletion.
- 2026-06-05: Centralized collapsed sidebar behavior in `sidebar.css` so rail labels leave layout instead of leaking past the narrow rail.
