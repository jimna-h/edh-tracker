# EDH Tracker — Project Context for Claude Code

This document exists so a fresh Claude Code session (or any fresh chat) can pick up
exactly where an extremely long prior conversation left off, without re-deriving or
re-breaking anything that was already solved. Read this in full before touching
anything — a huge fraction of the bugs fixed over that conversation came from
re-guessing something that was already known, especially around the rotation math
and the offline sync logic. Where this document says "confirmed," it means verified
against actual rendered screenshots or actual server logs, not theory. Where it says
something was tried and reverted, do not re-try it without new evidence.

## What this is

A mobile-first MTG Commander (EDH) life/game tracker for 4 players, built for a
specific friend group, deployed as an installable offline-capable PWA. React
frontend on Vercel, Flask backend on Render, **Neon Postgres as the database**
(migrated off Google Sheets/`gspread` — see "Postgres migration — completed"
near the end for the full story, schema, and what's still true vs. obsolete
from the Sheets era).

Google Sheets still physically exists and holds the full historical record up
to the migration cutover, but **the live app no longer reads from or writes to
it at all** — treat any mention of Sheets elsewhere in this document as
historical context for *why* something is built the way it is, not as a
description of where data lives today.

There is a second, related but architecturally separate piece: a set of static
stats/leaderboard HTML pages (no build step, no framework) that now read from
the app's own backend (`GET /stats/data` + `GET /players`) instead of Sheets,
and live inside the same deployment, reachable from the Tracker's own Settings
menu. See "The stats pages" below.

## Repo structure

- `src/App.jsx`, `src/main.jsx`, `src/index.css` — the real, live frontend (Vite).
- `main.py` — Flask backend, deployed on Render. Talks to Postgres via `psycopg`.
- `schema.sql` — the Postgres schema (`players`, `decks`, `games`,
  `game_performance`). Run once against a fresh Neon database.
- `scripts/backfill_postgres.py` — one-time script that copied the live Sheets
  data into Postgres during the migration. Not part of the deployed app; needs
  `gspread`/`google-auth` installed separately (deliberately not in
  `requirements.txt`, since `main.py` itself doesn't need them anymore).
- `neon.ts` — Neon's own declarative project/branch config (provisioning-level:
  which services are enabled, branch TTL policy), unrelated to the app's own
  Postgres schema in `schema.sql`. Applied via `neon deploy`.
- `index.html` (repo root) — the Vite entry HTML. Was recently simplified: it used
  to read a `?key=` URL param to dynamically build the PWA manifest's `start_url`;
  that logic is gone now (see "The `?key=toski` removal" below) and it just emits a
  static manifest.
- `sw.js` (repo root, served from domain root) — service worker. Currently at
  `CACHE_NAME = 'mtg-tracker-v5'`.
- `public/stats/index.html`, `public/stats/player.html`, `public/stats/deck.html` —
  the stats pages, living inside this same repo/deployment (moved here
  specifically so the Tracker's service worker can cache them and so linking to
  them from Settings feels like staying in one product rather than leaving to a
  separate site).
- `public/stats/stats-shared.js` — the fetch/normalize logic shared by all three
  stats pages (see "The stats pages" below) — extracted into one file during the
  Postgres migration instead of staying hand-duplicated three times.
- The root also has stray, **dead/unused** `app.jsx`/`app.py` files left over from
  early repo setup. Ignore them; the real files are `src/App.jsx` and `main.py`.
- **Confirmed this session**: `life-totals` is the actual default/main branch for
  this repo (not `main`) — the earlier uncertainty about this is resolved.

## Deployment

- **Frontend**: Vercel, `edh-tracker-seven.vercel.app`.
- **Backend**: Flask on Render free tier — cold-starts after ~15min idle, takes
  30-60s to wake up. This looks identical to "offline" from the user's perspective.
  Render's free tier also serves its own "spinning up" loading page to connecting
  browsers *before* the Flask app is even running — this matters a lot, see the
  "false-positive sync success" saga below.
- **Database (current)**: Neon Postgres, connected via `psycopg`. See "Postgres
  migration — completed" near the end for the schema, connection setup, and the
  full story of how this replaced Sheets.
  - `DATABASE_URL` env var on Render — the **pooled** (`-pooler`) connection
    string, for normal app traffic. Schema changes/backfills use the
    **unpooled** string instead (`DATABASE_URL_UNPOOLED` locally via
    `neon env pull` / `.env.local`) — session-level operations like `ALTER
    TABLE` can misbehave over the pooled/PgBouncer connection.
  - The Render service may still have a leftover `GOOGLE_JSON` env var from the
    Sheets era — `main.py` no longer reads it (it doesn't import `gspread` at
    all anymore), so it's harmless if still set, safe to remove whenever.
  - Google Sheets (`1HfTUoLol3h1DmDeWTDsUqYTjq99SV9NGi-CmB3Wk89g` for
    players/decks, `18_9UkJ3MAsNw4ByOGFDqOBE2u1gnpxQSR3tPi-_9i3I` for
    `Game_Summary`/`Player_Performance`) still exist and hold the full history
    up to the migration cutover, kept deliberately as an untouched fallback
    reference — nothing reads from or writes to them anymore.
  - There used to be a second "demo" stats sheet and a `?key=toski` URL param that
    decided which one a submission went to. **This has been fully removed** — see
    below. Do not reintroduce a demo/practice mode without discussing it; it was
    explicitly proposed and explicitly rejected by the project owner in favor of
    "just trust that only people who should have access, have access."

## THE ROTATION ARCHITECTURE — read before touching any layout/positioning code

This remains the single most error-prone part of the codebase, exactly as it always
was. The whole app is visually rotated 90° via CSS transform so a phone held in
portrait shows a landscape "tabletop" view. CSS axes and visual/screen axes are
different. Getting this wrong turns every "move X left/right/up/down" instruction
into a 50/50 guess, and this happened repeatedly across the whole conversation this
document summarizes — including by Claude, more than once, despite having this
exact warning available. **When axis/rotation reasoning conflicts with an actual
screenshot or actual described symptom, trust the screenshot, not the theory.**
Several fixes this conversation were reached only by treating a hypothesis as
falsified the moment it contradicted direct evidence, not by re-deriving harder.

### The base rotation

```jsx
<div className="min-h-screen w-screen bg-black overflow-hidden">
  <div style={{
    width: '100svh', height: '100svw',       // dimensions swapped; svh/svw not vh/vw (see below)
    transform: 'rotate(90deg)',
    position: 'fixed', top: '50%', left: '50%', translate: '-50% -50%',
  }}>
    {/* grid content, everything else */}
  </div>
</div>
```

**Important, recently-fixed detail**: the root container used to use plain `vh`/`vw`
units. This was changed to `svh`/`svw` (small viewport units) after a real bug: on
mobile, plain `vh`/`vw` are computed against the *largest possible* viewport
(browser chrome collapsed), so navigating to the app fresh (e.g. clicking the
"back to Tracker" link from a stats page — a real full page load, not an in-app
route change) while the browser's address bar is still expanded rendered the
rotated content larger than the actually-visible screen, until a scroll/swipe
gesture forced the browser to recompute. `svh`/`svw` track the *current* actual
viewport instead. This is the same class of bug the cross-layout top/bot sizing
already had to solve once before (see below) — it just hadn't been applied to the
root container itself until it visibly broke navigation-from-stats-pages.

### Confirmed, tested axis mapping (2x2 grid mode)

- CSS **row** axis (left/right, width) → renders as visual **top/bottom** on screen
- CSS **column** axis (top/bottom, height) → renders as visual **left/right** on
  screen
- `flexDirection: 'column'` → renders as a **horizontal** row on screen (children
  stack top-to-bottom in CSS space, which after rotation reads left-to-right or
  right-to-left visually)
- `flexDirection: 'row'` → renders as a **vertical** stack on screen

### A padding-axis trap that cost real time this conversation

For a `flex-col` container, **padding-top/padding-bottom** control the gap between
the first/last child and the *screen edges* along the stacking axis (screen
left/right). **padding-left/padding-right** control the *crosswise* clearance
(screen top/bottom) by narrowing the block's width — this doesn't create "distance
from edge" the way padding-top/bottom does; it just shrinks how wide the content
column renders, which indirectly creates margin via centering.

**The specific trap**: if a flex-col's total content (title + scrollable options +
back button, in the setup-carousel case) is *already taller than the available
space*, the box gets centered and clipped by an ancestor's `overflow-hidden`.
Adding *more* padding to that box does **nothing visible** — it just grows the
invisible overflow on both ends symmetrically, while the visible clipped edge
never moves. This produced a real "increased padding, screenshot showed zero
change" result that took multiple rounds to correctly diagnose. **If a padding
change produces literally zero visible difference, that's strong evidence the
content itself needs to shrink, not that more padding is needed.** The eventual
fix for the setup-carousel titles touching the card edge was reducing the content's
own footprint (smaller title margins, smaller row gaps, smaller back-button
padding) — not touching padding on the outer container at all. Do not re-attempt
"just add more padding" for this class of symptom without checking total content
height against available space first.

Also do not attempt "narrow the container's width to add crosswise clearance" as a
fix for a similar symptom — this was tried once, appeared to partially work, but
turned out to have simultaneously broken the setup carousel's row-cutoff /
scrolling by shrinking the same axis that the multi-row button layout needed for
its own content. It was reverted. The two axes look similar in symptoms but are not
interchangeable fixes.

### Grid seats (2x2 mode)

- Seats 0 and 1 have `isFlipped = true` (get a `rotate-180` class on
  `QuadrantWrapper`); seats 2 and 3 do not.
- Gear icon / turn counter / etc. live in a shared overlay positioned via
  `top`/`left` offsets from `calc(50% ...)`.

### Cross-table layout — additional, separate rotation layer

Cross layout arranges 4 seats as a plus-sign: full-width strip on top, two seats
side-by-side in the middle, full-width strip on bottom. This requires an
*additional*, per-seat counter-rotation on top of the base 90° app rotation.

```jsx
// layoutConfig (cross mode) — seatIndex -> table position -> isFlipped
{ seatIndex: 0, area: 'top',  flipped: true  },
{ seatIndex: 1, area: 'midl', flipped: false },
{ seatIndex: 2, area: 'midr', flipped: false },
{ seatIndex: 3, area: 'bot',  flipped: false },

// crossRotationFix — per-area EXTRA rotation on top of the base 90°
const crossRotationFix = {
  top:  { deg: -90, width: '100svw', height: `${topBotWidthPct}svh` },
  bot:  { deg: -90, width: '100svw', height: `${topBotWidthPct}svh` },
  midl: { deg: 180, width: '100%',   height: '100%' },
  // midr: no entry at all — gets NO extra rotation
};
```

Uses `svh`/`svw` (small viewport units) for top/bot sizing specifically because
plain viewport units recalculate live as the mobile browser's address bar
shows/hides during scroll, which caused visible mid-scroll jitter on the top/bottom
seats — this was the original discovery of the svh/svw-vs-vh/vw issue, later found
to also apply to the root container (see above).

### ⚠️ `midl`/`midr` visual left/right is INVERTED from the names — still true

Despite the naming, the code's `'midl'` area ends up on the visually-**RIGHT** side
of the screen, and `'midr'` ends up on the visually-**LEFT** side. This was
discovered only via the color-coded-screenshot debugging technique, not theory, and
remains the standing recommendation: **if a left/right question matters for a
change here, get a fresh screenshot with an unambiguous test setup rather than
reasoning it out.**

### The commander damage modal rotation saga — a full case study in why "trust the screenshot" matters

This conversation built a small-screen (phone) full-screen commander damage modal,
replacing the old always-in-quadrant version for narrow viewports (see
"Commander damage: small-screen vs large-screen modal" below for the feature
itself). Getting its rotation correct for the cross-table `top`/`bot` seats took
**three separate attempts**, each corrected only by comparing actual rendered
screenshots against what should have appeared, never by re-deriving from the
formula alone:

1. **Attempt 1**: used `fixDeg = -90` for both `top` and `bot` (matching the real
   `crossRotationFix` constant exactly). Result: both seats showed the *opposite*
   orientation from correct, and top/bottom appeared swapped relative to each
   other.
2. **Attempt 2**: flipped the sign to `fixDeg = +90` for both. Result: this
   over-corrected — now the two seats were oriented in the *opposite* direction
   from each other again, in a different way (both now wrong, in a mirrored sense
   this time). Screenshots at this point showed the "ME" self-cell for one seat
   reading upright when it should have read upside-down (to match how that seat's
   own life-total/name already reads upside-down in the normal quadrant view), and
   vice versa for the other seat.
3. **Attempt 3 (current, confirmed correct)**: solved by working backward
   algebraically from the *actual observed* rendered angle vs. the *desired*
   rendered angle for both seats simultaneously (not from theory), which revealed a
   consistent, seat-independent offset between "what the formula computes" and
   "what actually renders." Correcting for that offset landed back on `fixDeg = -90`
   for both — i.e., matching the real `crossRotationFix` constant exactly, the same
   values Attempt 1 used. The bug was never really in the degree math; it was
   compounded by a **separate, real bug**: the width/height swap for the ±90°
   "swapped" rotation cases had `width`/`height` backwards (`100svh`/`100svw`
   instead of `100svw`/`100svh`), which was fixed at the same time. There was also
   a **third, independent bug**: the *opponent-cell grid-area assignment* for the
   `top` seat's own `CMD_AREA_MAP_BY_SEAT` row had `top`/`bot` literally swapped in
   the underlying shared data table (used by *both* the small-screen modal and the
   always-visible in-quadrant mini-grid) — described by the project owner as "a
   reflection problem, not a rotation problem," which was the correct diagnostic
   framing: a pure CSS `rotate()` can never produce "top/bottom swapped, left/right
   unchanged" — that specific symptom shape is only possible from a *data*-level
   swap, not a *transform*-level one. That distinction (rotation bug vs. data-swap
   bug produce different, diagnosable symptom *shapes*) is worth remembering
   generally.

**Takeaway for future rotation work**: if a fix appears to make things worse in a
way that looks like "everything flipped the other direction," don't assume you
picked the wrong sign — check whether there's a second, independent bug
(width/height swap, or a data-level area/index swap) compounding it. Solve by
comparing actual before/after screenshots pixel-by-pixel against what's expected,
not by re-deriving the transform math a fourth time.

## Backend (`main.py`)

### Schema (Postgres — see `schema.sql` for the literal DDL)

- `players(id, name, pfp_url, sort_order)` — `sort_order` exists purely to
  reproduce the old "tab order" behavior on `GET /players`.
- `decks(id, owner_id -> players.id, deck_name, art_url, art_url_partner,
  color_id, exclude, archidekt, row_order)`. `archidekt`/`art_url_partner`
  keep the same semantics as the old Sheets columns (`art_url_partner` is a
  real URL or the literal `'partner'` sentinel). The old checkbox-write gotcha
  and blank-row-hunting logic (`_find_next_blank_row`) no longer exist — real
  columns and real primary keys replace both workarounds.
- `games(id, mulligan_type, winner_seat_position, winner_player, winner_deck,
  turn_count, played_at)` — `id` keeps the old human-readable
  `G-YYYYMMDD-xxxx` format. Being a real primary key means a duplicate
  submission now fails cleanly with a `UniqueViolation` instead of silently
  double-logging — this is the exact structural fix the Sheets era couldn't
  have.
- `game_performance(id, game_id -> games.id, deck_id -> decks.id [nullable],
  player, deck, deck_owner, start_lands, lands, rocks, dorks, turn_died,
  seat_position, colors, art_url)`.
  - `deck`/`colors`/`art_url` are deliberately kept as point-in-time
    **snapshots**, not a live join to `decks` — a deck's art/name can change
    later, and old logged games should keep showing what was true when they
    were played. `colors`/`art_url` existing here at all was questioned once
    (looks like denormalization) but this is the intended pattern, same as an
    order-line-item snapshotting price at purchase time.
  - `deck_id` is a **separate, additional** stable reference (nullable — stays
    `NULL` for ad hoc "Other"/proxy decks typed in at game time, which never
    had a `decks` row to begin with). It's resolved at `/submit` time by
    matching `(deck_owner, deck)` against `decks(owner_id, deck_name)`
    case/whitespace-insensitively. Its `ON DELETE RESTRICT` (not `SET NULL` or
    `CASCADE`) means **a deck that's ever been played can no longer be
    hard-deleted** — `/players/delete_deck` (and `/players/delete_player`,
    transitively) now returns a `409` with a message pointing at the existing
    `Exclude` checkbox instead. This is what actually fixes the original
    failure mode that prompted adding `deck_id`: delete a played "Deck A",
    later create a new "Deck A" — under the old text-only identity, their
    histories would silently merge; now the old deck can't be deleted at all
    once played, so the collision can't happen.
  - Renaming a deck (`update_deck`) doesn't fork its stats history, since
    `deck_id` stays the same even though the `deck` text column on old rows
    keeps the pre-rename name (confirmed via direct test during the
    migration).

### Endpoints

- `GET /players` — all players + all decks (including excluded ones), pfp.
- `GET /stats/data` — `{games: [...], performance: [...]}`, field names chosen
  to exactly match what the stats pages' fetch/normalize layer already
  expects (see "The stats pages" below) — read by the stats pages, not by
  `src/App.jsx`.
- `POST /submit` — log a finished game. **This is now the only submission
  endpoint** — `/submit-demo` and the `STATS_ID_DEMO` sheet constant were both
  fully removed this conversation (see "The `?key=toski` removal" below).
- `POST /players/add_player`, `/delete_player`, `/add_deck`, `/update_deck`,
  `/delete_deck`, `/update_pfp` — same routes/request shapes as before the
  Postgres migration; internals rewritten, external contract unchanged
  (confirmed byte-for-byte against the live Sheets-backed backend before
  cutover, so `src/App.jsx` needed zero changes).

### The `?key=toski` removal — full story, in case it's ever proposed again

**Original design**: the frontend read `?key=` from the URL; `key === 'toski'`
meant "real," anything else meant "demo," routing to entirely separate Google
Sheets. The PWA's `index.html` also dynamically built the web manifest's
`start_url` around whatever `?key=` was present in the URL *at the moment
`index.html` loaded*, so that "Add to Home Screen" would preserve the key.

**What actually happened in production**: games kept landing in the demo sheet
even when the project owner insisted they were launching from a link that included
`?key=toski`. Investigated via actual Render server logs (not assumption) and
confirmed: some submissions had *zero* trace anywhere in the backend logs — not an
error, not a success, nothing — which pointed to Render's free-tier "spinning up"
loading page (served by Render's platform layer, before Flask/gunicorn is even
running) returning a response the frontend's `fetch()` treated as ambiguous/failed
before a fix was applied (see the sync-reliability section below for the actual
fix to *that* specific issue). Separately, and this is the part directly relevant
to the key removal: a plausible, never-fully-provable root cause was identified —
**a home-screen icon's `start_url` gets permanently baked in at the moment the icon
is created**, independent of which link was used to *reach* the page that day. If
that icon was ever created at a moment when `index.html`'s manifest-generation
script ran without `?key=` present — even once, even before the correct link had
ever been used on that device — every future tap of that icon launches with an
empty `location.search` forever, with no way for the person tapping it to notice,
because nothing about the icon itself changes.

**Decision**: rather than trying to harden a URL-param + dynamic-manifest
mechanism that had already demonstrated it could fail silently and
unrecoverably from the user's perspective, the project owner decided to remove it
entirely. A "Practice Mode" toggle (submit nothing anywhere, rather than submit to
a different destination) was proposed as a replacement way to let strangers try the
app safely, but **was explicitly rejected** — the owner's stated position: assume
only people who should have access to the app, have access, and don't add
UI/complexity to defend against a threat model that isn't real for this group. Do
not re-propose a demo/practice/second-destination mode without this context.

**Current state**: `src/App.jsx` has a single `SUBMIT_URL` constant, no branching.
`main.py` has only `/submit`. `index.html`'s manifest generation is a static
object, no `?key=` reading at all. Old links/shortcuts with `?key=toski` on them
**still work fine** — the app just ignores the unused query param now; there was
never a need to tell anyone to update a bookmark.

## Frontend offline-first sync architecture

This got extremely deep scrutiny this conversation after real, confirmed data-loss
incidents (a friend's phone submitted games that either silently never appeared on
the sheet, or appeared twice). What follows is the current, believed-correct
design, and the specific historical bugs that led to it — preserved so nobody
"fixes" something back into a previously-broken state.

### Two independent local-queue-and-sync systems

1. **`pendingGames`** (`localStorage['pending_mtg_games']`) — finished games.
2. **`pendingEdits`** (`localStorage['pending_mtg_edits']`) — player/deck
   management actions.

### `pendingGames` no longer auto-deletes on success

**This changed recently, deliberately.** It used to be that a successfully-synced
game was removed from the array entirely. The project owner asked for this to stop
— they wanted a persistent local record they could still see, not just clear.

Current design: each game object gets a `synced: false` field when created.
`syncPending()` only ever attempts games where `!g.synced`. On a *verified* success
(see next section), the entry is updated in place to `synced: true` — never
removed. Nothing removes a game automatically anymore. The `hasPending` UI flag and
the Settings sync-count display were both updated to count only `!g.synced`
entries, not raw array length, since the array no longer shrinks back to empty.

A **"Local Games" viewer** exists in Settings (`showGameLog` state) specifically so
this permanent local record is actually visible, not just present in storage. It
lists every locally-cached game, most recent first, each showing: formatted
date/time, a Synced/Pending status pill, the winner + their deck (🏆), a per-player
line (name, deck, and Win/"Out T5"/—), and turn count + mulligan type. A **"Clear
Synced Games (N)"** button sits at the bottom of that view (confirm dialog first,
explicit that it only clears the *local* copy, not the sheet) — this is the only
thing that ever removes a synced entry, and it's manual, on purpose.

### Response-shape verification, not just `r.ok`

**The actual root cause of at least one confirmed data-loss incident**: the sync
code used to trust any 2xx HTTP status as "success" and remove the game from the
queue. Render's free-tier cold-start loading page (served by Render's platform
layer, before the Flask app is even running) can return a response in the 2xx
range without the request ever reaching `main.py` at all — meaning the game gets
marked synced and deleted locally, while nothing was ever written to the sheet.
Confirmed via Render server logs showing *zero* trace of the request for the
specific missing game, while two other games from the same session had complete
`OPTIONS` + `POST` + the backend's own `print()` success line all present.

**Fix**: `syncPending()` now checks the actual JSON response body, not just
`r.ok`:

```js
if (r.ok && body && body.status === 'success' && body.game_id) {
  // only now is it marked synced
}
```

Any other outcome — non-2xx, unparseable body, missing `status`/`game_id` — falls
through to the same failure path as a network error: the loop `break`s, the game
stays `synced: false`, nothing is deleted.

### Stale closures — a whole category of bug found and fixed here

React state read inside a callback reflects whatever render *created* that
callback, not necessarily the render current when the callback actually *runs*.
This bit the sync logic in at least three separate, confirmed places:

1. **`submitGame`'s own "sync in background" call.** Originally
   `setTimeout(() => syncPending(), 500)` — a direct reference to the `syncPending`
   closure from the *same render* as the `submitGame` call, which was created
   *before* `setPendingGames(...)` had taken effect. That closure's own
   `pendingGames` therefore never included the just-submitted game — meaning this
   specific "try to sync right away" call was **silently a no-op for every single
   game, the entire time**, never actually fixed correctly until very late in this
   conversation (it was identified once, apparently agreed to be fixed, then
   accidentally left unfixed while the conversation moved to other topics — only
   caught later during an explicit "exhaustively re-verify everything" pass).
   **Fixed** by calling `syncPendingRef.current()` instead — a ref that's
   reassigned to the latest closure on every render (`syncPendingRef.current =
   syncPending;`, executed unconditionally each render), so by the time the
   `setTimeout` actually fires, it calls a version of the function that has the
   current `pendingGames`.
2. **The `isSyncing` concurrency guard.** Was a plain `useState` boolean, which is
   *also* per-closure. Two different triggers (e.g. the `online` browser event and
   a manual "Sync" tap in Settings) firing close together could each observe
   `isSyncing === false` from their own stale snapshot and both proceed
   concurrently, firing duplicate POSTs for the same game. **Fixed** with a
   `syncInProgressRef` (a `useRef`, not state) as the actual synchronous guard — a
   single shared value regardless of which closure/trigger is checking it.
   `isSyncing` (state) is now purely cosmetic, only used for the "Syncing..."
   label and disabling the button visually; the ref is what actually prevents
   overlapping runs.
3. **The Settings "Sync" button and the online-event listener** were already
   correctly ref-based or freshly-scoped and did not need changing — confirmed by
   tracing each trigger path individually rather than assuming.

**General rule for this codebase going forward**: any `setTimeout`, event
listener, or other callback that's *registered once and invoked later* — as
opposed to invoked synchronously within the same render/event that created it —
must go through a ref if it reads component state, not a direct closure
reference. A directly-invoked inline `onClick={...}` handler defined in the current
render's JSX is fine as-is; anything deferred is not.

### The double-submit race (separate from the above, also fixed)

The Submit button had no guard against firing twice (a fast double-tap, or simply
the button staying on-screen for one extra render before its `gameStarted`-gated
render condition caught up). Combined with `submitGame` computing
`const updated = [...pendingGames, gameData]; setPendingGames(updated)` — a
*replace*, not a functional update — two near-simultaneous calls could have the
second one's `setPendingGames` silently overwrite the first one's addition
entirely (if both read `pendingGames` before either committed), losing one game
outright. Or, with slightly different timing (a render landing between the two
calls), both games could end up genuinely queued with near-identical data,
resulting in the same real game submitted twice under two different
server-generated `GameID`s. **Both of these were the same root cause manifesting
two different ways depending on exact timing** — not two separate bugs.

**Fixed** two ways together:
- `submittingRef` (a `useRef`, synchronous) blocks `submitGame()` from running
  again until a *new* game actually starts (reset happens at the point
  `gameStarted` flips to `true` for a fresh game, and also on Reset Game).
- `setPendingGames(prev => [...prev, gameData])` — a functional update, immune to
  the stale-snapshot race even if the guard above somehow didn't catch a
  double-fire, since React resolves functional updates against the true latest
  state regardless of how many are queued.

### Crash-safety: `JSON.parse` on `localStorage` values

Found during an explicit "be exhaustive" re-review, not from a reported symptom.
`pendingGames` and `pendingEdits` used to be initialized with a bare
`JSON.parse(localStorage.getItem(key) || '[]')`, no error handling, executed
*during the very first render*. If that stored value is ever malformed for any
reason (a previous crash mid-write, storage corruption, anything), this throws and
**the entire app fails to load** — a strictly worse failure mode than losing track
of one pending item, since there's no error boundary anywhere in this app to catch
it. **Fixed** with a shared `loadJSONArray(key)` helper (try/catch, returns `[]` on
any failure) and a matching `safeSetItem(key, value)` wrapper around every write
tied to this system, so a *write* failure (quota exceeded, private browsing
restrictions) can't do the same thing in reverse (an uncaught throw inside a React
state updater, with no error boundary, blanking the screen).

### Live-game persistence (separate from `pendingGames`, do not conflate)

A **completely independent** cache, `localStorage['mtg_live_game']`, added so an
*in-progress* game (seats, life totals, commander damage, turn counter, even
mid-setup-wizard progress) survives navigating away (e.g. to the stats pages) or
fully closing and reopening the app — previously this lived only in React state and
a full page reload silently wiped it. Rehydrated once on mount via a `useRef`-gated
one-time read (`cachedGameRef`), written on every change via a `useEffect`
depending on `[gameStarted, turn, firstSeatIndex, mulliganType, seats]`.

**This cache and `pendingGames` do not interact.** Submitting a game resets the
live-game state to fresh defaults (which the persistence effect then correctly
writes back to `mtg_live_game`), and neither Reset Game nor the setup-wizard
"randomize who's first" reset ever touches `pendingGames`. Confirmed by explicit
trace during the "exhaustive" review — this was a specific hypothesis raised (could
the *new* live-game cache be the source of duplicate/missing games?) and ruled out;
the actual causes were the stale-closure and double-submit issues above, which
predate the live-game cache entirely.

## Commander damage: small-screen vs. large-screen modal

Added a screen-size-responsive behavior: on large screens (tablets), tapping the
commander-damage mini-grid opens an in-quadrant overlay confined to that seat's own
card, same as always. On small screens (phones), it opens a true full-screen
overlay instead, with larger tap targets.

- `useIsLargeScreen()` hook — `window.matchMedia('(min-width: 768px)')`, matching
  Tailwind's own `md:` breakpoint so "large screen" means the same thing here as
  everywhere else in this codebase's className strings.
- **The full-screen modal could not simply be `position: fixed` inside `Quadrant`.**
  A CSS `transform` on any ancestor becomes the containing block for
  `position: fixed` descendants — and for the cross-layout `top`/`bot`/`midl`
  seats specifically, there's exactly such an ancestor (the per-seat
  `crossRotationFix` wrapper). So a naive fixed-position modal rendered inside
  those seats' `Quadrant` only ever covered that seat's own local rotated box, not
  the real screen.
- **Also tried and reverted**: using `ReactDOM.createPortal` to escape this. The
  artifact/deployment environment this app's Claude-assisted sessions run in does
  not support a `react-dom` import (`createPortal` unavailable) — confirmed by an
  actual build failure, not assumption.
- **Actual fix**: lifted the small-screen modal (`SmallScreenCmdModal`) to the
  top-level `App` component entirely, rendered as a sibling of the seat grid,
  living directly inside the single base 90° rotation and never nested inside any
  per-seat counter-rotation wrapper in the first place — so there's no containing
  block to fight with, because the component was never in the wrong part of the
  tree to begin with. State (`cmdModalSeatId`) and the seat→orientation logic
  (`getSeatOrientation`, `getSeatCmdInfo`, `getCmdGridLayout`, `renderCmdCells`)
  were extracted to module-level pure functions so both the large-screen
  (in-`Quadrant`) and small-screen (top-level) variants share identical logic and
  can't drift apart.
- See "The commander damage modal rotation saga" above for how its actual
  orientation math was debugged.

## Settings menu

- Section headers ("Game", "Danger Zone", "Stats") were removed per request —
  it's one continuous scrollable list now. All rows use the same `mb-3` spacing
  via `SettingsRow`'s own `last` prop convention (only the true final row in the
  list should pass `last`; anything before it should not, or gaps become
  inconsistent — this was a real bug caught and fixed: "Manage Players" and
  "Reset Game" were both marked `last` from when they used to each be the final
  item under their own (now-removed) section header, which left them visually
  flush against the next row once the headers were gone).
- **"Table Stats"** row: navigates (same-tab, `window.location.href =
  '/stats/index.html'`) to the stats pages. Originally implemented as
  `window.open(..., '_blank')` specifically to protect in-progress game state from
  a full-page navigation — this was changed to a normal same-tab navigation once
  the live-game persistence cache (above) made that protection unnecessary, and
  because `window.open` with `_blank` inside an installed PWA's standalone webview
  on mobile tends to open an in-app browser *overlay* (Safari View Controller/
  Custom Tabs-style sheet) rather than a real new tab — meaning the "← EDH
  Tracker" link on the stats pages didn't actually return to the running app, it
  just re-navigated within that overlay, requiring the person to manually dismiss
  it via its own "X" to get back. Same-tab navigation avoids this class of problem
  entirely.
- **"Local Games"** row: see the sync-architecture section above.

## The stats pages

`public/stats/index.html`, `player.html`, `deck.html` — three self-contained
static HTML files (inline `<style>`/`<script>`, no build step, no framework),
originally built in a separate conversation thread and periodically brought back
into this one for review/integration. **They now read from the app's own backend**
— `GET /stats/data` (games + performance) and `GET /players` (pfp/active-deck/
owned-deck data) — instead of Google Sheets' `gviz` CSV export. That old
unauthenticated-CSV mechanism, and the "sheet must be shared as Anyone with the
link — Viewer" requirement that came with it, no longer applies at all.

### Shared fetch/normalize logic — extracted, no longer hand-duplicated

`public/stats/stats-shared.js` (loaded via a plain `<script src>` in all three
pages, no build step, no `type="module"` — just as if it were pasted inline)
holds the fetch layer (`fetchStatsJSON`, `buildPlayerDeckMaps`,
`normalizeStatsData`, `initStatsPage`) plus the small utility functions
(`mean`, `pct`, `mostRecentArt`, `pipsHTML`, `rankItems`, `turnCompareAsc`,
`playerUrl`/`deckUrl`, `monthLabel`, `normKey`, `isDeckActive`,
`toggleInactive`) that were confirmed byte-identical across all three files
before extraction. **This used to be a known, flagged, not-yet-addressed
duplication risk** — every fix to this logic had to be hand-applied three
times — and was fixed as part of the Postgres migration, since all three
files needed editing anyway to change the data source. Each page's own
`renderAsync(data)` destructures what it needs from the object
`initStatsPage` hands it (`games`, `perf`, `gamesById`, `totalGames`,
`players`, `decks`, `pfpMap`, `activeDecksByOwner`, `ownedDecksByOwner`,
`avgTurn`, `longest`, `shortest`, `dateSorted`, `dateSortedNonGuestWin`,
`mostRecent`, `gamesNonGuestWin`) and its page-specific rendering (everything
from `// ---------- players ----------` onward) is otherwise unchanged —
confirmed via a real headless-browser pass (Playwright) against live
production data during the migration, not just a syntax check.

`player.html` additionally keeps its own page-specific `setDeckSort` helper
(DOM-only, reorders a rendered rowlist by precomputed order — nothing to do
with fetching) in its own inline script; it was never part of the shared
byte-identical range and stays there.

Tolerant Sheets-header matching (`field()`/a column-name-drift defense) is
**gone entirely** — the backend guarantees canonical field names now, so the
whole class of "sheet header got retyped/truncated by hand" bug this used to
guard against structurally can't happen anymore. The bullets below describe
logic that's still true and was ported verbatim into `stats-shared.js`'s
`normalizeStatsData`, minus that now-unnecessary header-matching layer.

### Data-quality defenses, and why they exist

- **Winner detection is NOT derived from `Player_Performance`'s `Turn_Died`
  text column.** That field turned out to be written inconsistently across the
  sheet's real history — sometimes literally `"win"`, sometimes blank for the
  winner. Instead, winner status is cross-referenced against
  `Game_Summary`'s `(GameID, Winner_Player)` pairs, matched case/whitespace-
  insensitively via a `normKey`-based composite key, since that field has proven
  reliable (it's what already correctly powers "Reigning Champion" in Awards).
- **Guest exclusion**: any row where `Player` (or a game's `Winner_Player`)
  normalizes to `"guest"` is excluded from person-attributed stats and awards, but
  **table-wide facts still include every logged game regardless of who won it**
  (total games, avg turn, seat rates, mulligan habits, monthly trend) — this is a
  deliberate distinction, not an inconsistency; don't "fix" it into uniform
  exclusion.
- **A real, found-and-fixed bug**: `seatWins` (numerator, "did this seat's
  occupant win") was originally computed from the *unfiltered* `games` array,
  while `seatTotals` (denominator, "how often was this seat occupied") came from
  the *guest-filtered* `perf` array — a scope mismatch that could inflate a seat's
  apparent win rate if a Guest ever won from that seat. Fixed by computing
  `seatWins` from `gamesNonGuestWin` instead, matching scopes.
- **A real, found-and-fixed crash risk**: `longest`/`shortest` (used in Awards)
  used to seed a `.reduce()` with `gamesNonGuestWin[0]`, which is `undefined` if
  every logged game so far happened to be won by "Guest" — an edge case, but one
  that would throw on `.End_Turn` access and blank the entire page. This was a
  **regression** introduced specifically by adding guest-exclusion (the original,
  pre-guest-filtering code used the always-non-empty `games` array here and
  couldn't hit this). Fixed with explicit length checks and `null`-safe rendering.
- **A real, found-and-fixed bug**: a deck's displayed art (`mostRecentArt` in
  `stats-shared.js`) used to be picked via `rows.find(r=>r.ArtURL)`, i.e. the
  **first** non-blank `ArtURL` among that deck's logged games in row order —
  meaning after switching a deck's art, the stats pages kept showing the *old*
  art (from the oldest logged game) instead of the new one, for a long time.
  Fixed to pick the art from the row with the latest `Timestamp` instead. Note
  this only affects the *displayed thumbnail* — deck identity/aggregation is
  keyed by name (or `deck_id`, see the schema section above), never by art, so
  a deck's win rate/game count was never split or merged by this bug.

### "Devotion" — what it actually measures, and why it changed

The player-devotion stat (color-identity share, feeds the "Highest/Lowest
Devotion" awards) originally computed its denominator from
`Player_Performance` rows — i.e. decks a player had **piloted** in a logged game,
which could include decks they'd borrowed from someone else, or decks they'd since
retired. Changed, per explicit request, to instead use `ownedDecksByOwner[name]`
— the same per-player **active, owned** deck list (from that player's own sheet
tab, excluding rows with the `Exclude` checkbox set) that already powers the
Decks section's `isDeckActive()` check. `deckCount` (which gates the
"needs 2+ distinct decks" guard on the devotion awards) was updated to match the
same basis, since it used to be computed from the piloted-decks set and would
otherwise have silently disagreed with what it was supposed to be guarding.

### Navigation / branding — made to feel like part of the Tracker, not a separate site

- Removed all "The Table" standalone branding; page titles now read "EDH Tracker —
  [Stats/Player Stats/Deck Stats]".
- The nav-mark (top-left logo) is now a real `←` link to `/` (the Tracker app
  root) on all three pages — previously `index.html`'s mark wasn't even a link,
  and `player.html`/`deck.html`'s marks only looped back to the stats index, with
  no way to exit to the actual app from anywhere in the stats pages at all.
- All three pages now have **identical** nav-links: `Overview / Players / Decks`,
  confirmed byte-identical across all three files. (`index.html` used to have a
  much longer list of in-page section anchors instead — Rivalries, Awards,
  Activity, Mulligans, Colors, Seats — which were removed per explicit request in
  favor of consistency across pages; the sections themselves and their `id`
  attributes are untouched, just no longer linked from the nav bar.)
- **Mobile nav was completely hidden** (`.nav-links { display: none; }` below
  640px) — pre-existing, not introduced by the above changes, but directly
  undermined by them once discovered, since the whole point of adding
  cross-page links was defeated if they're invisible on the primary device this
  app is meant for. Fixed by converting to a horizontally-scrollable pill row
  (`overflow-x: auto`, hidden scrollbar both WebKit and Firefox) instead of
  hiding entirely.

## Service worker (`sw.js`)

Currently `CACHE_NAME = 'mtg-tracker-v5'` (bumped from `v4` when
`stats-shared.js` was added to the precache list during the Postgres
migration — a version bump is what actually triggers the install/activate
cycle that deletes stale cache keys; just changing cached *content* without
bumping the name doesn't reliably do that).

- Cache-first for images (Scryfall art etc.), `IMAGE_CACHE = 'mtg-images-v1'`.
- **Network-first for the app shell** (`request.mode === 'navigate'`, `/`, or
  `/index.html`) — intentional, because `index.html` references hashed JS/CSS
  bundle filenames from the current build, so it must always be fetched fresh
  when possible, or a deploy can take two reloads to actually show up. Falls back
  to cache (`ignoreSearch: true`, then `/`) only on network failure.
- **Precache list includes the three stats pages plus `stats-shared.js`**
  (`/stats/index.html`, `/stats/player.html`, `/stats/deck.html`,
  `/stats/stats-shared.js`), added alongside `/`, `/index.html`,
  `/manifest.json` in the `install` handler — they used to only get cached
  opportunistically the first time each was visited online, meaning a
  first-ever attempt to open Stats while offline would silently fall through
  to serving the *main Tracker app* instead of an error or the stats page (the
  offline fallback's `ignoreSearch: true` only strips the query string, not
  the path, so an uncached stats page path wouldn't match and would fall all
  the way through to `cache.match('/')`).
- Note: the stats pages' own *data* (`GET /stats/data` + `GET /players`, both
  hosted on `edh-backend.onrender.com` — explicitly skipped by the fetch
  handler's `if (url.hostname === 'edh-backend.onrender.com') return;` guard)
  is not, and cannot meaningfully be, offline-first — only the page *shell*
  can be. Offline, the stats pages will load instantly from cache but show
  their own "Couldn't reach the server" state, which is correct, expected
  behavior, not a bug to fix.

## Postgres migration — completed

This was previously planned-but-not-started; **it is now done, deployed, and
verified in production**, in two phases. Kept here mostly so a future session
understands *why* the current schema/endpoints look the way they do, and so
none of these deliberate decisions gets accidentally re-litigated or reverted.

- **Why**: a meaningful fraction of the data-reliability problems fixed in the
  Sheets era existed specifically *because* Google Sheets was being used as an
  application database rather than what it's built for — the tolerant
  header-matching defenses, the checkbox-write gotcha, the blank-row-hunting
  logic. None of that exists anymore; a real schema with real constraints
  replaced all of it (e.g. `games.id` as a primary key makes duplicate
  submissions fail with a clean `UniqueViolation` instead of something
  client-side guards have to defend against).
- **Provider**: Neon, not Render's own free Postgres tier — Render's free
  Postgres expires 30 days after creation (14-day grace period), with no
  backups even while alive; Neon's free tier is genuinely permanent (0.5GB
  storage, 100 compute-hours/month, no credit card, compute scales to zero
  after 5 minutes idle). Provisioned via the Neon CLI (`neon link`, `neon
  config`/`neon deploy` against `neon.ts`) rather than the dashboard.
- **Admin/hand-fix access decision**: Neon's own web console (SQL editor /
  table view) — no custom admin UI was built. This was the one explicitly
  deferred tradeoff from the original plan (Sheets let anyone hand-fix a bad
  row with zero engineering; Postgres needed *something* to replace that), and
  it was deliberately resolved this way rather than left unresolved.
- **Schema**: see "Schema (Postgres)" under `main.py` above for the literal
  tables/columns, and particularly the `game_performance.deck_id` design
  (nullable FK, `ON DELETE RESTRICT`) — that wasn't in the original plan, it
  came out of a design discussion partway through about deck identity: the old
  Sheets-era code (and the stats pages' own aggregation) identified a deck
  purely by its display name, which meant renaming a deck forked its stats
  history in two, and deleting-then-recreating a same-named deck silently
  merged unrelated history. `deck_id` fixes both, structurally, at the DB
  level, without changing the columns that already had a good reason to be
  point-in-time snapshots (`deck`, `colors`, `art_url` on `game_performance`).
- **Rollout order actually used, matching the original recommendation**:
  Phase 1 — stand up Neon + schema, one-time backfill script
  (`scripts/backfill_postgres.py`) from the then-live Sheets data, verify the
  new `main.py` byte-for-byte against the old Sheets-backed backend (same
  routes, same JSON shapes, tested with a disposable player/deck and a
  synthetic game before touching anything real), then cut Render over. Sheets
  was left untouched afterward, specifically as a fallback reference, and
  confirmed to have logged zero games in the window between the backfill and
  the cutover (so nothing from that gap was lost). Phase 2 — once the backend
  cutover was verified live, migrated the stats pages too (see "The stats
  pages" above), which the original plan explicitly deferred until "the new
  data source is trusted."
- **`requirements.txt` was pruned** post-migration: `gspread`, `google-auth`,
  `pandas`, `streamlit` are no longer needed by `main.py` (the first two only
  by the one-off backfill script now, the latter two were unused entirely,
  apparently leftover from the dead `app.py` prototype).
- **Not done, deliberately**: Google Sheets itself hasn't been decommissioned
  or had its sharing/service-account access revoked — it's kept as a
  read-only historical fallback until the Postgres-backed app has some real
  usage behind it. Revisit this later, not as an accident of cleanup.

## House rules for working on this codebase

Distilled from what actually caught real bugs across this whole project, not
generic advice:

1. **A bracket-balance check is not a syntax check, and a syntax check is not a
   correctness check.** Use an actual JS parser (`@babel/parser`) before
   considering any edit verified, and additionally run an undefined-variable
   lint pass (`no-undef` via ESLint with a Babel/JSX parser) — a real crash this
   conversation (`ReferenceError`, blank white screen) came from a destructured
   variable (`swapped`) being removed from a hook's return-value destructure
   while a later line still referenced it; this class of bug is invisible to
   parsing alone and only surfaces at runtime.
2. **A 2xx HTTP status does not mean the request reached the application code
   you think it did.** Check the actual response body/shape for platforms with
   cold-start behavior (Render free tier, and likely similar on other free-tier
   PaaS providers) before treating any network call as confirmed successful.
3. **Distinguish a callback invoked synchronously in the current render from one
   invoked later (a `setTimeout`, an event listener registered once).** The
   latter needs a `ref`, not a direct closure reference, if it reads component
   state — see the stale-closure section above for three confirmed real
   instances of getting this wrong.
4. **When a fix produces literally zero visible change, treat that as a strong
   signal the theory is wrong, not as a reason to apply the same kind of fix
   more aggressively.** The padding-axis trap above is the clearest example: more
   padding on an already-overflowing, clipped container is invisible by
   construction, and doing it harder doesn't help.
5. **For rotation/orientation work specifically: trust a real screenshot over a
   re-derivation of the transform math, every time they disagree.** Several
   rounds of the commander-damage-modal saga were only resolved by treating the
   screenshot as ground truth and solving backward from it, not by re-checking the
   arithmetic a third or fourth time.
6. **`localStorage` reads must never be a bare `JSON.parse` with no fallback,
   anywhere they run during initial render** — this app has no error boundary,
   so an uncaught exception there blanks the entire app, which is a strictly
   worse failure mode than whatever the corrupted data would have caused on its
   own.
7. **Do not reintroduce a demo/practice mode or a second submission destination**
   without revisiting this decision explicitly with the project owner — it was
   proposed, discussed, and deliberately rejected in favor of trusting access
   control instead of building a routing mechanism to defend against a threat
   that isn't considered real for this use case.
8. **An entity's "identity" for stats/history purposes should never be its
   display name alone if that name can change or be reused.** The deck-art
   staleness bug and the deck-identity design discussion (see "Postgres
   migration — completed") were the same root shape: name-keyed aggregation
   silently merges unrelated history (delete-then-recreate) or forks real
   history in two (rename). A stable ID (`deck_id`) is the fix; a display-name
   string is a snapshot value, not an identity.
9. **On Neon, schema migrations and other session-level operations need the
   direct/unpooled connection string, not the pooled one.** The pooled
   (`-pooler`) connection routes through PgBouncer in transaction mode, which
   doesn't support session state — followed proactively per Neon's own
   documented guidance (not from a real incident this time). `DATABASE_URL`
   (pooled) is for normal app traffic; `DATABASE_URL_UNPOOLED` is for
   `schema.sql`/`scripts/backfill_postgres.py`.