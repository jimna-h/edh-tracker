# EDH Tracker

A mobile-first Commander life and game tracker. The frontend is a React/Vite PWA; the API is Flask with Neon Postgres.

## Backend setup

Install the backend dependencies and start the local API:

```sh
uv sync
uv run python main.py
```

The API listens on port `8000`. Python `3.12` is selected by `.python-version`. The project is an application, not an installable Python package.

The Render deployment still installs from `requirements.txt`; keep its runtime dependencies aligned with `pyproject.toml`. CI checks the uv lockfile with `uv sync --locked`.

## Historical Sheets backfill

The one-time importer has extra dependencies that are excluded from a normal sync:

```sh
uv sync --extra backfill
uv run --extra backfill python scripts/backfill_postgres.py
```

The backfill truncates the application tables before importing. Do not run it against a database containing production data.

## Frontend setup

```sh
npm install
npm run dev
```

Use `npm run lint` and `npm run build` for the frontend checks.
