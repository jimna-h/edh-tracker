# EDH Game and Stats Tracker

**A life-total and stats tracker for Commander (EDH) games, built for my playgroup.**

Commander is a 4-player Magic: The Gathering format built around tracking a lot of state at once: life totals, commander damage from each opponent, turn count, and end-of-game stats. Lifetap replaces the pen-and-paper version of that with a shared tablet/phone screen everyone can tap.

## Features

- **Seat setup** — pick each of the 4 players and their deck for the game, choose a mulligan rule
- **Live life totals** — tap-and-hold to rapid-adjust, starts at 40, color-coded as a player gets low or is eliminated
- **Commander damage tracking** — tracked per opponent, with support for partner commanders
- **Turn counter** — full-screen turn announcement between turns
- **Player/deck roster management** — add or remove players and decks, update profile art, synced to a shared Google Sheet so the whole group's data stays in one place
- **Post-game stats** — logs starting hand size, lands/rocks/dorks played, and how (or if) each player was eliminated
- **Demo mode** — a separate sandbox dataset so someone can try the app without touching the group's real stats

## Architecture

- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Flask API ([source](main.py)), deployed on Render, backed by Google Sheets via `gspread`/`google-auth` (one sheet for the player/deck roster, one for game stats)
- **Earlier prototype:** [`app.py`](app.py) is a Streamlit version built first, kept for reference — the Flask + React version replaced it as the live app once the UI needed more control than Streamlit made easy
