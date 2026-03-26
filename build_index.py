#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Scan archive/ and generate archive/index.json with channel metadata and user info."""

import json
import re
import sys
from pathlib import Path


def main():
    archive_dir = Path(__file__).parent / "archive"
    if not archive_dir.is_dir():
        print(f"Error: {archive_dir} not found", file=sys.stderr)
        sys.exit(1)

    threads_dir = archive_dir / "threads"
    channels = []
    users = {}
    # Map thread ID → thread file basename (for linking)
    thread_files = {}
    if threads_dir.is_dir():
        for tf in threads_dir.glob("*.json"):
            # Thread files: "Thread Name_ID.json"
            m = re.match(r"^(.+)_(\d+)\.json$", tf.name)
            if m:
                thread_files[m.group(2)] = tf.name

    for fp in sorted(archive_dir.glob("*.json")):
        if fp.name == "index.json":
            continue
        m = re.match(r"^(.+)_(\d+)\.json$", fp.name)
        if not m:
            print(f"Skipping {fp.name}: doesn't match expected pattern", file=sys.stderr)
            continue

        channel_name = m.group(1)
        channel_id = m.group(2)

        with open(fp) as f:
            messages = json.load(f)

        if not messages:
            continue

        # Collect users
        for msg in messages:
            author = msg.get("author")
            if author and author.get("id"):
                uid = author["id"]
                if uid not in users:
                    users[uid] = {
                        "username": author.get("username"),
                        "global_name": author.get("global_name"),
                        "avatar": author.get("avatar"),
                    }

        # Messages are newest-first in the files
        timestamps = [msg["timestamp"] for msg in messages if msg.get("timestamp")]
        oldest = min(timestamps)
        newest = max(timestamps)

        # Find threads referenced by messages in this channel
        channel_thread_ids = []
        for msg in messages:
            thread = msg.get("thread")
            if thread and thread.get("id"):
                tid = thread["id"]
                if tid in thread_files:
                    channel_thread_ids.append({
                        "id": tid,
                        "name": thread.get("name", ""),
                        "file": thread_files[tid],
                    })

        channels.append({
            "name": channel_name,
            "id": channel_id,
            "file": fp.name,
            "message_count": len(messages),
            "oldest": oldest,
            "newest": newest,
            "threads": channel_thread_ids,
        })

    channels.sort(key=lambda c: c["name"])

    index = {
        "channels": channels,
        "users": users,
        "thread_count": len(thread_files),
    }

    out_path = archive_dir / "index.json"
    with open(out_path, "w") as f:
        json.dump(index, f, indent=2)
        f.write("\n")

    total_msgs = sum(c["message_count"] for c in channels)
    print(f"Wrote {out_path}: {len(channels)} channels, {total_msgs} messages, {len(users)} users", file=sys.stderr)


if __name__ == "__main__":
    main()
