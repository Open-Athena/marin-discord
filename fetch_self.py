#!/usr/bin/env -S uv run
# /// script
# dependencies = ["discord.py"]
# ///

import discord
import asyncio
import os

async def main():
    token = os.environ["DISCORD_TOKEN"]

    client = discord.Client(intents=discord.Intents.default())
    await client.login(token)
    print(f"Logged in as: {client.user}")

    channel_id = 1354881461060243561  # #general
    channel = await client.fetch_channel(channel_id)
    print(f"Channel: #{channel.name}")
    print("---")

    async for msg in channel.history(limit=5):
        content = msg.content[:80].replace('\n', ' ') if msg.content else "(no text)"
        print(f"{msg.created_at.strftime('%Y-%m-%d %H:%M')} | {msg.author.display_name}: {content}")

    await client.close()

asyncio.run(main())
