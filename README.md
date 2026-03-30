# marin-discord

Marin-specific deployment of [discord-agent] for archiving, viewing, and summarizing the [Marin Community Discord server][marin-discord-server].

## What's here

- `archive/` — raw JSON archive (DVX-tracked, not in git)
- `archive.db` — derived SQLite DB (rebuild via `discord-agent/build_db.py`)
- `archive.dvc` — DVX tracking file
- `api/wrangler.toml` — Cloudflare Worker + D1 config
- `.dvc/config` — S3 remote for DVX cache
- `.github/workflows/` — GHA workflows (deploy app/worker, update archive)
- `summaries/` — generated weekly summaries

## Usage

Scripts live in the sibling [discord-agent] repo and are invoked from here:

```bash
# Archive (incremental)
~/c/oa/discord-agent/archive.py

# Rebuild SQLite from JSON
~/c/oa/discord-agent/build_db.py

# Summarize a week
~/c/oa/discord-agent/summarize.py \
  --week 2026-03-24 \
  --viewer-base https://marin-discord.pages.dev \
  --guild-id 1354881461060243556

# D1 sync
cd api && ~/c/oa/discord-agent/api/d1-sync.py --remote
```

## Deployment

- **Viewer**: https://marin-discord.pages.dev/
- **API**: https://marin-discord-api.ryan-0dc.workers.dev/
- **D1**: `marin-discord` (13MB, 24.4k messages, FTS5 indexed)
- **S3**: `s3://openathena/marin-discord/.dvc/cache/`

[discord-agent]: https://github.com/Open-Athena/discord-agent
[marin-discord-server]: https://discord.gg/marin
