# Marin Bot

GitHub repo: `Open-Athena/marin-bot`

## Status
- Discord bot registered as "Marin Bot"
- Token working (stored in 1Password, "Marin Archiver Discord bot")
- Bot is in the Marin Community server (guild ID `1354881461060243556`)
- Three prototype scripts exist: `fetch_raw.py` (aiohttp), `fetch_self.py` (discord.py), `fetch_test.py` (discord.py)
- All use `Bot` auth via `DISCORD_TOKEN` env var (set in `.envrc`)
- `DISCORD_GUILD` env var also available

## Bot Details
- Application ID: `1460618748787556484`
- Username: `Marin Bot#5743`
- Permissions: can view channels (76 visible) and read message history
- Privileged Gateway Intents: none enabled yet (may need Message Content Intent for full message text)

## Goal
Download/mirror Marin Discord messages, summarize, and upload to GitHub. Per the bot description: "Bot for downloading/mirroring Marin Discord messages, summarizing/uploading to GitHub, etc."

## Architecture Notes
- Scripts use `uv run` shebangs with inline deps
- Token comes from env (`DISCORD_TOKEN`), not hardcoded
- `User-Agent` header required for raw API calls (Cloudflare blocks without it)
- Bot auth format: `Authorization: Bot {token}` (not bare token, which is user-token style)

## Setup TODO
- [x] Rename Discord application from "Marin Archiver" to "Marin Bot" in Developer Portal ✅
- [ ] Create `Open-Athena/marin-bot` repo on GitHub (`gh repo create Open-Athena/marin-bot --public`)
- [ ] Set remote and push existing scripts

## Feature TODO
- [ ] Enumerate all channels and archive message history
- [ ] Handle pagination (Discord API returns max 100 messages per request)
- [ ] Store messages in a structured format (JSON? SQLite?)
- [ ] Incremental fetching (track last-seen message ID per channel)
- [ ] Consider enabling Message Content Intent if needed for full message bodies
- [ ] GitHub upload / mirroring
- [ ] Summarization pipeline
