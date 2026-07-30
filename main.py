from flask import Flask, jsonify, request
from flask_cors import CORS
import gspread
from google.oauth2.service_account import Credentials # Stick to this one
import uuid 
from datetime import datetime
import os
import json
import pytz

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Google Sheets Config
PLAYERS_ID = "1HfTUoLol3h1DmDeWTDsUqYTjq99SV9NGi-CmB3Wk89g"
STATS_ID = "18_9UkJ3MAsNw4ByOGFDqOBE2u1gnpxQSR3tPi-_9i3I"
STATS_ID_DEMO = "1Asvw6nIR0RojdwtQvT8QFc2NqEdm78zaE7qsGYafR0M"

def get_gspread_client():
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    
    # Check if we are on Render
    google_json = os.environ.get("GOOGLE_JSON")
    
    if google_json:
        # Parse the JSON string from the environment variable
        creds_dict = json.loads(google_json)
        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
    else:
        # Fallback for your local laptop
        creds = Credentials.from_service_account_file("service_account.json", scopes=scopes)
    
    return gspread.authorize(creds)

client = get_gspread_client()

@app.route('/players', methods=['GET'])
def get_players():
    try:
        sh = client.open_by_key(PLAYERS_ID)
        # Using a list instead of a dict to preserve tab order
        ordered_data = [] 
        
        for ws in sh.worksheets():
            rows = ws.get_all_values()
            deck_list = []
            pfp_url = ""
            
            for row in rows[1:]:
                deck_name = row[0] if len(row) > 0 else ""
                art_url = row[1] if len(row) > 1 else ""
                art_url_partner = row[2] if len(row) > 2 else ""
                color_id = row[3] if len(row) > 3 else ""
                
                if deck_name.upper() == "PFP":
                    pfp_url = art_url
                elif deck_name:
                    deck_list.append({
                        "deck": deck_name,
                        "artUrl": art_url,
                        "artUrlPartner": art_url_partner,
                        "colors": color_id,
                    })
            
            # Add each player as an object to the list
            ordered_data.append({
                "player_name": ws.title,
                "decks": deck_list,
                "pfp": pfp_url
            })
            
        return jsonify(ordered_data)
    except Exception as e:
        print(f"Error fetching players: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/submit', methods=['POST'])
def submit_stats():
    try:
        data = request.json
        sh = client.open_by_key(STATS_ID)
        
        summary_ws = sh.worksheet("Game_Summary")
        performance_ws = sh.worksheet("Player_Performance")
        game_id = f"G-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4]}"
        
        raw_ts = data.get('timestamp', '')
        try:
            dt = datetime.fromisoformat(raw_ts.replace('Z', '+00:00'))
            local_tz = pytz.timezone('America/Denver')
            timestamp = dt.astimezone(local_tz).strftime('%Y-%m-%d %H:%M:%S')
        except:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Find the winner (turn_died == 'win')
        winner = next((p for p in data['players'] if p['turn_died'] == 'win'), data['players'][0])
        # Log to Game_Summary
        summary_row = [
    game_id,
    data.get('mulligan_type', ''),
    winner.get('seat_position'),
    winner.get('player', ''),
    winner.get('deck', ''),
    data.get('turn', 0),
    timestamp
]
        summary_ws.append_row(summary_row)

        # Log each player to Player_Performance
        rows_to_insert = []
        for p in data['players']:
            # Mapping including the new seat_position (Column I)
            perf_row = [
    game_id,
    p.get('player', ''),
    p.get('deck', ''),
    p.get('deck_owner', p.get('player', '')),  # deck owner, falls back to player
    p.get('stats', {}).get('startLands'),
    p.get('stats', {}).get('lands'),
    p.get('stats', {}).get('rocks'),
    p.get('stats', {}).get('dorks'),
    p.get('turn_died'),
    p.get('seat_position'),
    p.get('colors', '')
]
            rows_to_insert.append(perf_row)

        # Using append_rows for efficiency
        performance_ws.append_rows(rows_to_insert)

        print(f"Game {game_id} successfully logged with Seat Positions.")
        return jsonify({"status": "success", "game_id": game_id})
    
    except Exception as e:
        print(f"Error submitting game: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/submit-demo', methods=['POST'])
def submit_demo():
    request_data = request.json
    try:
        client = get_gspread_client()
        sh = client.open_by_key(STATS_ID_DEMO)
        
        summary_ws = sh.worksheet("Game_Summary")
        performance_ws = sh.worksheet("Player_Performance")

        game_id = f"G-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4]}"
        
        raw_ts = request_data.get('timestamp', '')
        try:
            dt = datetime.fromisoformat(raw_ts.replace('Z', '+00:00'))
            local_tz = pytz.timezone('America/Denver')
            timestamp = dt.astimezone(local_tz).strftime('%Y-%m-%d %H:%M:%S')
        except:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        winner = next((p for p in request_data['players'] if p['turn_died'] == 'win'), request_data['players'][0])
        
        summary_row = [
            game_id,
            request_data.get('mulligan_type', ''),
            winner.get('seat_position'),
            winner.get('player', ''),
            winner.get('deck', ''),
            request_data.get('turn', 0),
            timestamp
        ]
        summary_ws.append_row(summary_row)

        rows_to_insert = []
        for p in request_data['players']:
            perf_row = [
                game_id,
                p.get('player', ''),
                p.get('deck', ''),
                p.get('deck_owner', p.get('player', '')),
                p.get('stats', {}).get('startLands'),
                p.get('stats', {}).get('lands'),
                p.get('stats', {}).get('rocks'),
                p.get('stats', {}).get('dorks'),
                p.get('turn_died'),
                p.get('seat_position'),
                p.get('colors', '')
            ]
            rows_to_insert.append(perf_row)

        performance_ws.append_rows(rows_to_insert)
        return jsonify({"status": "success", "game_id": game_id})
    
    except Exception as e:
        print(f"Error submitting demo game: {e}")
        return jsonify({"error": str(e)}), 500

def _find_deck_row(ws, deck_name):
    values = ws.get_all_values()
    for idx, row in enumerate(values):
        if len(row) > 0 and row[0].strip().lower() == deck_name.strip().lower():
            return idx + 1  # 1-indexed for gspread
    return None

@app.route('/players/add_player', methods=['POST'])
def add_player():
    try:
        data = request.json
        player_name = data.get('player_name', '').strip()
        if not player_name:
            return jsonify({"error": "player_name required"}), 400
        sh = client.open_by_key(PLAYERS_ID)
        ws = sh.add_worksheet(title=player_name, rows=50, cols=4)
        ws.append_row(["Deck Name", "Art_URL", "Art_URL_Partner", "Color_ID"])
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error adding player: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/delete_player', methods=['POST'])
def delete_player():
    try:
        data = request.json
        player_name = data.get('player_name', '').strip()
        sh = client.open_by_key(PLAYERS_ID)
        ws = sh.worksheet(player_name)
        sh.del_worksheet(ws)
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error deleting player: {e}")
        return jsonify({"error": str(e)}), 500

def _find_next_blank_row(ws):
    # Column A may have pre-loaded checkboxes sitting in column E on blank rows,
    # so we write new decks into the next row where column A is empty rather
    # than appending after the last row of ANY data (which could skip past
    # those pre-loaded rows or land on the wrong one).
    col_a = ws.col_values(1)
    for idx, val in enumerate(col_a):
        if idx == 0:
            continue  # skip header row
        if val.strip() == '':
            return idx + 1  # 1-indexed row number
    return len(col_a) + 1  # no blank row found, use the next row after the last

@app.route('/players/add_deck', methods=['POST'])
def add_deck():
    try:
        data = request.json
        sh = client.open_by_key(PLAYERS_ID)
        ws = sh.worksheet(data.get('player_name', ''))
        row = _find_next_blank_row(ws)
        ws.update(f"A{row}:D{row}", [[
            data.get('deck', ''),
            data.get('art_url', ''),
            data.get('art_url_partner', ''),
            data.get('colors', ''),
        ]])
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error adding deck: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/update_deck', methods=['POST'])
def update_deck():
    try:
        data = request.json
        sh = client.open_by_key(PLAYERS_ID)
        ws = sh.worksheet(data.get('player_name', ''))
        row = _find_deck_row(ws, data.get('original_deck', ''))
        if row is None:
            return jsonify({"error": "Deck not found"}), 404
        ws.update(f"A{row}:D{row}", [[
            data.get('deck', ''),
            data.get('art_url', ''),
            data.get('art_url_partner', ''),
            data.get('colors', ''),
        ]])
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error updating deck: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/delete_deck', methods=['POST'])
def delete_deck():
    try:
        data = request.json
        sh = client.open_by_key(PLAYERS_ID)
        ws = sh.worksheet(data.get('player_name', ''))
        row = _find_deck_row(ws, data.get('deck', ''))
        if row is None:
            return jsonify({"error": "Deck not found"}), 404
        ws.delete_rows(row)
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error deleting deck: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/update_pfp', methods=['POST'])
def update_pfp():
    try:
        data = request.json
        sh = client.open_by_key(PLAYERS_ID)
        ws = sh.worksheet(data.get('player_name', ''))
        row = _find_deck_row(ws, "PFP")
        art_url = data.get('art_url', '')
        if row is None:
            ws.append_row(["PFP", art_url, "", ""])
        else:
            ws.update(f"A{row}:D{row}", [["PFP", art_url, "", ""]])
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error updating pfp: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8000, debug=True, use_reloader=False)
