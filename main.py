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
                color_id = row[2] if len(row) > 2 else ""
                
                if deck_name.upper() == "PFP":
                    pfp_url = art_url
                elif deck_name:
                    deck_list.append({
                        "deck": deck_name,
                        "artUrl": art_url,
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
        
        # Find the winner (turn_died == 0)
        winner = next((p for p in data['players'] if p['turn_died'] == 0), data['players'][0])
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

        winner = next((p for p in request_data['players'] if p['turn_died'] == 0), request_data['players'][0])
        
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

if __name__ == '__main__':
    app.run(port=8000, debug=True, use_reloader=False)
