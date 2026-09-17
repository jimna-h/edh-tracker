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
frontend on Vercel, Flask backend on Render, Google Sheets as the database via
`gspread` (currently — a migration to Neon Postgres has been discussed and planned
but **not started**; see "Planned: Postgres migration" near the end).

There is a second, related but architecturally separate piece: a set of static
stats/leaderboard HTML pages (no build step, no framework) that read the same
Google Sheets data and now live inside the same deployment, reachable from the
Tracker's own Settings menu. See "The stats pages" below.

## Repo structure

- `src/App.jsx`, `src/main.jsx`, `src/index.css` — the real, live frontend (Vite).
- `main.py` — Flask backend, deployed on Render.
- `index.html` (repo root) — the Vite entry HTML. Was recently simplified: it used
  to read a `?key=` URL param to dynamically build the PWA manifest's `start_url`;
  that logic is gone now (see "The `?key=toski` removal" below) and it just emits a
  static manifest.
- `sw.js` (repo root, served from domain root) — service worker. Currently at
  `CACHE_NAME = 'mtg-tracker-v4'`.
- `public/stats/index.html`, `public/stats/player.html`, `public/stats/deck.html` —
  the stats pages, now living inside this same repo/deployment (moved here
  specifically so the Tracker's service worker can cache them and so linking to
  them from Settings feels like staying in one product rather than leaving to a
  separate site).
- The root also has stray, **dead/unused** `app.jsx`/`app.py` files left over from
  early repo setup. Ignore them; the real files are `src/App.jsx` and `main.py`.
- `main` branch is the only branch that matters; an earlier note about a stale
  `life-totals` branch may or may not still be accurate — verify before assuming.

## Deployment

- **Frontend**: Vercel, `edh-tracker-seven.vercel.app`.
- **Backend**: Flask on Render free tier — cold-starts after ~15min idle, takes
  30-60s to wake up. This looks identical to "offline" from the user's perspective.
  Render's free tier also serves its own "spinning up" loading page to connecting
  browsers *before* the Flask app is even running — this matters a lot, see the
  "false-positive sync success" saga below.
- **Database (current)**: Google Sheets via `gspread`, service account auth.
  - Players sheet: `1HfTUoLol3h1DmDeWTDsUqYTjq99SV9NGi-CmB3Wk89g` — one worksheet
    tab per player, each tab a deck list for that player.
  - Stats sheet (`STATS_ID` in `main.py`): `18_9UkJ3MAsNw4ByOGFDqOBE2u1gnpxQSR3tPi-_9i3I`
    — `Game_Summary` and `Player_Performance` tabs.
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

### Schema

Players sheet: one worksheet tab per player. Row 1 bold header, row 2 always a
special `PFP` row (column B = profile picture URL, rest blank). Deck rows start at
row 3+.

| Column | Field | Notes |
|---|---|---|
| A | Deck Name | |
| B | Art_URL | Scryfall "Download Art Crop" link recommended |
| C | Art_URL_Partner | Real URL, or literal `'partner'` sentinel |
| D | Color_ID | e.g. `"WUBRG"` |
| E | Exclude | Real Sheets **checkbox** cell — writing must use Python booleans (`bool(...)`), not the strings `"TRUE"`/`"FALSE"`, or it overwrites the checkbox with plain text |
| F | Archidekt | URL |

`Player_Performance` columns, in order: `A` game_id, `B` player, `C` deck, `D`
deck_owner, `E` startLands, `F` lands, `G` rocks, `H` dorks, `I` turn_died, `J`
seat_position, `K` colors, `L` art_url. Column L (`art_url`) was added this
conversation specifically so the stats pages could show deck art without a second
lookup.

### Endpoints

- `GET /players` — all players + all decks (including excluded ones), pfp.
- `POST /submit` — log a finished game. **This is now the only submission
  endpoint** — `/submit-demo` and the `STATS_ID_DEMO` sheet constant were both
  fully removed this conversation (see "The `?key=toski` removal" below).
- `POST /players/add_player`, `/delete_player`, `/add_deck`, `/update_deck`,
  `/delete_deck`, `/update_pfp` — same as before, unchanged mechanics.

`add_deck`/`update_deck` write the full `A:F` range; new decks go to the next row
where column A is blank (`_find_next_blank_row`), not a plain append, so pre-loaded
checkbox rows in column E aren't skipped or misaligned.

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
into this one for review/integration. They read the same Google Sheets data the
Tracker writes to, via Google's public `gviz` CSV export endpoint
(`https://docs.google.com/spreadsheets/d/{id}/gviz/tq?tqx=out:csv&sheet=...`) —
**unauthenticated, straight from the browser**, which means the Players sheet and
the real Stats sheet both need "Anyone with the link — Viewer" sharing (not just
the backend's service account) for these pages to work at all. The demo stats
sheet never needed this and no longer exists.

### Architectural duplication — known, flagged, not yet addressed

All three files independently contain the **entire** data-normalization pipeline:
CSV parsing, tolerant header matching, winner cross-referencing, guest exclusion,
player/deck/color/seat stat computation — verified byte-identical across all three
via direct diff at one point. Every fix made to this logic during this
conversation had to be (and was, correctly, each time) applied three times by
hand. This has not yet caused a drift bug, but it's a standing risk; extracting a
shared `stats-core.js` (still zero-build-step, just one copy instead of three) was
recommended and left as an open, not-yet-done item.

### Data-quality defenses, and why they exist

- **Tolerant `field()`/`normKey()` header matching** — the live sheet's column
  headers have drifted before in ways that broke naive exact-match code: a typo
  (`Muilligan_Type` instead of `Mulligan_Type`), inconsistent truncation
  (`Opening_Lan` instead of `Opening_Lands`). `field(row, headerByNorm, ...candidates)`
  tries several candidate spellings, normalized (lowercase, non-alphanumeric
  stripped), before giving up. **Not originally applied consistently** — `Owner`
  and `Color_ID` were found being read via direct property access
  (`rows.find(r=>r.Owner)?.Owner`) instead of through `field()`, which was
  specifically risky because a wrong/missing `Owner` value would misattribute
  which player actually owns a borrowed deck. Fixed by normalizing `p.Owner` and
  `p.Color_ID` once during the shared normalize pass (`field(p, pH, 'Owner',
  'Deck_Owner', 'DeckOwner')`, etc.) so all later direct-property reads become
  safe automatically.
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

Currently `CACHE_NAME = 'mtg-tracker-v4'` (bumped from `v3` specifically to force
a clean cache wipe after the Settings/navigation changes, since a version bump is
what actually triggers the install/activate cycle that deletes stale cache keys —
just changing cached *content* without bumping the name doesn't reliably do that).

- Cache-first for images (Scryfall art etc.), `IMAGE_CACHE = 'mtg-images-v1'`.
- **Network-first for the app shell** (`request.mode === 'navigate'`, `/`, or
  `/index.html`) — intentional, because `index.html` references hashed JS/CSS
  bundle filenames from the current build, so it must always be fetched fresh
  when possible, or a deploy can take two reloads to actually show up. Falls back
  to cache (`ignoreSearch: true`, then `/`) only on network failure.
- **Precache list now includes the three stats pages**
  (`/stats/index.html`, `/stats/player.html`, `/stats/deck.html`), added
  alongside `/`, `/index.html`, `/manifest.json` in the `install` handler — they
  used to only get cached opportunistically the first time each was visited
  online, meaning a first-ever attempt to open Stats while offline would silently
  fall through to serving the *main Tracker app* instead of an error or the stats
  page (the offline fallback's `ignoreSearch: true` only strips the query string,
  not the path, so an uncached stats page path wouldn't match and would fall all
  the way through to `cache.match('/')`).
- Note: the stats pages' own *data* (the live Google Sheets fetch) is not, and
  cannot meaningfully be, offline-first — only the page *shell* can be. Offline,
  the stats pages will load instantly from cache but show their own "Couldn't
  reach the sheet" state, which is correct, expected behavior, not a bug to fix.

## Planned, not yet started: Postgres migration

Discussed at length but **no code has been written for this yet**. Summary of the
plan as discussed:

- **Why**: a meaningful fraction of the data-reliability problems fixed this
  conversation exist specifically *because* Google Sheets is being used as an
  application database rather than what it's built for — the tolerant
  header-matching defenses, the checkbox-write gotcha, the blank-row-hunting
  logic, none of that would exist with a real schema and real constraints (e.g. a
  unique constraint on `GameID` would make duplicate submissions structurally
  impossible rather than something client-side guards have to defend against).
- **Provider decision**: Neon, not Render's own free Postgres tier. Render's free
  Postgres **expires and is deleted 30 days after creation** (14-day grace period
  to upgrade before deletion), with no backups even while it's alive — confirmed
  via current Render documentation, not assumed. Neon's free tier is genuinely
  permanent (not a trial): 0.5GB storage, 100 compute-hours/month, no credit card,
  no expiration clock, compute scales to zero after 5 minutes idle and wakes on
  the next request. (Supabase's free tier was considered and set aside — it
  *pauses* a project after 7 days of inactivity, requiring manual reactivation in
  their dashboard, which is a real risk for an app that's only used on game
  nights, not daily.)
- **Scope**: normalize the current one-tab-per-player Sheets structure into
  roughly `players`, `decks` (with an owner foreign key), `games`,
  `game_performance`. Backend (`main.py`) swaps `gspread` calls for a Postgres
  client. The stats pages need new JSON read endpoints on the Flask backend
  (since a browser can't/shouldn't hit Postgres directly the way it hits a public
  Sheets CSV export) — but the aggregation/stat-computation logic in the stats
  pages themselves needs little to no change, since it already operates on plain
  JS arrays of objects; only `fetchSheet()`'s CSV-parsing internals would be
  replaced with a `fetch(...).json()` call. The tolerant-header-matching
  machinery becomes unnecessary entirely once there's a real schema instead of a
  spreadsheet header someone can retype by hand.
- **Explicitly noted tradeoff, not yet resolved**: right now anyone can open the
  Google Sheet and hand-fix a bad row directly, zero engineering required. Moving
  to Postgres loses that unless some kind of admin view or DB GUI client is set
  up as part of the migration. Worth deciding deliberately, not by accident.
- **Recommended approach when this is picked up**: incremental, not a big-bang
  cutover — get the backend + Postgres solid and verified first while the stats
  pages keep reading Sheets, then migrate the stats pages once the new data
  source is trusted.

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