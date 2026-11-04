# EDH Tracker — Codex instructions

## Project map

- `src/` is the React/Vite PWA. `main.py` is the Flask API; it stores current data in Neon Postgres.
- `public/stats/` contains static stats pages served with the frontend.
- `schema.sql` defines a fresh database. `scripts/migrations/` records deployed schema changes; `scripts/backfill_postgres.py` is a historical Sheets import tool.
- `CONTEXT.md` records architecture decisions and debugging history. Read only the sections relevant to the task, especially before changing game layout, rotation, offline behavior, or database identity/history.
- Reusable Neon agent skills are in `.agents/skills/`.

## Working rules

- Preserve existing local changes and do not overwrite user work.
- For UI positioning or orientation changes, use rendered evidence when available; the app is rotated and CSS axes do not match screen directions. Consult the rotation sections in `CONTEXT.md`.
- Keep game-history snapshots distinct from stable database identity. Decks are archived rather than deleted; review the database sections in `CONTEXT.md` before changing these rules.
- Keep `localStorage` reads guarded with safe fallbacks so corrupt or blocked storage cannot blank the app.
- Do not introduce demo mode or a second submission destination without an explicit request.
- Use the relevant project checks for the files changed: `npm run lint` and `npm run build` for frontend changes; the CI smoke test in `.github/workflows/ci.yml` for backend changes.
- Never run the backfill against production data. It truncates all application tables before importing.
