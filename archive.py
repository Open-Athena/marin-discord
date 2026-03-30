#!/usr/bin/env -S uv run
# /// script
# dependencies = ["aiohttp", "click"]
# ///

"""Archive all messages from a Discord guild, saving per-channel JSON files.

Downloads attachments and fetches thread messages.
"""

from click import command, option
from pathlib import Path

import aiohttp
import asyncio
import json
import os
import sys

err = lambda *a, **kw: print(*a, file=sys.stderr, **kw)

BASE = "https://discord.com/api/v10"
DEFAULT_GUILD = os.environ.get("DISCORD_GUILD", "")
# Text-like channel types: text(0), announcement(5), public thread(11), private thread(12), announcement thread(10)
TEXT_CHANNEL_TYPES = {0, 5, 10, 11, 12}


async def api_get(session, url, params=None):
    """GET with 429 retry handling."""
    while True:
        async with session.get(url, params=params) as r:
            if r.status == 429:
                body = await r.json()
                retry_after = body.get("retry_after", 5)
                err(f"    rate limited, waiting {retry_after:.1f}s...")
                await asyncio.sleep(retry_after + 0.5)
                continue
            return r.status, await r.read(), r.content_type


async def fetch_channels(session, guild_id):
    """Fetch all channels in a guild."""
    status, body, _ = await api_get(session, f"{BASE}/guilds/{guild_id}/channels")
    if status != 200:
        raise RuntimeError(f"Failed to fetch channels: {status}")
    return json.loads(body)


async def fetch_messages(session, channel_id, before=None, after=None):
    """Fetch up to 100 messages from a channel, with optional before/after cursor."""
    params = {"limit": 100}
    if before:
        params["before"] = before
    if after:
        params["after"] = after
    status, body, _ = await api_get(session, f"{BASE}/channels/{channel_id}/messages", params)
    if status == 403:
        return None
    if status != 200:
        raise RuntimeError(f"Failed to fetch messages from {channel_id}: {status} {body[:200]}")
    return json.loads(body)


async def download_attachment(session, attachment, attachments_dir):
    """Download a single attachment if not already on disk."""
    att_id = attachment["id"]
    filename = attachment.get("filename", "unknown")
    # Use {attachment_id}_{filename} to avoid collisions
    out_path = attachments_dir / f"{att_id}_{filename}"
    if out_path.exists():
        return False
    url = attachment["url"]
    try:
        async with session.get(url) as r:
            if r.status == 200:
                out_path.write_bytes(await r.read())
                return True
            else:
                err(f"    attachment {filename}: HTTP {r.status}")
                return False
    except Exception as e:
        err(f"    attachment {filename}: {e}")
        return False


async def download_attachments(session, messages, attachments_dir):
    """Download all attachments from a list of messages."""
    count = 0
    for msg in messages:
        for att in msg.get("attachments", []):
            if att.get("url"):
                if await download_attachment(session, att, attachments_dir):
                    count += 1
    return count


async def paginate_all(session, channel_id, channel_name, existing=None):
    """Fetch all messages from a channel with pagination.

    If existing messages are provided, does incremental fetch (new messages only).
    Otherwise, does full backwards pagination.
    Returns (new_messages, is_accessible).
    """
    if existing:
        newest_id = existing[0]["id"]
        err(f"  #{channel_name}: resuming after {newest_id} ({len(existing)} existing)")
        all_new = []
        after_id = newest_id
        while True:
            messages = await fetch_messages(session, channel_id, after=after_id)
            if messages is None:
                err(f"  #{channel_name}: no access, skipping")
                return [], False
            if not messages:
                break
            all_new.extend(messages)
            err(f"  #{channel_name}: fetched {len(all_new)} new messages so far...")
            after_id = messages[0]["id"]
            if len(messages) < 100:
                break
            await asyncio.sleep(0.5)
        return all_new, True

    all_new = []
    before_id = None
    while True:
        messages = await fetch_messages(session, channel_id, before=before_id)
        if messages is None:
            err(f"  #{channel_name}: no access, skipping")
            return [], False
        if not messages:
            break
        all_new.extend(messages)
        err(f"  #{channel_name}: fetched {len(all_new)} messages so far...")
        before_id = messages[-1]["id"]
        if len(messages) < 100:
            break
        await asyncio.sleep(0.5)
    return all_new, True


def merge_messages(new_messages, existing):
    """Merge and deduplicate messages, sorted newest-first by snowflake ID."""
    seen = set()
    merged = []
    for msg in new_messages + existing:
        if msg["id"] not in seen:
            seen.add(msg["id"])
            merged.append(msg)
    merged.sort(key=lambda m: int(m["id"]), reverse=True)
    return merged


def safe_filename(name, max_len=80):
    """Sanitize a name for use as a filename."""
    name = name.replace("/", "_").replace("\\", "_").replace("\0", "_")
    if len(name) > max_len:
        name = name[:max_len]
    return name


async def archive_channel(session, channel_id, channel_name, out_dir, attachments_dir):
    """Archive all messages from a single channel/thread."""
    out_file = out_dir / f"{safe_filename(channel_name)}_{channel_id}.json"

    existing = []
    if out_file.exists():
        existing = json.loads(out_file.read_text())

    new_messages, accessible = await paginate_all(session, channel_id, channel_name, existing or None)
    if not accessible:
        return 0, 0

    if not new_messages and not existing:
        err(f"  #{channel_name}: empty")
        return 0, 0

    merged = merge_messages(new_messages, existing)
    out_file.write_text(json.dumps(merged, indent=2) + "\n")
    new_count = len(merged) - len(existing)

    # Download attachments from new messages
    att_count = 0
    if new_messages and attachments_dir:
        att_count = await download_attachments(session, new_messages, attachments_dir)

    suffix = f", {att_count} attachments" if att_count else ""
    err(f"  #{channel_name}: {new_count} new, {len(merged)} total{suffix}")
    return new_count, att_count


def collect_thread_ids(archive_dir):
    """Scan archived messages for thread references, return {thread_id: thread_name}."""
    threads = {}
    for f in archive_dir.glob("*.json"):
        if f.name == "index.json":
            continue
        messages = json.loads(f.read_text())
        for msg in messages:
            thread = msg.get("thread")
            if thread:
                threads[thread["id"]] = thread.get("name", f"thread-{thread['id']}")
    return threads


async def backfill_attachments(session, out_dir, attachments_dir):
    """Download missing attachments by re-fetching messages from the API for fresh CDN URLs."""
    attachments_dir.mkdir(exist_ok=True)
    total = 0
    downloaded = 0
    failed = 0
    skipped = 0

    # Collect all message IDs with missing attachments, grouped by channel
    missing_by_channel: dict[str, list[dict]] = {}
    json_files = sorted(out_dir.glob("*.json"))
    threads_dir = out_dir / "threads"
    if threads_dir.is_dir():
        json_files += sorted(threads_dir.glob("*.json"))

    for f in json_files:
        if f.name == "index.json":
            continue
        messages = json.loads(f.read_text())
        for msg in messages:
            for att in msg.get("attachments", []):
                if not att.get("url"):
                    continue
                total += 1
                att_id = att["id"]
                filename = att.get("filename", "unknown")
                if (attachments_dir / f"{att_id}_{filename}").exists():
                    skipped += 1
                    continue
                ch_id = msg.get("channel_id")
                if ch_id:
                    missing_by_channel.setdefault(ch_id, []).append(msg)

    missing_count = total - skipped
    if not missing_count:
        err("All attachments already downloaded")
        return

    err(f"Need to download {missing_count} attachments across {len(missing_by_channel)} channels")

    # Re-fetch each message individually to get fresh CDN URLs
    seen_msgs: set[str] = set()
    for ch_id, msgs in missing_by_channel.items():
        for msg in msgs:
            msg_id = msg["id"]
            if msg_id in seen_msgs:
                continue
            seen_msgs.add(msg_id)

            # Fetch fresh message from API
            status, body, _ = await api_get(session, f"{BASE}/channels/{ch_id}/messages/{msg_id}")
            if status != 200:
                err(f"  msg {msg_id}: HTTP {status}")
                for att in msg.get("attachments", []):
                    att_id = att["id"]
                    filename = att.get("filename", "unknown")
                    if not (attachments_dir / f"{att_id}_{filename}").exists():
                        failed += 1
                continue

            fresh_msg = json.loads(body)
            for att in fresh_msg.get("attachments", []):
                att_id = att["id"]
                filename = att.get("filename", "unknown")
                if (attachments_dir / f"{att_id}_{filename}").exists():
                    continue
                if await download_attachment(session, att, attachments_dir):
                    downloaded += 1
                else:
                    failed += 1

            if (downloaded + failed) % 50 == 0 and (downloaded + failed) > 0:
                err(f"  progress: {downloaded} downloaded, {failed} failed, {skipped} skipped / {total} total")
            await asyncio.sleep(0.3)

    err(f"Backfill complete: {downloaded} downloaded, {failed} failed, {skipped} already existed, {total} total")


async def run(guild_id, out_dir, download_att, fetch_threads, backfill_att=False):
    token = os.environ["DISCORD_TOKEN"]
    headers = {
        "Authorization": f"Bot {token}",
        "User-Agent": "discord-archive (https://github.com/Open-Athena/marin-bot, 0.1)",
    }

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    attachments_dir = None
    if download_att:
        attachments_dir = out_dir / "attachments"
        attachments_dir.mkdir(exist_ok=True)

    threads_dir = None
    if fetch_threads:
        threads_dir = out_dir / "threads"
        threads_dir.mkdir(exist_ok=True)

    async with aiohttp.ClientSession(headers=headers) as session:
        # Phase 1: archive channels
        channels = await fetch_channels(session, guild_id)
        text_channels = [
            ch for ch in channels
            if ch.get("type") in TEXT_CHANNEL_TYPES
        ]
        text_channels.sort(key=lambda ch: ch.get("position", 0))

        err(f"Found {len(text_channels)} text channels (of {len(channels)} total)")

        total_new = 0
        total_att = 0
        for ch in text_channels:
            new, att = await archive_channel(
                session, ch["id"], ch["name"], out_dir, attachments_dir,
            )
            total_new += new
            total_att += att

        err(f"\nChannels done: {total_new} new messages, {total_att} attachments")

        # Phase 2: archive threads
        if fetch_threads:
            thread_ids = collect_thread_ids(out_dir)
            err(f"\nFound {len(thread_ids)} threads to archive")

            thread_new = 0
            thread_att = 0
            for thread_id, thread_name in sorted(thread_ids.items()):
                new, att = await archive_channel(
                    session, thread_id, thread_name, threads_dir, attachments_dir,
                )
                thread_new += new
                thread_att += att

            err(f"Threads done: {thread_new} new messages, {thread_att} attachments")
            total_new += thread_new
            total_att += thread_att

        err(f"\nTotal: {total_new} new messages, {total_att} attachments")

        # Phase 3: backfill attachments from all archived messages
        if backfill_att:
            err(f"\nBackfilling attachments...")
            att_dir = out_dir / "attachments"
            await backfill_attachments(session, out_dir, att_dir)

        err(f"Output: {out_dir}/")


@command()
@option('-A', '--no-attachments', is_flag=True, help='Skip downloading attachments')
@option('-b', '--backfill-attachments', is_flag=True, help='Download all missing attachments from existing archive')
@option('-g', '--guild', default=DEFAULT_GUILD, required=not DEFAULT_GUILD, help='Guild (server) ID, or set DISCORD_GUILD env var')
@option('-o', '--out-dir', default='archive', help='Output directory for JSON files')
@option('-T', '--no-threads', is_flag=True, help='Skip fetching thread messages')
def main(guild, no_attachments, backfill_attachments, no_threads, out_dir):
    """Archive all messages from a Discord guild."""
    asyncio.run(run(guild, out_dir, not no_attachments, not no_threads, backfill_attachments))


if __name__ == "__main__":
    main()
