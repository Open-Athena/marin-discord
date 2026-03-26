#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = ["starlette", "uvicorn"]
# ///
"""Local dev API server: serves archive data from SQLite.

Endpoints mirror what D1 Workers would provide in prod.
"""

from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

import sqlite3
import sys
from pathlib import Path

_default_db = Path(__file__).parent / "archive.db"
DB_PATH = sys.argv[1] if len(sys.argv) > 1 else str(_default_db)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def rows_to_dicts(rows):
    return [dict(r) for r in rows]


async def get_channels(request: Request):
    """List all non-thread channels with message counts."""
    db = get_db()
    rows = db.execute("""
        SELECT c.id, c.name, c.type, c.position, COUNT(m.id) as message_count,
               MIN(m.timestamp) as oldest, MAX(m.timestamp) as newest
        FROM channels c
        LEFT JOIN messages m ON m.channel_id = c.id
        WHERE c.type != 11
        GROUP BY c.id
        ORDER BY c.name
    """).fetchall()
    db.close()
    return JSONResponse(rows_to_dicts(rows))


async def get_channel_messages(request: Request):
    """Get messages for a channel, paginated by cursor.

    Query params:
        before: message ID cursor (fetch older messages)
        after: message ID cursor (fetch newer messages)
        limit: max messages to return (default 50, max 200)
    """
    channel_id = request.path_params["channel_id"]
    before = request.query_params.get("before")
    after = request.query_params.get("after")
    limit = min(int(request.query_params.get("limit", 50)), 200)

    db = get_db()

    if after:
        rows = db.execute("""
            SELECT m.*, u.username, u.global_name, u.avatar
            FROM messages m
            LEFT JOIN users u ON m.author_id = u.id
            WHERE m.channel_id = ? AND CAST(m.id AS INTEGER) > CAST(? AS INTEGER)
            ORDER BY CAST(m.id AS INTEGER) ASC
            LIMIT ?
        """, (channel_id, after, limit)).fetchall()
    elif before:
        rows = db.execute("""
            SELECT m.*, u.username, u.global_name, u.avatar
            FROM messages m
            LEFT JOIN users u ON m.author_id = u.id
            WHERE m.channel_id = ? AND CAST(m.id AS INTEGER) < CAST(? AS INTEGER)
            ORDER BY CAST(m.id AS INTEGER) DESC
            LIMIT ?
        """, (channel_id, before, limit)).fetchall()
    else:
        # Default: most recent messages
        rows = db.execute("""
            SELECT m.*, u.username, u.global_name, u.avatar
            FROM messages m
            LEFT JOIN users u ON m.author_id = u.id
            WHERE m.channel_id = ?
            ORDER BY CAST(m.id AS INTEGER) DESC
            LIMIT ?
        """, (channel_id, limit)).fetchall()

    messages = rows_to_dicts(rows)

    # Fetch attachments, reactions, embeds for these messages
    if messages:
        msg_ids = [m["id"] for m in messages]
        placeholders = ",".join("?" * len(msg_ids))

        attachments = db.execute(
            f"SELECT * FROM attachments WHERE message_id IN ({placeholders})", msg_ids
        ).fetchall()
        att_by_msg = {}
        for a in attachments:
            att_by_msg.setdefault(a["message_id"], []).append(dict(a))

        reactions = db.execute(
            f"SELECT * FROM reactions WHERE message_id IN ({placeholders})", msg_ids
        ).fetchall()
        rxn_by_msg = {}
        for r in reactions:
            rxn_by_msg.setdefault(r["message_id"], []).append(dict(r))

        embeds = db.execute(
            f"SELECT * FROM embeds WHERE message_id IN ({placeholders})", msg_ids
        ).fetchall()
        emb_by_msg = {}
        for e in embeds:
            emb_by_msg.setdefault(e["message_id"], []).append(dict(e))

        for m in messages:
            m["attachments"] = att_by_msg.get(m["id"], [])
            m["reactions"] = rxn_by_msg.get(m["id"], [])
            m["embeds"] = emb_by_msg.get(m["id"], [])

    db.close()
    return JSONResponse(messages)


async def get_message(request: Request):
    """Get a single message by ID with its related data."""
    message_id = request.path_params["message_id"]
    db = get_db()

    row = db.execute("""
        SELECT m.*, u.username, u.global_name, u.avatar
        FROM messages m
        LEFT JOIN users u ON m.author_id = u.id
        WHERE m.id = ?
    """, (message_id,)).fetchone()

    if not row:
        db.close()
        return JSONResponse({"error": "not found"}, status_code=404)

    msg = dict(row)
    msg["attachments"] = rows_to_dicts(
        db.execute("SELECT * FROM attachments WHERE message_id = ?", (message_id,)).fetchall()
    )
    msg["reactions"] = rows_to_dicts(
        db.execute("SELECT * FROM reactions WHERE message_id = ?", (message_id,)).fetchall()
    )
    msg["embeds"] = rows_to_dicts(
        db.execute("SELECT * FROM embeds WHERE message_id = ?", (message_id,)).fetchall()
    )

    db.close()
    return JSONResponse(msg)


async def search_messages(request: Request):
    """Full-text search across all messages.

    Query params:
        q: search query
        limit: max results (default 50, max 100)
    """
    query = request.query_params.get("q", "").strip()
    if not query:
        return JSONResponse([])

    limit = min(int(request.query_params.get("limit", 50)), 100)
    db = get_db()

    rows = db.execute("""
        SELECT m.id, m.channel_id, m.content, m.timestamp,
               u.username, u.global_name, u.avatar,
               c.name as channel_name
        FROM messages_fts f
        JOIN messages m ON m.rowid = f.rowid
        LEFT JOIN users u ON m.author_id = u.id
        LEFT JOIN channels c ON m.channel_id = c.id
        WHERE messages_fts MATCH ?
        ORDER BY rank
        LIMIT ?
    """, (query, limit)).fetchall()

    db.close()
    return JSONResponse(rows_to_dicts(rows))


async def get_threads(request: Request):
    """Get threads for a channel."""
    channel_id = request.path_params["channel_id"]
    db = get_db()

    rows = db.execute("""
        SELECT * FROM threads WHERE parent_channel_id = ?
        ORDER BY id DESC
    """, (channel_id,)).fetchall()

    db.close()
    return JSONResponse(rows_to_dicts(rows))


async def get_users(request: Request):
    """Get all users (for avatar/name resolution)."""
    db = get_db()
    rows = db.execute("SELECT * FROM users").fetchall()
    db.close()
    return JSONResponse(rows_to_dicts(rows))


routes = [
    Route("/api/channels", get_channels),
    Route("/api/channels/{channel_id}/messages", get_channel_messages),
    Route("/api/channels/{channel_id}/threads", get_threads),
    Route("/api/messages/{message_id}", get_message),
    Route("/api/search", search_messages),
    Route("/api/users", get_users),
]

app = Starlette(routes=routes)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"])

if __name__ == "__main__":
    import uvicorn
    print(f"Serving {DB_PATH} on http://localhost:5273/api/", file=sys.stderr)
    uvicorn.run(app, host="0.0.0.0", port=5273, log_level="info")
