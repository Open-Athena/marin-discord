#!/usr/bin/env -S uv run
# /// script
# dependencies = ["aiohttp", "click"]
# ///

"""Archive all messages from a Discord guild, saving per-channel JSON files."""

from click import command, option
from pathlib import Path

import aiohttp
import asyncio
import json
import os
import sys

err = lambda *a, **kw: print(*a, file=sys.stderr, **kw)

BASE = "https://discord.com/api/v10"
DEFAULT_GUILD = "1354881461060243556"
# Text-like channel types: text(0), announcement(5), public thread(11), private thread(12), announcement thread(10)
TEXT_CHANNEL_TYPES = {0, 5, 10, 11, 12}


async def fetch_channels(session, guild_id):
    """Fetch all channels in a guild."""
    async with session.get(f"{BASE}/guilds/{guild_id}/channels") as r:
        r.raise_for_status()
        return await r.json()


async def fetch_messages(session, channel_id, before=None, after=None):
    """Fetch up to 100 messages from a channel, with optional before/after cursor."""
    params = {"limit": 100}
    if before:
        params["before"] = before
    if after:
        params["after"] = after
    while True:
        async with session.get(f"{BASE}/channels/{channel_id}/messages", params=params) as r:
            if r.status == 403:
                return None  # no access
            if r.status == 429:
                body = await r.json()
                retry_after = body.get("retry_after", 5)
                err(f"    rate limited, waiting {retry_after:.1f}s...")
                await asyncio.sleep(retry_after + 0.5)
                continue
            r.raise_for_status()
            return await r.json()


async def archive_channel(session, channel, out_dir):
    """Archive all messages from a single channel, with pagination.

    On first run, paginates backwards from newest to oldest using `before`.
    On subsequent runs, fetches only new messages using `after` the newest existing message.
    """
    channel_id = channel["id"]
    channel_name = channel["name"]
    out_file = out_dir / f"{channel_name}_{channel_id}.json"

    # Load existing messages for incremental fetching
    existing = []
    if out_file.exists():
        existing = json.loads(out_file.read_text())

    if existing:
        # Incremental: fetch new messages after the newest existing one
        newest_id = existing[0]["id"]
        err(f"  #{channel_name}: resuming after {newest_id} ({len(existing)} existing)")
        all_new = []
        after_id = newest_id
        while True:
            messages = await fetch_messages(session, channel_id, after=after_id)
            if messages is None:
                err(f"  #{channel_name}: no access, skipping")
                return 0
            if not messages:
                break
            all_new.extend(messages)
            err(f"  #{channel_name}: fetched {len(all_new)} new messages so far...")
            # `after` returns newer messages; messages[0] is the newest in the batch
            after_id = messages[0]["id"]
            if len(messages) < 100:
                break
            await asyncio.sleep(0.5)
    else:
        # Full fetch: paginate backwards from newest to oldest using `before`
        all_new = []
        before_id = None
        while True:
            messages = await fetch_messages(session, channel_id, before=before_id)
            if messages is None:
                err(f"  #{channel_name}: no access, skipping")
                return 0
            if not messages:
                break
            all_new.extend(messages)
            err(f"  #{channel_name}: fetched {len(all_new)} messages so far...")
            # Default ordering is newest-first; messages[-1] is the oldest in the batch
            before_id = messages[-1]["id"]
            if len(messages) < 100:
                break
            await asyncio.sleep(0.5)

    if not all_new and not existing:
        err(f"  #{channel_name}: empty")
        return 0

    # Merge and deduplicate by ID
    seen = set()
    merged = []
    for msg in all_new + existing:
        if msg["id"] not in seen:
            seen.add(msg["id"])
            merged.append(msg)
    # Sort newest-first by snowflake ID
    merged.sort(key=lambda m: int(m["id"]), reverse=True)

    out_file.write_text(json.dumps(merged, indent=2) + "\n")
    new_count = len(merged) - len(existing)
    err(f"  #{channel_name}: {new_count} new, {len(merged)} total")
    return new_count


async def run(guild_id, out_dir):
    token = os.environ["DISCORD_TOKEN"]
    headers = {
        "Authorization": f"Bot {token}",
        "User-Agent": "MarinBot (https://github.com/Open-Athena/marin-bot, 0.1)",
    }

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    async with aiohttp.ClientSession(headers=headers) as session:
        channels = await fetch_channels(session, guild_id)
        text_channels = [
            ch for ch in channels
            if ch.get("type") in TEXT_CHANNEL_TYPES
        ]
        text_channels.sort(key=lambda ch: ch.get("position", 0))

        err(f"Found {len(text_channels)} text channels (of {len(channels)} total)")

        total_new = 0
        for ch in text_channels:
            new = await archive_channel(session, ch, out_dir)
            total_new += new

        err(f"\nDone: {total_new} new messages across {len(text_channels)} channels")
        err(f"Output: {out_dir}/")


@command()
@option('-g', '--guild', default=DEFAULT_GUILD, help='Guild (server) ID')
@option('-o', '--out-dir', default='archive', help='Output directory for JSON files')
def main(guild, out_dir):
    """Archive all messages from a Discord guild."""
    asyncio.run(run(guild, out_dir))


if __name__ == "__main__":
    main()
