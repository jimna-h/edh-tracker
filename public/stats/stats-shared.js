// Shared fetch/normalize logic for the three stats pages (index.html,
// player.html, deck.html). This used to be pasted identically into all three
// files' own <script> blocks (a known, flagged duplication risk - every past
// fix here had to be hand-applied three times). Extracted into one file since
// the data source itself changed (Google Sheets -> the app's own Postgres-
// backed API) and all three files needed editing anyway.
//
// Everything from here through normalizeStatsData() replaces what used to be
// gvizUrl/parseCSV/rowsToObjects/field/fetchSheet/fetchPlayerPfps/init() plus
// the "// ---------- normalize ----------" block at the top of each page's
// own renderAsync(). Each page's own page-specific rendering (players/decks/
// seats/awards/etc. sections) is unchanged and consumes the exact same
// variable names this now hands it.

const STATS_API_BASE = 'https://edh-backend.onrender.com';

const MANA_COLORS = { W:'#F4EFDD', U:'#3E7FC1', B:'#4A4750', R:'#B8402F', G:'#3C7A4C', C:'#9A958A' };
const COLOR_NAMES = { W:'White', U:'Blue', B:'Black', R:'Red', G:'Green', C:'Colorless' };

// Normalize a name for tolerant/case-insensitive matching (e.g. matching a
// deck name against its owner's active-deck set). Lowercase, strip everything
// but letters+digits.
function normKey(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

async function fetchStatsJSON(){
  const [statsRes, playersRes] = await Promise.all([
    fetch(`${STATS_API_BASE}/stats/data`),
    fetch(`${STATS_API_BASE}/players`),
  ]);
  if (!statsRes.ok || !playersRes.ok) throw new Error('fetch-failed');
  const statsData = await statsRes.json();
  const playersData = await playersRes.json();
  if (!statsData.games || !statsData.games.length || !statsData.performance || !statsData.performance.length) {
    throw new Error('empty');
  }
  return { statsData, playersData };
}

// Builds the pfp/active-deck/owned-deck/deck-color maps directly from the
// GET /players response (the same one the live Tracker app itself uses) -
// this replaces fetching each player's own Sheet tab individually. A deck
// instance is "active" if its owner's decks list doesn't have it excluded;
// "owned" mirrors that same not-excluded set. The Players table (via
// GET /players) is the authoritative deck registry, so its Color_ID should
// win over whatever Player_Performance's own Color_ID has for that deck.
function buildPlayerDeckMaps(playersData){
  const map = {};
  const activeDecksByOwner = {};
  const ownedDecksByOwner = {};
  const deckColorFromSheet = {};
  playersData.forEach(p => {
    const name = p.player_name;
    if (p.pfp && p.pfp.trim()) map[name] = p.pfp.trim();
    const activeSet = new Set();
    const ownedList = [];
    (p.decks || []).forEach(d => {
      const dn = d.deck;
      if (!dn) return;
      const colorId = d.colors || '';
      if (!d.exclude){
        activeSet.add(normKey(dn));
        ownedList.push({ name: dn.trim(), colorId: colorId.trim() });
      }
      if (colorId.trim()) deckColorFromSheet[normKey(dn)] = colorId.trim();
    });
    activeDecksByOwner[name] = activeSet;
    ownedDecksByOwner[name] = ownedList;
  });
  return { map, activeDecksByOwner, ownedDecksByOwner, deckColorFromSheet };
}

// A deck instance is "active" if its owner's deck list includes it
// (un-excluded). If we have no data at all for that owner (no matching
// player), fail open and treat it as active rather than silently hiding
// decks because of a data hiccup.
function isDeckActive(activeDecksByOwner, owner, deckName){
  const set = activeDecksByOwner[owner];
  if (!set) return true;
  return set.has(normKey(deckName));
}

// Toggles a "show inactive" class on the given container and updates the
// triggering button's label. Called from inline onclick handlers.
function toggleInactive(containerId, btn, hiddenCount, showLabel, hideLabel){
  const el = document.getElementById(containerId);
  if (!el) return;
  const showing = el.classList.toggle('show-inactive');
  btn.textContent = showing
    ? (hideLabel || 'Hide inactive decks')
    : (showLabel || ('Show inactive decks (' + hiddenCount + ')'));
}

function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null; }
function fmt1(n){ return n === null || n === undefined || isNaN(n) ? '—' : n.toFixed(1); }
function pct(n){ return n === null || isNaN(n) ? '—' : Math.round(n*100) + '%'; }

// Picks the ArtURL from the most recently-played game among these rows, not
// just the first one found - a deck's art can change (new crop chosen), and
// old logged games keep whatever art was current when they were submitted.
function mostRecentArt(rows, gamesById){
  const withArt = rows.filter(r=>r.ArtURL);
  if (!withArt.length) return '';
  return withArt.reduce((best, r) => {
    const t = new Date(gamesById[r.GameID]?.Timestamp || 0).getTime();
    const bt = new Date(gamesById[best.GameID]?.Timestamp || 0).getTime();
    return t > bt ? r : best;
  }).ArtURL;
}

function pipsHTML(colorId){
  if (!colorId) return `<span class="pips"><span class="pip" style="background:${MANA_COLORS.C}">C</span></span>`;
  const chars = colorId.replace(/[^WUBRG]/gi,'').toUpperCase().split('');
  const uniq = [...new Set(chars)];
  if (!uniq.length) return `<span class="pips"><span class="pip" style="background:${MANA_COLORS.C}">C</span></span>`;
  return `<span class="pips">` + uniq.map(c => `<span class="pip" style="background:${MANA_COLORS[c]}">${c}</span>`).join('') + `</span>`;
}

// Escape both quote styles for a URL dropped into an HTML attribute value:
// the attribute itself is double-quoted, but the value also gets wrapped in
// CSS url('...') using single quotes, so either character breaking loose
// would truncate the attribute early.
function escUrl(u){ return String(u || '').replace(/"/g, '%22').replace(/'/g, '%27'); }

// Dense competition ranking: items tied on the given key all share the same
// rank number, and the next distinct value gets the very next integer
// (1,1,1,1,1,2 - not 1,1,1,1,1,6). Returns an array of rank numbers aligned
// to `items`, which must already be sorted so ties are adjacent.
function rankItems(items, keyFn){
  let rank = 0;
  let prevKey = null;
  return items.map((item, i) => {
    const key = keyFn(item);
    if (i === 0 || key !== prevKey) rank++;
    prevKey = key;
    return rank;
  });
}

// Ascending comparator for "average win turn" tie-breaking where fewer turns
// is better. null (nobody's won yet) sorts last, as if it were +Infinity.
function turnCompareAsc(a, b){
  const av = (a === null || a === undefined) ? Infinity : a;
  const bv = (b === null || b === undefined) ? Infinity : b;
  return av - bv;
}

// Links to the per-entity profile pages.
function playerUrl(name){ return `player.html?name=${encodeURIComponent(name)}`; }
function deckUrl(name){ return `deck.html?name=${encodeURIComponent(name)}`; }

function monthLabel(ts){
  const d = new Date(ts.replace(' ','T'));
  if (isNaN(d)) return null;
  return d.toLocaleString('en-US', { month:'short', year:'2-digit' });
}

// Ports the old renderAsync()'s "// ---------- normalize ----------" block
// verbatim, minus the tolerant field()/header-matching that's no longer
// needed now that the API guarantees canonical field names.
function normalizeStatsData(statsData, playersData){
  let games = statsData.games;
  let perf = statsData.performance;

  games = games.filter(g => g.GameID);
  perf = perf.filter(p => p.GameID && p.Player);
  games.forEach(g => { g.End_Turn = parseFloat(g.End_Turn) || null; });
  const gamesById = {};
  games.forEach(g => { gamesById[g.GameID] = g; });

  // Winner detection is NOT derived from Player_Performance's Turn_Died text.
  // That field is inconsistent - sometimes literally "win", sometimes blank
  // for the winner - so no single string match reliably identifies a winning
  // row. Game_Summary's GameID -> Winner_Player pairing has proven reliable
  // (it's what powers Awards/Reigning Champion correctly), so cross-reference
  // against that instead: a Player_Performance row is a win iff its
  // (GameID, Player) matches a (GameID, Winner_Player) pair.
  const pairKey = (gameId, player) => normKey(gameId) + '|||' + normKey(player);
  const winnerPairs = new Set(
    games.filter(g => g.Winner_Player).map(g => pairKey(g.GameID, g.Winner_Player))
  );

  perf.forEach(p => {
    p.Opening_Lands = parseFloat(p.Opening_Lands) || null;
    p.End_Lands = parseFloat(p.End_Lands) || null;
    p.End_Rocks = (p.End_Rocks === null || p.End_Rocks === undefined) ? null : parseFloat(p.End_Rocks);
    p.End_Dorks = (p.End_Dorks === null || p.End_Dorks === undefined) ? null : parseFloat(p.End_Dorks);
    const turnDiedRaw = p.Turn_Died;
    p.isWin = winnerPairs.has(pairKey(p.GameID, p.Player));
    p.turnDiedNum = p.isWin ? null : (parseFloat(turnDiedRaw) || null);
    p.SeatNum = parseFloat(p.SeatNum) || null;
    p.ArtURL = p.ArtURL || '';
    p.gameEndTurn = gamesById[p.GameID]?.End_Turn ?? null;
    p.Owner = p.Owner || '';
    p.Color_ID = p.Color_ID || '';
  });

  // Guest players don't count toward any stats: excluding their rows here
  // cascades cleanly into every derived stat below (leaderboard, decks,
  // colors, seats, rivalries) since they all build from this `perf` array.
  const isGuest = name => (name || '').trim().toLowerCase() === 'guest';
  perf = perf.filter(p => !isGuest(p.Player));

  // Games a guest won are excluded specifically from person-attributed
  // awards (fastest win / longest grind / reigning champion) - crediting
  // "Guest" as a standing record doesn't mean anything. Table-wide facts
  // (total games, avg turn, seat rates, mulligan habits, monthly trend)
  // still include every logged game regardless of who won it.
  const gamesNonGuestWin = games.filter(g => !isGuest(g.Winner_Player));

  const totalGames = games.length;
  const players = [...new Set(perf.map(p => p.Player))].filter(Boolean);
  const decks = [...new Set(perf.map(p => p.Deck))].filter(Boolean);
  const { map: pfpMap, activeDecksByOwner, ownedDecksByOwner, deckColorFromSheet } = buildPlayerDeckMaps(playersData);
  // Prefer the Players table's Color_ID (the authoritative deck registry)
  // over whatever Player_Performance's own Color_ID column has for that
  // deck - the registry is edited once per deck, not re-entered every game.
  perf.forEach(p => {
    const sheetColor = deckColorFromSheet[normKey(p.Deck)];
    if (sheetColor) p.Color_ID = sheetColor;
  });
  const avgTurn = mean(games.map(g=>g.End_Turn).filter(x=>x));
  // Null (not undefined-from-empty-reduce) when every logged game so far was
  // won by Guest - callers must check for this rather than assume
  // longest/shortest are always real game objects, or it throws on .End_Turn.
  const longest = gamesNonGuestWin.length ? gamesNonGuestWin.reduce((a,b)=> (b.End_Turn||0) > (a.End_Turn||0) ? b : a) : null;
  const shortest = gamesNonGuestWin.length ? gamesNonGuestWin.reduce((a,b)=> (b.End_Turn||999) < (a.End_Turn||999) ? b : a) : null;
  const dateSorted = [...games].filter(g=>g.Timestamp).sort((a,b)=> new Date(a.Timestamp) - new Date(b.Timestamp));
  const dateSortedNonGuestWin = dateSorted.filter(g => !isGuest(g.Winner_Player));
  const mostRecent = dateSortedNonGuestWin[dateSortedNonGuestWin.length-1];

  return {
    games, perf, gamesById, totalGames, players, decks,
    pfpMap, activeDecksByOwner, ownedDecksByOwner, deckColorFromSheet,
    avgTurn, longest, shortest, dateSorted, dateSortedNonGuestWin, mostRecent,
    gamesNonGuestWin,
  };
}

// Drives the loading-spinner / error-screen swap and hands the normalized
// data to the page's own render function.
async function initStatsPage(renderFn){
  let data;
  try{
    const { statsData, playersData } = await fetchStatsJSON();
    data = normalizeStatsData(statsData, playersData);
  } catch(e){
    document.getElementById('app').innerHTML = document.getElementById('errorTemplate').innerHTML;
    return;
  }
  await renderFn(data);
}
