#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = ["click"]
# ///
"""Incremental sync from local archive.db to D1.

Compares local DB against D1's _metadata.last_message_id to find new
messages, users, attachments, reactions, and embeds, then applies
INSERT OR REPLACE statements to D1.

Usage:
    ./d1-sync.py                    # sync to local D1
    ./d1-sync.py --remote           # sync to remote D1
    ./d1-sync.py --dry-run          # show SQL without applying
"""

import json
import sqlite3
import subprocess
import tempfile
from pathlib import Path

from click import command, option

DB_NAME = "marin-discord"


def query_d1(sql: str, remote: bool) -> str:
    """Execute a query on D1 and return stdout."""
    cmd = ["npx", "wrangler", "d1", "execute", DB_NAME, f"--command={sql}", "--json", "--yes"]
    if remote:
        cmd.append("--remote")
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path(__file__).parent)
    return result.stdout


def get_last_synced_id(remote: bool) -> str | None:
    """Get the last synced message ID from D1 metadata."""
    out = query_d1("SELECT value FROM _metadata WHERE key = 'last_message_id'", remote)
    try:
        data = json.loads(out)
        for item in data:
            results = item.get("results", [])
            if results:
                return results[0]["value"]
    except (json.JSONDecodeError, KeyError, IndexError):
        pass
    return None


def escape_sql(val: object) -> str:
    """Escape a value for SQL insertion."""
    if val is None:
        return "NULL"
    if isinstance(val, int):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"


def generate_sync_sql(db_path: str, after_id: str | None) -> str:
    """Generate INSERT OR REPLACE SQL for new data since after_id."""
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    lines: list[str] = []

    # New messages (and their related data)
    if after_id:
        msgs = db.execute(
            "SELECT * FROM messages WHERE CAST(id AS INTEGER) > CAST(? AS INTEGER) ORDER BY CAST(id AS INTEGER)",
            (after_id,),
        ).fetchall()
    else:
        msgs = db.execute("SELECT * FROM messages ORDER BY CAST(id AS INTEGER)").fetchall()

    msg_ids = [m["id"] for m in msgs]

    if not msg_ids:
        db.close()
        return ""

    # Collect all new user IDs (from new messages)
    new_author_ids = list({m["author_id"] for m in msgs if m["author_id"]})

    # Users — INSERT OR REPLACE for any referenced by new messages
    if new_author_ids:
        placeholders = ",".join("?" for _ in new_author_ids)
        users = db.execute(f"SELECT * FROM users WHERE id IN ({placeholders})", new_author_ids).fetchall()
        for u in users:
            cols = u.keys()
            vals = ", ".join(escape_sql(u[c]) for c in cols)
            lines.append(f"INSERT OR REPLACE INTO users ({', '.join(cols)}) VALUES ({vals});")

    # Channels — always sync all (small table, ensures mentions resolve)
    channels = db.execute("SELECT * FROM channels").fetchall()
    for ch in channels:
        cols = ch.keys()
        vals = ", ".join(escape_sql(ch[c]) for c in cols)
        lines.append(f"INSERT OR REPLACE INTO channels ({', '.join(cols)}) VALUES ({vals});")

    # Messages
    for m in msgs:
        cols = m.keys()
        vals = ", ".join(escape_sql(m[c]) for c in cols)
        lines.append(f"INSERT OR REPLACE INTO messages ({', '.join(cols)}) VALUES ({vals});")

    # Attachments, reactions, embeds for new messages
    placeholders = ",".join("?" for _ in msg_ids)
    for table in ("attachments", "reactions", "embeds"):
        rows = db.execute(
            f"SELECT * FROM {table} WHERE message_id IN ({placeholders})",
            msg_ids,
        ).fetchall()
        for r in rows:
            cols = r.keys()
            vals = ", ".join(escape_sql(r[c]) for c in cols)
            lines.append(f"INSERT OR REPLACE INTO {table} ({', '.join(cols)}) VALUES ({vals});")

    # Threads — sync all (small table)
    threads = db.execute("SELECT * FROM threads").fetchall()
    for t in threads:
        cols = t.keys()
        vals = ", ".join(escape_sql(t[c]) for c in cols)
        lines.append(f"INSERT OR REPLACE INTO threads ({', '.join(cols)}) VALUES ({vals});")

    # Update metadata
    max_id = max(msg_ids, key=lambda x: int(x))
    lines.append(f"INSERT OR REPLACE INTO _metadata VALUES ('last_message_id', '{max_id}');")

    # Rebuild FTS index
    lines.append("INSERT INTO messages_fts(messages_fts) VALUES('rebuild');")

    db.close()
    return "\n".join(lines)


@command()
@option('-d', '--db-path', default='../archive.db', help='Path to local archive.db')
@option('-r', '--remote', is_flag=True, help='Sync to remote D1 (default: local)')
@option('-n', '--dry-run', is_flag=True, help='Print SQL without applying')
def main(db_path: str, remote: bool, dry_run: bool):
    after_id = get_last_synced_id(remote)
    if after_id:
        print(f"Last synced message ID: {after_id}")
    else:
        print("No previous sync found, syncing all data")

    sql = generate_sync_sql(db_path, after_id)
    if not sql:
        print("No new messages to sync")
        return

    line_count = sql.count("\n") + 1
    print(f"Generated {line_count} SQL statements")

    if dry_run:
        print(sql[:2000])
        if len(sql) > 2000:
            print(f"... ({len(sql)} chars total)")
        return

    # Write to temp file and execute via wrangler
    with tempfile.NamedTemporaryFile(mode="w", suffix=".sql", delete=False) as f:
        f.write(sql)
        sql_path = f.name

    print(f"Applying to {'remote' if remote else 'local'} D1...")
    cmd = ["npx", "wrangler", "d1", "execute", DB_NAME, f"--file={sql_path}", "--yes"]
    if remote:
        cmd.append("--remote")
    result = subprocess.run(cmd, cwd=Path(__file__).parent)

    Path(sql_path).unlink()

    if result.returncode == 0:
        print("Sync complete")
    else:
        print(f"Sync failed (exit code {result.returncode})")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
