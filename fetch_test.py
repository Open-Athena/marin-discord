#!/usr/bin/env -S uv run
# /// script
# dependencies = ["discord.py"]
# ///

import discord
import asyncio
import os

async def main():
    token = os.environ.get("DISCORD_TOKEN")
    if not token:
        # Fall back to reading from .envrc
        with open(".envrc") as f:
            for line in f:
                if "DISCORD_TOKEN=" in line:
                    # Handle "export DISCORD_TOKEN=..." format
                    token = line.split("DISCORD_TOKEN=", 1)[1].strip()
                    break

    print(f"Token: {token[:4]}...{token[-4:]} (len={len(token)})")

    client = discord.Client(intents=discord.Intents.default())
    await client.login(token)

    # Marin Community guild
    guild_id = 1354881461060243556
    channel_id = 1415061162701361242  # from your screenshot

    channel = await client.fetch_channel(channel_id)
    print(f"Channel: #{channel.name}")
    print("---")

    async for msg in channel.history(limit=5):
        content = msg.content[:80].replace('\n', ' ') if msg.content else "(no text)"
        print(f"{msg.created_at.strftime('%Y-%m-%d %H:%M')} | {msg.author.display_name}: {content}")

    await client.close()

asyncio.run(main())
