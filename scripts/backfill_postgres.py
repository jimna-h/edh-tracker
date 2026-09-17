"""
One-time backfill: copies current Google Sheets data into a fresh Neon
Postgres database (schema.sql must already be applied).

Truncates and reloads on every run, so it's safe to re-run against an
empty/staging DB while iterating, but must NOT be run against a DB that
already has real production data you want to keep.

Usage:
    DATABASE_URL=postgresql://... python scripts/backfill_postgres.py
"""

import json
import os
import sys

import gspread
import psycopg
import pytz
from datetime import datetime
from google.oauth2.service_account import Credentials

PLAYERS_ID = "1HfTUoLol3h1DmDeWTDsUqYTjq99SV9NGi-CmB3Wk89g"
STATS_ID = "18_9UkJ3MAsNw4ByOGFDqOBE2u1gnpxQSR3tPi-_9i3I"


def get_gspread_client():
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    google_json = os.environ.get("GOOGLE_JSON")
    if google_json:
        creds_dict = json.loads(google_json)
        creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
    else:
        creds = Credentials.from_service_account_file("service_account.json", scopes=scopes)
    return gspread.authorize(creds)


def get_db_connection():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required.", file=sys.stderr)
        sys.exit(1)
    return psycopg.connect(database_url)


def parse_timestamp(raw_ts):
    try:
        dt = datetime.fromisoformat(raw_ts)
        local_tz = pytz.timezone('America/Denver')
        if dt.tzinfo is None:
            return local_tz.localize(dt)
        return dt.astimezone(local_tz)
    except Exception:
        return datetime.now(pytz.timezone('America/Denver'))


def backfill_players(gs_client, conn):
    sh = gs_client.open_by_key(PLAYERS_ID)
    with conn.cursor() as cur:
        for sort_order, ws in enumerate(sh.worksheets()):
            rows = ws.get_all_values()
            pfp_url = ""
            deck_rows = []

            for row in rows[1:]:
                deck_name = row[0] if len(row) > 0 else ""
                art_url = row[1] if len(row) > 1 else ""
                art_url_partner = row[2] if len(row) > 2 else ""
                color_id = row[3] if len(row) > 3 else ""
                exclude = (row[4] if len(row) > 4 else "").strip().upper() == "TRUE"
                archidekt = row[5] if len(row) > 5 else ""

                if deck_name.upper() == "PFP":
                    pfp_url = art_url
                elif deck_name:
                    deck_rows.append((deck_name, art_url, art_url_partner, color_id, exclude, archidekt))

            cur.execute(
                "INSERT INTO players (name, pfp_url, sort_order) VALUES (%s, %s, %s) RETURNING id",
                (ws.title, pfp_url, sort_order),
            )
            owner_id = cur.fetchone()[0]

            for row_order, (deck_name, art_url, art_url_partner, color_id, exclude, archidekt) in enumerate(deck_rows):
                cur.execute("""
                    INSERT INTO decks (owner_id, deck_name, art_url, art_url_partner, color_id, exclude, archidekt, row_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (owner_id, deck_name, art_url, art_url_partner, color_id, exclude, archidekt, row_order))

            print(f"  {ws.title}: {len(deck_rows)} decks")
    conn.commit()


def backfill_games(gs_client, conn):
    sh = gs_client.open_by_key(STATS_ID)
    summary_ws = sh.worksheet("Game_Summary")
    performance_ws = sh.worksheet("Player_Performance")

    summary_rows = summary_ws.get_all_values()[1:]
    performance_rows = performance_ws.get_all_values()[1:]

    with conn.cursor() as cur:
        for row in summary_rows:
            if len(row) < 1 or not row[0]:
                continue
            game_id = row[0]
            mulligan_type = row[1] if len(row) > 1 else ""
            winner_seat_position = row[2] if len(row) > 2 else None
            winner_player = row[3] if len(row) > 3 else None
            winner_deck = row[4] if len(row) > 4 else None
            turn_count = int(row[5]) if len(row) > 5 and row[5].strip().isdigit() else None
            played_at = parse_timestamp(row[6]) if len(row) > 6 else datetime.now(pytz.timezone('America/Denver'))

            cur.execute("""
                INSERT INTO games (id, mulligan_type, winner_seat_position, winner_player, winner_deck, turn_count, played_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (game_id, mulligan_type, winner_seat_position, winner_player, winner_deck, turn_count, played_at))

        for row in performance_rows:
            if len(row) < 1 or not row[0]:
                continue

            def col(i):
                return row[i] if len(row) > i and row[i] != '' else None

            def col_int(i):
                v = col(i)
                return int(v) if v is not None and v.strip().lstrip('-').isdigit() else None

            deck_owner = col(3) or ''
            deck_name = col(2) or ''
            cur.execute("""
                SELECT d.id FROM decks d
                JOIN players pl ON pl.id = d.owner_id
                WHERE pl.name = %s AND LOWER(TRIM(d.deck_name)) = LOWER(TRIM(%s))
            """, (deck_owner, deck_name))
            deck_row = cur.fetchone()
            deck_id = deck_row[0] if deck_row else None

            cur.execute("""
                INSERT INTO game_performance
                    (game_id, deck_id, player, deck, deck_owner, start_lands, lands, rocks, dorks, turn_died, seat_position, colors, art_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                col(0), deck_id, col(1) or '', deck_name, deck_owner,
                col_int(4), col_int(5), col_int(6), col_int(7),
                col(8), col(9), col(10) or '', col(11) or '',
            ))

    conn.commit()
    print(f"  {len(summary_rows)} games, {len(performance_rows)} performance rows")


def main():
    gs_client = get_gspread_client()
    conn = get_db_connection()

    with conn.cursor() as cur:
        cur.execute("TRUNCATE game_performance, games, decks, players RESTART IDENTITY CASCADE")
    conn.commit()

    print("Backfilling players + decks...")
    backfill_players(gs_client, conn)

    print("Backfilling games + performance...")
    backfill_games(gs_client, conn)

    conn.close()
    print("Done.")


if __name__ == '__main__':
    main()
