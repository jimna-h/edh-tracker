import streamlit as st
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime

# --- CONFIG & STYLING ---
st.set_page_config(layout="wide", page_title="Lifetap Stats", initial_sidebar_state="collapsed")

st.markdown("""
    <style>
    #MainMenu {visibility: hidden;} footer {visibility: hidden;} header {visibility: hidden;}
    .stApp { background-color: #000000; color: white; }
    .player-container {
        height: 40vh; display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        border: 1px solid #222; position: relative;
    }
    .flipped { transform: rotate(180deg); }
    .center-btn {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        z-index: 100; width: 80px; height: 80px; background-color: #1a1a1a;
        border: 4px solid #333; border-radius: 50%; display: flex;
        justify-content: center; align-items: center;
    }
    .turn-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background-color: rgba(0,0,0,0.98); z-index: 1000;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
    }
    .big-turn { font-size: 18rem; font-weight: bold; color: #00ff88; margin: 0; }
    .stat-label { color: #888; text-transform: uppercase; font-size: 0.7rem; }
    </style>
    """, unsafe_allow_html=True)

# --- GOOGLE BINDINGS ---
PLAYERS_SHEET_ID = "1HfTUoLol3h1DmDeWTDsUqYTjq99SV9NGi-CmB3Wk89g"
STATS_SHEET_ID = "18_9UkJ3MAsNw4ByOGFDqOBE2u1gnpxQSR3tPi-_9i3I"

def get_client():
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_file("service_account.json", scopes=scopes)
    return gspread.authorize(creds)

client = get_client()

@st.cache_data(ttl=300)
def pull_players_and_decks():
    sh = client.open_by_key(PLAYERS_SHEET_ID)
    data = {}
    for ws in sh.worksheets():
        all_vals = ws.get_all_values()[1:]
        decks_with_colors = {row[0]: row[1] if len(row) > 1 else "Unknown" for row in all_vals if row}
        data[ws.title] = decks_with_colors
    return data

# --- INITIALIZE STATE ---
if 'setup_complete' not in st.session_state: st.session_state.setup_complete = False
if 'turn_count' not in st.session_state: st.session_state.turn_count = 1
if 'show_turn_overlay' not in st.session_state: st.session_state.show_turn_overlay = False
if 'players' not in st.session_state:
    st.session_state.players = {i: {'status': 'active', 'step': 0, 'data': {}} for i in range(4)}

player_map = pull_players_and_decks()
player_list = list(player_map.keys())

# --- STAGE 0: SETUP ---
if not st.session_state.setup_complete:
    st.title("Game Setup")
    mull = st.selectbox("Mulligan Style", ["London", "Vegas", "Three Piles of Four", "Ten Put Back Three", "Other"])
    st.session_state.mulligan = mull
    
    cols = st.columns(2)
    for i in range(4):
        with cols[i%2]:
            st.subheader(f"Seat {i+1}")
            # FIXED: Using selectbox with the player_list from GSheets
            selected_name = st.selectbox(f"Who is in Seat {i+1}?", player_list, key=f"setup_n{i}")
            
            decks = list(player_map.get(selected_name, {}).keys())
            selected_deck = st.selectbox(f"{selected_name}'s Deck", decks + ["+ New"], key=f"setup_d{i}")
            
            # Metadata for later
            st.session_state.players[i]['name'] = selected_name
            st.session_state.players[i]['deck'] = selected_deck
            st.session_state.players[i]['data']['start_lands'] = st.number_input("Opening Lands", 0, 7, 3, key=f"setup_l{i}")

    if st.button("START GAME", use_container_width=True, type="primary"):
        st.session_state.game_id = datetime.now().strftime("%y%m%d-%H%M")
        st.session_state.setup_complete = True
        st.rerun()

# --- STAGE 1: THE GAME ---
else:
    # 1. TURN OVERLAY (Visible when Center Button tapped)
    if st.session_state.show_turn_overlay:
        st.markdown('<div class="turn-overlay">', unsafe_allow_html=True)
        st.markdown(f'<p class="big-turn">{st.session_state.turn_count}</p>', unsafe_allow_html=True)
        
        c1, c2, c3 = st.columns(3)
        with c1:
            if st.button("➖", use_container_width=True): 
                st.session_state.turn_count = max(1, st.session_state.turn_count - 1)
                st.rerun()
        with c2:
            if st.button("CLOSE", use_container_width=True):
                st.session_state.show_turn_overlay = False
                st.rerun()
        with c3:
            if st.button("➕", use_container_width=True):
                st.session_state.turn_count += 1
                st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

    # 2. THE QUADRANTS
    r1_l, r1_r = st.columns(2)
    r2_l, r2_r = st.columns(2)
    quads = [r1_l, r1_r, r2_l, r2_r]

    for i, col in enumerate(quads):
        p = st.session_state.players[i]
        with col:
            flip = "flipped" if i < 2 else ""
            st.markdown(f'<div class="player-container {flip}">', unsafe_allow_html=True)
            
            if p['status'] == 'active':
                st.markdown(f"## {p['name']}")
                st.markdown(f"<small>{p['deck']}</small>", unsafe_allow_html=True)
                st.divider()
                if st.button("LOSE", key=f"lose_{i}", use_container_width=True):
                    p['status'] = 'questionnaire'
                    p['data']['turn_died'] = st.session_state.turn_count
                    st.rerun()
                if st.button("WIN", key=f"win_{i}", use_container_width=True, type="primary"):
                    for j in range(4):
                        if i != j and st.session_state.players[j]['status'] == 'active':
                            st.session_state.players[j]['status'] = 'questionnaire'
                            st.session_state.players[j]['data']['turn_died'] = st.session_state.turn_count
                    p['status'] = 'questionnaire' # Winner also gives stats
                    p['data']['turn_died'] = 0 # 0 denotes winner
                    st.session_state.winner_seat = i + 1
                    st.rerun()
            
            elif p['status'] == 'questionnaire':
                steps = ["Lands", "Rocks", "Dorks"]
                curr = p['step']
                if curr < 3:
                    st.markdown(f"<p class='stat-label'>Final {steps[curr]}</p>", unsafe_allow_html=True)
                    val = st.number_input("", key=f"q_{i}_{curr}", min_value=0, max_value=100)
                    if st.button("Submit", key=f"btn_{i}_{curr}"):
                        p['data'][steps[curr].lower()] = val
                        p['step'] += 1
                        st.rerun()
                else:
                    p['status'] = 'done'
                    st.rerun()
            
            else:
                st.markdown("<h1 style='color: #333;'>OUT</h1>", unsafe_allow_html=True)

    # 3. CENTER BUTTON
    if not st.session_state.show_turn_overlay:
        st.markdown('<div class="center-btn">', unsafe_allow_html=True)
        if st.button("TURN", key="center_trigger"):
            st.session_state.show_turn_overlay = True
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

    # 4. FINAL UPLOAD
    if all(p['status'] == 'done' for p in st.session_state.players.values()):
        st.divider()
        if st.button("UPLOAD ALL DATA TO SHEETS", use_container_width=True, type="primary"):
            try:
                full_sh = client.open_by_key(STATS_SHEET_ID)
                # Summary Tab
                win_p = st.session_state.players[st.session_state.winner_seat-1]
                summary_row = [
                    st.session_state.game_id, st.session_state.mulligan, 
                    st.session_state.winner_seat, win_p['deck'], 
                    player_map[win_p['name']].get(win_p['deck'], "N/A"),
                    st.session_state.turn_count, datetime.now().strftime("%Y-%m-%d %H:%M")
                ]
                full_sh.get_worksheet(0).append_row(summary_row)
                
                # Performance Tab
                perf_rows = []
                for idx in range(4):
                    p_data = st.session_state.players[idx]
                    perf_rows.append([
                        st.session_state.game_id, p_data['name'], p_data['deck'],
                        p_data['data']['start_lands'], p_data['data']['lands'],
                        p_data['data']['rocks'], p_data['data']['dorks'],
                        p_data['data']['turn_died']
                    ])
                full_sh.get_worksheet(1).append_rows(perf_rows)
                st.success("Logged!")
                st.balloons()
                time.sleep(3)
                st.session_state.clear()
                st.rerun()
            except Exception as e:
                st.error(f"Error: {e}")