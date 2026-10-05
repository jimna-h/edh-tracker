// localStorage helpers. Every access is wrapped: this app has no way to recover from an
// exception thrown during the first render (house rule 6 in CLAUDE.md), and storage
// access itself can throw in blocked/private-browsing modes.

// --- LIVE GAME PERSISTENCE ---
// Caches the in-progress game (seats, turn, life totals, commander damage, setup-wizard
// progress, etc.) so it survives navigating away (e.g. to the stats pages) or closing and
// reopening the app - none of this lives anywhere except React state otherwise, so a full
// page reload would silently wipe it.
export const LIVE_GAME_KEY = 'mtg_live_game';
export const loadCachedGame = () => {
  try {
    const raw = localStorage.getItem(LIVE_GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // A saved game with unusable seats would crash every render (and every reload) -
    // treat it as no saved game instead.
    if (parsed.seats !== undefined && !(Array.isArray(parsed.seats) && parsed.seats.length === 4)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

// Safely reads a JSON array out of localStorage. Used for pendingGames/pendingEdits, which
// were previously read with a bare JSON.parse(localStorage.getItem(...) || '[]') - if that
// value is ever malformed for any reason (a previous crash mid-write, storage corruption,
// anything), that throws during the very first render and the entire app fails to load,
// which is a far worse failure mode than losing track of one pending item.
export const loadJSONArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

// Safe localStorage write: if this throws (quota exceeded, private-browsing restrictions,
// etc.) it fails silently rather than propagating out of a React state updater, which - with
// no error boundary in this app - would otherwise blank the entire screen over a storage
// write failing, even though the in-memory state update itself would have been fine.
export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('localStorage write failed:', key, e);
  }
};

// Read/remove counterparts - localStorage access itself can throw (blocked storage,
// some private-browsing modes), and with no catch here that would blank the app.
export const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};
export const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) { /* ignore */ }
};
