#!/usr/bin/env -S uv run
# /// script
# dependencies = ["aiohttp"]
# ///

import aiohttp
import asyncio
import json
import os

async def main():
    token = os.environ["DISCORD_TOKEN"]
    guild_id = os.environ.get("DISCORD_GUILD", "1354881461060243556")

    headers = {
        "Authorization": f"Bot {token}",
        "User-Agent": "DiscordBot (https://github.com/marin-community/marin, 0.1)",
    }
    base = "https://discord.com/api/v10"

    async with aiohttp.ClientSession(headers=headers) as session:
        # Test: get current user
        async with session.get(f"{base}/users/@me") as r:
            user = await r.json()
            print(f"Logged in as: {user.get('username', user)}")

        async with session.get(f"{base}/guilds/{guild_id}/channels") as r:
            channels = await r.json()
            print(f"\nMarin channels ({len(channels)}):")
            for ch in channels[:10]:
                if ch.get("type") == 0:  # text channels
                    print(f"  #{ch['name']} ({ch['id']})")

        channel_id = 1415061162701361242
        async with session.get(f"{base}/channels/{channel_id}/messages?limit=5") as r:
            messages = await r.json()
            print(f"\nRecent messages in channel {channel_id}:")
            for msg in messages:
                author = msg.get("author", {}).get("username", "?")
                content = msg.get("content", "")[:60].replace("\n", " ")
                ts = msg.get("timestamp", "")[:16]
                print(f"  {ts} {author}: {content}")

asyncio.run(main())
