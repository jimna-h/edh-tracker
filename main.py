from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg
from psycopg.rows import dict_row
from psycopg.errors import RestrictViolation
import uuid
from datetime import datetime
import os
import pytz

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def get_db_connection():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        # Fallback for local laptop dev
        database_url = "postgresql://postgres:postgres@localhost:5432/edh_tracker"
    return psycopg.connect(database_url, row_factory=dict_row)

@app.route('/players', methods=['GET'])
def get_players():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, pfp_url FROM players ORDER BY sort_order")
                players = cur.fetchall()

                cur.execute("""
                    SELECT owner_id, deck_name, art_url, art_url_partner, color_id, exclude, archidekt
                    FROM decks
                    ORDER BY owner_id, row_order
                """)
                decks = cur.fetchall()

        decks_by_owner = {}
        for d in decks:
            decks_by_owner.setdefault(d['owner_id'], []).append({
                "deck": d['deck_name'],
                "artUrl": d['art_url'],
                "artUrlPartner": d['art_url_partner'],
                "colors": d['color_id'],
                "exclude": d['exclude'],
                "archidekt": d['archidekt'],
            })

        ordered_data = [{
            "player_name": p['name'],
            "decks": decks_by_owner.get(p['id'], []),
            "pfp": p['pfp_url'],
        } for p in players]

        return jsonify(ordered_data)
    except Exception as e:
        print(f"Error fetching players: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/submit', methods=['POST'])
def submit_stats():
    try:
        data = request.json
        game_id = f"G-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4]}"

        raw_ts = data.get('timestamp', '')
        try:
            dt = datetime.fromisoformat(raw_ts.replace('Z', '+00:00'))
            local_tz = pytz.timezone('America/Denver')
            played_at = dt.astimezone(local_tz)
        except:
            played_at = datetime.now(pytz.timezone('America/Denver'))

        # Find the winner (turn_died == 'win')
        winner = next((p for p in data['players'] if p['turn_died'] == 'win'), data['players'][0])

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO games (id, mulligan_type, winner_seat_position, winner_player, winner_deck, turn_count, played_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    game_id,
                    data.get('mulligan_type', ''),
                    winner.get('seat_position'),
                    winner.get('player', ''),
                    winner.get('deck', ''),
                    data.get('turn', 0),
                    played_at,
                ))

                for p in data['players']:
                    stats = p.get('stats', {})
                    deck_name = p.get('deck', '')
                    deck_owner = p.get('deck_owner', p.get('player', ''))

                    # Resolve deck_id when this row matches a real tracked deck.
                    # Stays NULL for ad hoc "Other"/proxy decks, which never have
                    # a decks row to match.
                    cur.execute("""
                        SELECT d.id FROM decks d
                        JOIN players pl ON pl.id = d.owner_id
                        WHERE pl.name = %s AND LOWER(TRIM(d.deck_name)) = LOWER(TRIM(%s))
                    """, (deck_owner, deck_name))
                    deck_row = cur.fetchone()
                    deck_id = deck_row['id'] if deck_row else None

                    cur.execute("""
                        INSERT INTO game_performance
                            (game_id, deck_id, player, deck, deck_owner, start_lands, lands, rocks, dorks, turn_died, seat_position, colors, art_url)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        game_id,
                        deck_id,
                        p.get('player', ''),
                        deck_name,
                        deck_owner,
                        stats.get('startLands'),
                        stats.get('lands'),
                        stats.get('rocks'),
                        stats.get('dorks'),
                        p.get('turn_died'),
                        p.get('seat_position'),
                        p.get('colors', ''),
                        p.get('art_url', ''),
                    ))
            conn.commit()

        print(f"Game {game_id} successfully logged with Seat Positions.")
        return jsonify({"status": "success", "game_id": game_id})

    except Exception as e:
        print(f"Error submitting game: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/add_player', methods=['POST'])
def add_player():
    try:
        data = request.json
        player_name = data.get('player_name', '').strip()
        if not player_name:
            return jsonify({"error": "player_name required"}), 400
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM players")
                next_order = cur.fetchone()['next_order']
                cur.execute(
                    "INSERT INTO players (name, pfp_url, sort_order) VALUES (%s, '', %s)",
                    (player_name, next_order),
                )
            conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error adding player: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/delete_player', methods=['POST'])
def delete_player():
    try:
        data = request.json
        player_name = data.get('player_name', '').strip()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute("DELETE FROM players WHERE name = %s", (player_name,))
                except RestrictViolation:
                    conn.rollback()
                    return jsonify({"error": "This player has decks with logged games and can't be deleted."}), 409
            conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error deleting player: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/add_deck', methods=['POST'])
def add_deck():
    try:
        data = request.json
        player_name = data.get('player_name', '')
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM players WHERE name = %s", (player_name,))
                row = cur.fetchone()
                if row is None:
                    return jsonify({"error": "Player not found"}), 404
                owner_id = row['id']

                cur.execute("SELECT COALESCE(MAX(row_order), -1) + 1 AS next_order FROM decks WHERE owner_id = %s", (owner_id,))
                next_order = cur.fetchone()['next_order']

                cur.execute("""
                    INSERT INTO decks (owner_id, deck_name, art_url, art_url_partner, color_id, exclude, archidekt, row_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    owner_id,
                    data.get('deck', ''),
                    data.get('art_url', ''),
                    data.get('art_url_partner', ''),
                    data.get('colors', ''),
                    bool(data.get('exclude')),
                    data.get('archidekt', ''),
                    next_order,
                ))
            conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error adding deck: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/update_deck', methods=['POST'])
def update_deck():
    try:
        data = request.json
        player_name = data.get('player_name', '')
        original_deck = data.get('original_deck', '')
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE decks SET
                        deck_name = %s,
                        art_url = %s,
                        art_url_partner = %s,
                        color_id = %s,
                        exclude = %s,
                        archidekt = %s
                    WHERE owner_id = (SELECT id FROM players WHERE name = %s)
                      AND deck_name = %s
                """, (
                    data.get('deck', ''),
                    data.get('art_url', ''),
                    data.get('art_url_partner', ''),
                    data.get('colors', ''),
                    bool(data.get('exclude')),
                    data.get('archidekt', ''),
                    player_name,
                    original_deck,
                ))
                if cur.rowcount == 0:
                    return jsonify({"error": "Deck not found"}), 404
            conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error updating deck: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/delete_deck', methods=['POST'])
def delete_deck():
    try:
        data = request.json
        player_name = data.get('player_name', '')
        deck_name = data.get('deck', '')
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute("""
                        DELETE FROM decks
                        WHERE owner_id = (SELECT id FROM players WHERE name = %s)
                          AND deck_name = %s
                    """, (player_name, deck_name))
                except RestrictViolation:
                    conn.rollback()
                    return jsonify({"error": "This deck has logged games and can't be deleted. Use Exclude instead to retire it."}), 409
                if cur.rowcount == 0:
                    return jsonify({"error": "Deck not found"}), 404
            conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error deleting deck: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/players/update_pfp', methods=['POST'])
def update_pfp():
    try:
        data = request.json
        player_name = data.get('player_name', '')
        art_url = data.get('art_url', '')
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE players SET pfp_url = %s WHERE name = %s", (art_url, player_name))
                if cur.rowcount == 0:
                    return jsonify({"error": "Player not found"}), 404
            conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error updating pfp: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8000, debug=True, use_reloader=False)
