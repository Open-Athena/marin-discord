# discord-archive

Archive, search, and browse Discord server messages with a fast web viewer.

- **Full archive**: channels, threads, attachments, reactions, embeds, users
- **Incremental updates**: only fetches new messages on re-runs
- **Full-text search**: FTS5-powered search with `#channel` and `@user` filters
- **Keyboard-driven**: [use-kbd] omnibar (Cmd+K), shortcuts, arrow-key navigation
- **Deployable**: Cloudflare Workers + D1 + Pages, with GitHub Actions CI/CD
- **Versioned data**: [DVX]-tracked archive with S3 remote cache

## Quick start

```bash
# 1. Set your Discord bot token and guild ID
export DISCORD_TOKEN="your-bot-token"
export DISCORD_GUILD="your-guild-id"

# 2. Archive all messages
./archive.py

# 3. Build the SQLite database
./build_db.py

# 4. Start the local API server
./server.py &

# 5. Start the viewer
cd app && pnpm install && pnpm dev
# Open http://localhost:5272
```

## Architecture

```
discord-archive/
  archive.py          # Discord API → JSON (incremental, per-channel files)
  build_db.py         # JSON → SQLite (normalized, FTS5 search index)
  build_index.py      # JSON → index.json (for static viewer)
  server.py           # Local dev API server (Starlette + SQLite)
  archive/            # DVX-tracked raw JSON archive + attachments
  archive.db          # SQLite database (derived from archive/)
  app/                # Vite + React viewer
  api/                # Cloudflare Worker (D1-backed API)
    d1-import.sh      # Full SQLite → D1 import
    d1-sync.py        # Incremental D1 sync (zero downtime)
  .github/workflows/  # CI/CD for app, worker, and archive updates
```

## Scripts

### `archive.py`

Archives all messages from a Discord guild to per-channel JSON files.

```bash
./archive.py                          # archive all channels + threads
./archive.py --no-threads             # skip thread messages
./archive.py --no-attachments         # skip downloading attachments
./archive.py --backfill-attachments   # re-fetch expired CDN URLs and download
./archive.py -g 123456789             # specify guild ID
./archive.py -o my-archive            # custom output directory
```

Requires `DISCORD_TOKEN` env var (bot token with Message Content intent).

### `build_db.py`

Builds a normalized SQLite database from the JSON archive.

```bash
./build_db.py                         # default: archive/ → archive.db
./build_db.py -i my-archive -o my.db  # custom paths
```

Creates tables: `channels`, `messages`, `users`, `attachments`, `reactions`, `embeds`, `threads`, plus a `messages_fts` FTS5 index.

### `server.py`

Local development API server.

```bash
./server.py                           # serves archive.db on :5273
```

Endpoints: `/api/channels`, `/api/channels/:id/messages`, `/api/messages/:id`, `/api/search`, `/api/users`. Also serves downloaded attachments from `/attachments/`.

## Viewer (`app/`)

React + TypeScript + Vite application with:

- Virtual scrolling ([TanStack Virtual]) for large channels
- Full-text search with `#channel` and `@user` autocomplete
- Permalink URLs (`#channelId/messageId`)
- Message grouping, reactions with tooltips, embed rendering
- Keyboard navigation via [use-kbd] (Cmd+K omnibar, `/` search, `?` shortcuts)
- Responsive layout (collapsible sidebar, mobile support)
- Prefetch on hover (channels, search results, mentions)

```bash
cd app
pnpm install
pnpm dev        # http://localhost:5272 (proxies /api to :5273)
pnpm build      # production build
```

## Deployment

### Cloudflare (Workers + D1 + Pages)

The `api/` directory contains a Cloudflare Worker that serves the same API backed by D1.

```bash
cd api
pnpm install

# Create D1 database
npx wrangler d1 create my-discord-archive
# Update wrangler.toml with the database_id

# Import data
./d1-import.sh ../archive.db           # local D1
./d1-import.sh --remote ../archive.db  # remote D1

# Deploy worker
npx wrangler deploy

# Deploy viewer
cd ../app
VITE_API_BASE=https://your-worker.workers.dev pnpm build
npx wrangler pages deploy dist --project-name my-discord-archive
```

### Incremental updates

```bash
./archive.py                    # fetch new messages
./build_db.py                   # rebuild SQLite
cd api && ./d1-sync.py --remote # sync delta to D1 (zero downtime)
```

### GitHub Actions

Three workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy-app.yml` | Push to `app/`, manual | Build + deploy viewer to CF Pages |
| `deploy-worker.yml` | Push to `api/`, manual | Deploy Worker to CF |
| `update-archive.yml` | Manual (+ future cron) | Fetch new messages, rebuild DB, sync to D1 |

Required secrets: `CLOUDFLARE_TOKEN`, `DISCORD_TOKEN`
Required variables: `CLOUDFLARE_ACCOUNT_ID`, `VITE_API_BASE`, `AWS_ROLE_ARN`

### DVX / Data versioning

The `archive/` directory is tracked with [DVX] (a [DVC] fork). Each archive update creates a new snapshot; individual file blobs are deduplicated.

```bash
dvx add archive           # track archive state
dvx push                  # push to S3 remote
dvx pull                  # restore archive from remote
```

## Discord bot setup

1. Go to the [Discord Developer Portal]
2. Create a new application, add a bot
3. Enable **Message Content Intent** under Bot settings
4. Generate a bot token → set as `DISCORD_TOKEN`
5. Invite the bot to your server with `Read Message History` + `Read Messages` permissions
6. Find your guild ID (right-click server name → Copy Server ID) → set as `DISCORD_GUILD`

[use-kbd]: https://github.com/runsascoded/use-kbd
[TanStack Virtual]: https://tanstack.com/virtual
[DVX]: https://github.com/runsascoded/dvx
[DVC]: https://dvc.org
[Discord Developer Portal]: https://discord.com/developers/applications
