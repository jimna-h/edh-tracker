// Backend URL, write-passcode headers, and how responses are classified.

export const API_BASE = 'https://edh-backend.onrender.com';
export const SUBMIT_URL = `${API_BASE}/submit`;

// Shared write passcode: every POST to the backend must carry it (see main.py's
// require_write_passcode). Stored per device in localStorage and entered via a prompt -
// deliberately NOT a URL param, since a home-screen icon's start_url is frozen at install
// time (the old ?key=toski failure mode). A missing/wrong passcode gets a 401, which the
// sync code treats as "keep queued + ask for the passcode", never as success.
export const PASSCODE_KEY = 'mtg_write_passcode';
export const loadPasscode = () => {
  try {
    return localStorage.getItem(PASSCODE_KEY) || '';
  } catch (e) {
    return '';
  }
};
// URI-encoded so a non-ASCII passcode can't make fetch() throw on an invalid header value.
export const writeHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Write-Passcode': encodeURIComponent(loadPasscode()),
});

// A 4xx the server returned on purpose (409 deck/player has logged games, 404 not found,
// 400 bad input) - resending the same request will never succeed, so it must not be
// queued for retry. 401 (passcode), 408 and 429 are excluded since those can succeed later.
export const isPermanentRejection = (status) =>
  status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;

// Why the server refused a write, if it's one of the two "saving is blocked" cases:
// 'passcode' (401 - this device's passcode is missing/wrong) or 'server' (503 - the
// backend has no WRITE_PASSCODE set). Anything else (offline, cold start, 5xx) -> null.
// The error-string match covers a backend deployed before the `code` field existed.
export const writeBlockReason = (status, body) => {
  if (status === 401) return 'passcode';
  if (status === 503 && body && (body.code === 'passcode_not_configured' || body.error === 'Server write passcode not configured')) return 'server';
  return null;
};

// Art/profile URLs must be real links (or blank). A deck once had its NAME saved as its
// art URL, which then rendered as a broken relative image everywhere it appeared.
export const isLinkOrBlank = (value) => {
  const v = (value || '').trim();
  return !v || /^https?:\/\/\S+$/i.test(v);
};

export const readJSON = async (r) => {
  try {
    return await r.json();
  } catch (e) {
    return null;
  }
};

export const readErrorMessage = async (r) => {
  try {
    const body = await r.json();
    return (body && body.error) || null;
  } catch (e) {
    return null;
  }
};
