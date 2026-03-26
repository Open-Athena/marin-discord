#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Convert archive JSON files into a normalized SQLite database.

Creates tables: channels, users, messages, attachments, reactions, embeds, threads.
Includes FTS5 full-text search index on message content.
"""

import json
import sqlite3
import sys
from pathlib import Path

err = lambda *a, **kw: print(*a, file=sys.stderr, **kw)

SCHEMA = """
CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type INTEGER NOT NULL,
    position INTEGER
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    global_name TEXT,
    avatar TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    author_id TEXT,
    content TEXT,
    timestamp TEXT NOT NULL,
    edited_timestamp TEXT,
    type INTEGER NOT NULL DEFAULT 0,
    flags INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0,
    reference_message_id TEXT,
    reference_channel_id TEXT,
    thread_id TEXT,
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    filename TEXT,
    content_type TEXT,
    size INTEGER,
    url TEXT,
    proxy_url TEXT,
    width INTEGER,
    height INTEGER,
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE TABLE IF NOT EXISTS reactions (
    message_id TEXT NOT NULL,
    emoji_name TEXT NOT NULL,
    emoji_id TEXT,
    count INTEGER DEFAULT 0,
    PRIMARY KEY (message_id, emoji_name, emoji_id),
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE TABLE IF NOT EXISTS embeds (
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    type TEXT,
    title TEXT,
    description TEXT,
    url TEXT,
    thumbnail_url TEXT,
    thumbnail_width INTEGER,
    thumbnail_height INTEGER,
    image_url TEXT,
    FOREIGN KEY (message_id) REFERENCES messages(id)
);

CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    parent_message_id TEXT,
    parent_channel_id TEXT,
    name TEXT,
    message_count INTEGER,
    member_count INTEGER,
    archived INTEGER DEFAULT 0,
    locked INTEGER DEFAULT 0,
    FOREIGN KEY (parent_channel_id) REFERENCES channels(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_embeds_message_id ON embeds(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
"""

FTS_SCHEMA = """
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    content,
    content='messages',
    content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content) VALUES('delete', old.rowid, old.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content) VALUES('delete', old.rowid, old.content);
    INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
END;
"""


def upsert_user(cur, author):
    """Insert or update a user from a message author object."""
    if not author or not author.get("id"):
        return None
    cur.execute(
        "INSERT OR REPLACE INTO users (id, username, global_name, avatar) VALUES (?, ?, ?, ?)",
        (author["id"], author.get("username"), author.get("global_name"), author.get("avatar")),
    )
    return author["id"]


def insert_message(cur, msg, channel_id):
    """Insert a single message and its related data."""
    author_id = upsert_user(cur, msg.get("author"))

    ref = msg.get("message_reference")
    ref_msg_id = ref.get("message_id") if ref else None
    ref_ch_id = ref.get("channel_id") if ref else None

    thread = msg.get("thread")
    thread_id = thread["id"] if thread else None

    cur.execute(
        """INSERT OR IGNORE INTO messages
           (id, channel_id, author_id, content, timestamp, edited_timestamp,
            type, flags, pinned, reference_message_id, reference_channel_id, thread_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            msg["id"], channel_id, author_id, msg.get("content"),
            msg["timestamp"], msg.get("edited_timestamp"),
            msg.get("type", 0), msg.get("flags", 0), int(msg.get("pinned", False)),
            ref_msg_id, ref_ch_id, thread_id,
        ),
    )

    # Attachments
    for att in msg.get("attachments", []):
        cur.execute(
            """INSERT OR IGNORE INTO attachments
               (id, message_id, filename, content_type, size, url, proxy_url, width, height)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                att["id"], msg["id"], att.get("filename"), att.get("content_type"),
                att.get("size"), att.get("url"), att.get("proxy_url"),
                att.get("width"), att.get("height"),
            ),
        )

    # Reactions
    for r in msg.get("reactions", []):
        emoji = r.get("emoji", {})
        cur.execute(
            """INSERT OR REPLACE INTO reactions (message_id, emoji_name, emoji_id, count)
               VALUES (?, ?, ?, ?)""",
            (msg["id"], emoji.get("name", ""), emoji.get("id"), r.get("count", 0)),
        )

    # Embeds
    for embed in msg.get("embeds", []):
        thumb = embed.get("thumbnail", {})
        cur.execute(
            """INSERT INTO embeds
               (message_id, type, title, description, url, thumbnail_url,
                thumbnail_width, thumbnail_height, image_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                msg["id"], embed.get("type"), embed.get("title"),
                embed.get("description"), embed.get("url"),
                thumb.get("url"), thumb.get("width"), thumb.get("height"),
                embed.get("image", {}).get("url"),
            ),
        )

    # Thread metadata
    if thread:
        meta = thread.get("thread_metadata", {})
        cur.execute(
            """INSERT OR REPLACE INTO threads
               (id, parent_message_id, parent_channel_id, name,
                message_count, member_count, archived, locked)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                thread["id"], msg["id"], channel_id, thread.get("name"),
                thread.get("message_count"), thread.get("member_count"),
                int(meta.get("archived", False)), int(meta.get("locked", False)),
            ),
        )


def load_channel_file(cur, filepath, channel_id, channel_name, channel_type=0, position=0):
    """Load all messages from a JSON archive file into the database."""
    messages = json.loads(filepath.read_text())
    if not messages:
        return 0

    cur.execute(
        "INSERT OR REPLACE INTO channels (id, name, type, position) VALUES (?, ?, ?, ?)",
        (channel_id, channel_name, channel_type, position),
    )

    for msg in messages:
        insert_message(cur, msg, channel_id)

    return len(messages)


def build_db(archive_dir, db_path):
    """Build SQLite database from archive JSON files."""
    archive_dir = Path(archive_dir)
    db_path = Path(db_path)

    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    cur.executescript(SCHEMA)
    cur.executescript(FTS_SCHEMA)

    import re
    total_msgs = 0

    # Load channel files
    channel_files = sorted(archive_dir.glob("*.json"))
    for fp in channel_files:
        if fp.name == "index.json":
            continue
        m = re.match(r"^(.+)_(\d+)\.json$", fp.name)
        if not m:
            err(f"Skipping {fp.name}: doesn't match expected pattern")
            continue

        channel_name = m.group(1)
        channel_id = m.group(2)
        count = load_channel_file(cur, fp, channel_id, channel_name)
        err(f"  #{channel_name}: {count} messages")
        total_msgs += count

    # Load thread files
    threads_dir = archive_dir / "threads"
    if threads_dir.is_dir():
        thread_files = sorted(threads_dir.glob("*.json"))
        for fp in thread_files:
            m = re.match(r"^(.+)_(\d+)\.json$", fp.name)
            if not m:
                continue
            thread_name = m.group(1)
            thread_id = m.group(2)
            # Thread channels are type 11 (public thread)
            count = load_channel_file(cur, fp, thread_id, thread_name, channel_type=11)
            total_msgs += count
        err(f"  Threads: {len(thread_files)} files loaded")

    # Populate FTS index for existing rows
    cur.execute("INSERT INTO messages_fts(messages_fts) VALUES('rebuild')")

    conn.commit()

    # Stats
    cur.execute("SELECT COUNT(*) FROM messages")
    msg_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM users")
    user_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM channels")
    ch_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM attachments")
    att_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM reactions")
    rxn_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM embeds")
    embed_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM threads")
    thread_count = cur.fetchone()[0]

    conn.close()

    size_mb = db_path.stat().st_size / 1024 / 1024
    err(f"\nWrote {db_path} ({size_mb:.1f} MB)")
    err(f"  {ch_count} channels, {msg_count} messages, {user_count} users")
    err(f"  {att_count} attachments, {rxn_count} reactions, {embed_count} embeds, {thread_count} threads")


if __name__ == "__main__":
    archive_dir = sys.argv[1] if len(sys.argv) > 1 else "archive"
    db_path = sys.argv[2] if len(sys.argv) > 2 else "archive.db"
    build_db(archive_dir, db_path)
