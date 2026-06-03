# Prototype Architecture

`prototype/` is the deployable Page 1 HTML prototype for ShotForge.

## Tree

- `server.mjs`: tiny dependency-free Node server with static hosting and mock API routes.
- `index.html`: GitHub Pages entry that redirects to the static prototype.
- `api/generate.js`: Vercel mock endpoint for storyboard generation.
- `api/save.js`: Vercel mock endpoint for saving a confirmation version.
- `vercel.json`: rewrites static assets and API routes for online preview.
- `package.json`: start scripts for local or server deployment.
- `src/index.html`: app shell and all prototype screens.
- `src/styles/tokens.css`: design tokens, theme variants, color contrast rules.
- `src/styles/shell.css`: base reset, login, app shell, rail, topbar, and shared chrome.
- `src/styles/app.css`: workspace views, storyboard table, library, export, and microinteractions.
- `src/scripts/data.js`: mock project, model, library, and storyboard data.
- `src/scripts/app.js`: simulated workflow, permissions, model dropdown, generation, drag sorting.

## Boundaries

This is not the production product. It is a high-fidelity interactive prototype for Page 1: brief to editable storyboard script. Mock APIs exist only to make the demo feel deployable and realistic.

## Decisions

The storyboard table is the artifact. AI, login, library, model choice, permissions, and export are quiet instruments around it. Customer-specific wording and brand colors must not become product identity.

## Change Log

- 2026-06-03: Created deployable HTML prototype after Paper MCP quota blocked further canvas work.
- 2026-06-04: Removed overbuilt visual layers; tightened MVP flow and added editable storyboard interactions.
- 2026-06-04: Added Vercel API shims so the deployed prototype keeps generation and save flows alive.
- 2026-06-04: Added a GitHub Pages root entry for static public preview.
