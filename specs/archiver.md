# Marin Bot

GitHub repo: `Open-Athena/marin-bot`

## Status
- Discord bot registered as "Marin Bot"
- Token working (stored in 1Password, "Marin Archiver Discord bot")
- Bot is in the Marin Community server (guild ID `1354881461060243556`)
- All scripts use `Bot` auth via `DISCORD_TOKEN` env var (set in `.envrc`)
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

## What's Done

### Archiver (`archive.py`)
- [x] Enumerate all text channels (65 of 76; 2 inaccessible)
- [x] Paginate full message history using `before` cursor (100/request)
- [x] Incremental fetching using `after` cursor (track newest message per channel)
- [x] Rate limit handling (429 retry with `retry_after`)
- [x] Thread message fetching (499 threads, ~5,800 messages)
- [x] Attachment downloading to `archive/attachments/` (195 of ~709; rest had expired CDN URLs)
- [x] Filename sanitization for threads with special chars (`/`, long names)
- [x] CLI flags: `-A` skip attachments, `-T` skip threads, `-g` guild, `-o` output dir

### Archive Stats (2026-03-25 snapshot)
- 65 channels: ~18,450 messages (29MB JSON)
- 499 threads: ~5,800 messages (9.4MB JSON)
- 195 attachments downloaded (53MB)
- 900 unique users
- Total: ~91MB on disk

### Viewer v1 (`viewer.html` + `build_index.py`)
- [x] Single-file static HTML viewer, dark Discord-like theme
- [x] Channel sidebar with message counts
- [x] Message rendering: avatars, timestamps, replies, reactions, embeds, threads
- [x] Full-text search across all channels
- [x] Message permalinks (`#channelId/messageId`)
- [x] Thread panel (side panel loads thread JSON)
- [x] Image lightbox, keyboard shortcuts (`/` search, `Esc` close)
- [x] Scroll to most recent messages on channel open
- [x] `build_index.py` generates `archive/index.json` (channel metadata + user lookup)
- Served via `python -m http.server 5272`

### Known Issues (v1)
- Loads entire channel JSON at once (slow for `#infra` at 4163 messages)
- ~514 attachment CDN URLs expired before download
- Pin system messages can't link to pinned message (Discord API doesn't include `message_id`)
- No `_underscore_` italic support (disabled; too error-prone with URLs/usernames)

## TODO: Structured Storage (Parquet)

Convert raw JSON archive to normalized Parquet tables for efficient querying:

### Tables
- `messages.parquet`: id, channel_id, author_id, content, timestamp, edited_timestamp, type, flags, message_reference_id
- `users.parquet`: id, username, global_name, avatar (hash)
- `channels.parquet`: id, name, type, position
- `attachments.parquet`: id, message_id, filename, content_type, size, url, width, height
- `reactions.parquet`: message_id, emoji_name, emoji_id, count
- `embeds.parquet`: message_id, type, title, description, url, thumbnail_url
- `threads.parquet`: id, parent_message_id, name, message_count, archived

### Benefits
- Deduplicated user/author data (currently repeated per-message, 22% of JSON size)
- No `referenced_message` duplication (10% of JSON size → just a foreign key)
- Columnar compression: ~29MB JSON → estimated ~5MB Parquet
- Range queries by timestamp/channel for pagination
- Client-side queryable via hyparquet (HTTP range requests against static files)

### Script: `build_parquet.py`
- Read `archive/*.json` + `archive/threads/*.json`
- Normalize into tables above
- Write to `archive/parquet/` (or top-level `data/`)
- DVX-track the parquet files

## TODO: Viewer v2 (Vite + React)

Replace `viewer.html` with a proper Vite app for snappy browsing at scale.

### Stack
- Vite + React + TypeScript
- [hyparquet] for client-side Parquet reads (HTTP range requests, no server needed)
- [@tanstack/react-virtual] for virtualized/infinite-scroll message list
- [use-prms] for URL state (channel, message ID permalinks)
- CSS modules or vanilla CSS (keep it light, Discord-inspired dark theme)

### Key Features
- **Infiniscroll**: virtual list renders only visible messages + buffer; fetch more on scroll
- **Pre-fetching**: on channel hover, start fetching that channel's parquet chunk
- **Lazy columns**: load lightweight columns first (id, author_id, content, timestamp), fetch embeds/attachments on scroll-into-view
- **Offline support**: service worker caches parquet chunks for offline browsing
- **Static deployment**: just static files on R2/S3 (parquet data + built Vite app)
- Port: 5272 (hash of "marin-discord")

### Hosting
- Cloudflare R2: free egress, serves static files directly, supports range requests for hyparquet
- DVX-tracked parquet files pushed to R2
- Vite app deployed alongside (or separate static site)
- `archive.py` runs on cron/manual to update, rebuilds parquet, pushes to R2

## Other TODOs
- [ ] Create `Open-Athena/marin-bot` repo on GitHub
- [ ] Consider enabling Message Content Intent if needed for full message bodies
- [ ] Re-download expired attachment URLs (re-run archiver periodically before expiry)
- [ ] GitHub upload / mirroring of summaries
- [ ] Summarization pipeline (AI summary of channels/threads → Markdown → GitHub)

[hyparquet]: https://github.com/hyparam/hyparquet
[@tanstack/react-virtual]: https://tanstack.com/virtual
[use-prms]: https://github.com/runsascoded/use-prms
