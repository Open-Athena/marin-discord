#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = ["click"]
# ///
"""Generate weekly Discord activity summaries.

Queries the archive database for a given week's activity, then calls
Claude to generate a structured summary organized by topic/workstream.

Usage:
    ./summarize.py                           # current week (Mon-Sun)
    ./summarize.py --week 2026-03-17         # specific week (starting Monday)
    ./summarize.py --dry-run                 # print raw data, skip LLM call
    ./summarize.py --post-discord CHANNEL_ID # post summary to Discord
    ./summarize.py --post-slack CHANNEL_ID   # post summary to Slack
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

import subprocess

from click import command, option

err = lambda *a, **kw: print(*a, file=sys.stderr, **kw)

DB_PATH = os.environ.get("ARCHIVE_DB", "archive.db")
VIEWER_BASE = os.environ.get("VIEWER_BASE", "")
DISCORD_GUILD_ID = os.environ.get("DISCORD_GUILD", "")

SYSTEM_PROMPT = """\
You are a technical writer summarizing weekly Discord activity for a research \
engineering team. Write concise, informative summaries organized by topic area.

Style guidelines:
- Organized by workstream/topic (use channel names as section headers)
- Tag key people by their Discord display name
- Reference specific channels with #channel-name
- 1-3 sentences per topic, focusing on decisions and progress
- Include links to GitHub PRs/issues when mentioned
- Reference specific messages using the [viewer] and [discord] links provided with each message
- When citing a key discussion point, include a link to the originating message
- Casual but informative tone
- Lead with the most active/important topics
- Skip channels with only bot messages or trivial activity
- End with a "News & Research" section for shared papers/links if any"""

SUMMARY_PROMPT = """\
Generate a weekly summary of this Discord activity for the week of {week_start} to {week_end}.

## Stats
{stats}

## Messages by channel (most active first)
{channel_data}

Write the summary in Markdown. Start with a one-line stats header, then organize by topic."""


def get_week_range(week_start: str | None) -> tuple[str, str]:
    """Get Monday-Sunday date range for a week."""
    if week_start:
        dt = datetime.strptime(week_start, "%Y-%m-%d")
    else:
        # Current week: find most recent Monday
        dt = datetime.now()
        dt -= timedelta(days=dt.weekday())
    monday = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return monday.strftime("%Y-%m-%d"), sunday.strftime("%Y-%m-%d")


def query_week_data(db_path: str, start: str, end: str) -> dict:
    """Query all activity for a given week from the archive database."""
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    # Channel activity stats
    channels = db.execute("""
        SELECT c.name, c.id, COUNT(m.id) as msg_count,
               COUNT(DISTINCT m.author_id) as unique_authors
        FROM messages m
        JOIN channels c ON m.channel_id = c.id
        WHERE m.timestamp >= ? AND m.timestamp < ?
          AND c.type != 11
        GROUP BY c.id
        ORDER BY msg_count DESC
    """, (start, end + "T23:59:59")).fetchall()

    # Top users
    users = db.execute("""
        SELECT u.global_name, u.username, COUNT(m.id) as msg_count
        FROM messages m
        JOIN users u ON m.author_id = u.id
        WHERE m.timestamp >= ? AND m.timestamp < ?
        GROUP BY m.author_id
        ORDER BY msg_count DESC
        LIMIT 15
    """, (start, end + "T23:59:59")).fetchall()

    # Total stats
    total_msgs = sum(ch["msg_count"] for ch in channels)
    total_channels = len(channels)
    total_users = len(set(
        r["global_name"] or r["username"] for r in users
    ))

    # Messages per channel (top channels, full content)
    channel_data = {}
    for ch in channels[:20]:  # Top 20 channels
        msgs = db.execute("""
            SELECT m.content, m.timestamp, m.type,
                   u.global_name, u.username,
                   m.id, m.channel_id
            FROM messages m
            LEFT JOIN users u ON m.author_id = u.id
            WHERE m.channel_id = ? AND m.timestamp >= ? AND m.timestamp < ?
            ORDER BY m.timestamp
        """, (ch["id"], start, end + "T23:59:59")).fetchall()

        # Resolve mentions in content
        channel_msgs = []
        for msg in msgs:
            content = msg["content"] or ""
            # Resolve channel mentions
            import re
            for match in re.finditer(r'<#(\d+)>', content):
                ch_row = db.execute("SELECT name FROM channels WHERE id = ?", (match.group(1),)).fetchone()
                if ch_row:
                    content = content.replace(match.group(0), f"#{ch_row['name']}")
            # Resolve user mentions
            for match in re.finditer(r'<@!?(\d+)>', content):
                u_row = db.execute("SELECT global_name, username FROM users WHERE id = ?", (match.group(1),)).fetchone()
                if u_row:
                    name = u_row["global_name"] or u_row["username"]
                    content = content.replace(match.group(0), f"@{name}")

            author = msg["global_name"] or msg["username"] or "Unknown"
            msg_id = msg["id"]
            ch_id = msg["channel_id"]
            links = []
            if VIEWER_BASE:
                links.append(f"[viewer]({VIEWER_BASE}/#{ch_id}/{msg_id})")
            if DISCORD_GUILD_ID:
                links.append(f"[discord](https://discord.com/channels/{DISCORD_GUILD_ID}/{ch_id}/{msg_id})")
            link_str = " ".join(links)
            channel_msgs.append({
                "author": author,
                "content": content,
                "timestamp": msg["timestamp"],
                "link": link_str,
                "msg_id": msg_id,
                "channel_id": ch_id,
            })
        channel_data[ch["name"]] = {
            "msg_count": ch["msg_count"],
            "unique_authors": ch["unique_authors"],
            "messages": channel_msgs,
        }

    # Most reacted messages
    reacted = db.execute("""
        SELECT m.content, m.timestamp, u.global_name, u.username,
               c.name as channel_name, SUM(r.count) as total_reactions
        FROM reactions r
        JOIN messages m ON r.message_id = m.id
        JOIN users u ON m.author_id = u.id
        JOIN channels c ON m.channel_id = c.id
        WHERE m.timestamp >= ? AND m.timestamp < ?
        GROUP BY m.id
        ORDER BY total_reactions DESC
        LIMIT 10
    """, (start, end + "T23:59:59")).fetchall()

    db.close()

    return {
        "total_msgs": total_msgs,
        "total_channels": total_channels,
        "total_users": total_users,
        "channels": [dict(ch) for ch in channels],
        "users": [dict(u) for u in users],
        "channel_data": channel_data,
        "most_reacted": [dict(r) for r in reacted],
    }


def format_stats(data: dict) -> str:
    """Format stats section for the prompt."""
    lines = [
        f"- {data['total_msgs']} messages across {data['total_channels']} channels",
        f"- {data['total_users']} active contributors",
        "",
        "Top channels: " + ", ".join(
            f"#{ch['name']} ({ch['msg_count']})" for ch in data["channels"][:10]
        ),
        "",
        "Most active: " + ", ".join(
            f"{u['global_name'] or u['username']} ({u['msg_count']})" for u in data["users"][:10]
        ),
    ]
    if data["most_reacted"]:
        lines.append("")
        lines.append("Most reacted messages:")
        for r in data["most_reacted"][:5]:
            author = r["global_name"] or r["username"]
            snippet = (r["content"] or "")[:80]
            lines.append(f"  - {author} in #{r['channel_name']}: \"{snippet}...\" ({r['total_reactions']} reactions)")
    return "\n".join(lines)


def format_channel_data(data: dict) -> str:
    """Format channel messages for the prompt."""
    parts = []
    for name, info in data["channel_data"].items():
        parts.append(f"### #{name} ({info['msg_count']} messages, {info['unique_authors']} authors)")
        for msg in info["messages"]:
            ts = msg["timestamp"][:16].replace("T", " ")
            content = msg["content"][:500] if msg["content"] else "(empty)"
            link = f" {msg['link']}" if msg.get("link") else ""
            parts.append(f"[{ts}] {msg['author']}: {content}{link}")
        parts.append("")
    return "\n".join(parts)


def generate_summary(data: dict, week_start: str, week_end: str) -> str:
    """Call `claude` CLI to generate the summary (uses Pro account auth)."""
    stats = format_stats(data)
    channel_data = format_channel_data(data)

    prompt = SYSTEM_PROMPT + "\n\n" + SUMMARY_PROMPT.format(
        week_start=week_start,
        week_end=week_end,
        stats=stats,
        channel_data=channel_data,
    )

    err(f"Sending {len(prompt)} chars to claude CLI...")

    result = subprocess.run(
        ["claude", "-p", "--output-format", "text"],
        input=prompt,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        err(f"claude CLI failed: {result.stderr}")
        raise RuntimeError(f"claude CLI exited with {result.returncode}")

    return result.stdout.strip()


def post_to_discord(summary: str, channel_id: str):
    """Post summary to a Discord channel."""
    import aiohttp
    import asyncio

    token = os.environ["DISCORD_TOKEN"]

    async def _post():
        headers = {"Authorization": f"Bot {token}", "Content-Type": "application/json"}
        url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
        # Discord has a 2000 char limit per message; split if needed
        chunks = []
        lines = summary.split("\n")
        chunk = ""
        for line in lines:
            if len(chunk) + len(line) + 1 > 1900:
                chunks.append(chunk)
                chunk = line
            else:
                chunk += "\n" + line if chunk else line
        if chunk:
            chunks.append(chunk)

        async with aiohttp.ClientSession() as session:
            for i, c in enumerate(chunks):
                async with session.post(url, headers=headers, json={"content": c}) as r:
                    if r.status != 200:
                        err(f"Discord post failed: {r.status} {await r.text()}")
                    else:
                        err(f"Posted chunk {i+1}/{len(chunks)}")

    asyncio.run(_post())


def post_to_slack(summary: str, channel_id: str):
    """Post summary to a Slack channel."""
    import urllib.request

    token = os.environ["SLACK_TOKEN"]
    url = "https://slack.com/api/chat.postMessage"
    data = json.dumps({"channel": channel_id, "text": summary, "mrkdwn": True}).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        if not result.get("ok"):
            err(f"Slack post failed: {result.get('error')}")
        else:
            err(f"Posted to Slack channel {channel_id}")


@command()
@option('-d', '--db-path', default=DB_PATH, help='Path to archive.db')
@option('-g', '--guild-id', default=DISCORD_GUILD_ID, help='Discord guild ID (for permalink URLs)')
@option('-n', '--dry-run', is_flag=True, help='Print raw data without calling LLM')
@option('-o', '--output', default='-', help='Output file (default: stdout)')
@option('-v', '--viewer-base', default=VIEWER_BASE, help='Viewer base URL (for permalink URLs)')
@option('-w', '--week', default=None, help='Week start date (Monday), YYYY-MM-DD')
@option('--post-discord', default=None, help='Post to Discord channel ID')
@option('--post-slack', default=None, help='Post to Slack channel ID')
def main(db_path, guild_id, dry_run, output, viewer_base, week, post_discord, post_slack):
    global VIEWER_BASE, DISCORD_GUILD_ID
    if viewer_base: VIEWER_BASE = viewer_base
    if guild_id: DISCORD_GUILD_ID = guild_id
    """Generate a weekly Discord activity summary."""
    start, end = get_week_range(week)
    err(f"Summarizing week of {start} to {end}")

    data = query_week_data(db_path, start, end)
    if data["total_msgs"] == 0:
        err("No messages found for this week")
        return

    err(f"Found {data['total_msgs']} messages across {data['total_channels']} channels")

    if dry_run:
        stats = format_stats(data)
        channel_data = format_channel_data(data)
        print(f"# Week of {start} to {end}\n\n{stats}\n\n{channel_data}")
        return

    summary = generate_summary(data, start, end)

    # Output
    if output == '-':
        print(summary)
    else:
        Path(output).write_text(summary + "\n")
        err(f"Wrote summary to {output}")

    # Post to channels
    if post_discord:
        post_to_discord(summary, post_discord)
    if post_slack:
        post_to_slack(summary, post_slack)


if __name__ == "__main__":
    main()
