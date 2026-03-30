# Spec: Set up marin-discord as a deployment of discord-agent

## Context

`~/c/oa/discord-agent` (GH: `Open-Athena/discord-agent`) is the generic Discord archiver/viewer/summarizer library. This repo (`~/c/oa/marin/discord`, to become GH: `Open-Athena/marin-discord`) is the Marin-specific deployment that uses it.

This repo was cloned from `discord-agent`. It shares full git history up through commit `6a0570f` ("Add summarize.py"). After that, `discord-agent` genericized (removed Marin config in `cd66c3c`), while this repo should trim down to just Marin-specific config.

## What this repo should contain

### Config files (Marin-specific)
- `wrangler.toml` — Marin CF Worker/D1 config:
  ```toml
  name = "marin-discord-api"
  database_name = "marin-discord"
  database_id = "8ca54637-0c8a-42fd-9ffe-5f2f97d3b960"
  ```
- `.dvc/config` — S3 remote for Marin archive:
  ```
  [core]
      remote = s3
  ['remote "s3"']
      url = s3://openathena/marin-discord/.dvc/cache
  ```
- `.envrc` — env vars:
  ```bash
  export DISCORD_GUILD="1354881461060243556"
  export DISCORD_TOKEN="..."  # from 1Password "Marin Archiver Discord bot"
  export VIEWER_BASE="https://marin-discord.pages.dev"
  ```
- `.gitignore` — exclude `archive/` (DVX-tracked data)
- `archive.dvc` — DVX tracking file for the Marin archive

### Data (DVX-tracked, not in git)
- `archive/` — raw JSON archive (65 channels, 499 threads, 908 attachments, ~320MB)
- `archive.db` — derived SQLite (13MB, rebuild via `build_db.py` from discord-agent)

### GHA workflows (use discord-agent composite actions)

```yaml
# .github/workflows/deploy-app.yml
name: Deploy App
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Open-Athena/discord-agent/actions/deploy-app@v1
        with:
          pages_project_name: marin-discord
          vite_api_base: https://marin-discord-api.ryan-0dc.workers.dev
          cloudflare_token: ${{ secrets.CLOUDFLARE_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

```yaml
# .github/workflows/deploy-worker.yml
name: Deploy Worker
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Open-Athena/discord-agent/actions/deploy-worker@v1
        with:
          cloudflare_token: ${{ secrets.CLOUDFLARE_TOKEN }}
          cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wrangler_toml: wrangler.toml
```

```yaml
# .github/workflows/update-archive.yml
name: Update Archive
on:
  workflow_dispatch:
  schedule:
    - cron: '0 8 * * 1'  # Weekly Monday 8am UTC
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: us-east-1
      - uses: Open-Athena/discord-agent/actions/update-archive@v1
        with:
          discord_token: ${{ secrets.DISCORD_TOKEN }}
          cloudflare_token: ${{ secrets.CLOUDFLARE_TOKEN }}
          wrangler_toml: wrangler.toml
```

### Summaries
- `summaries/` — generated weekly summaries (committed as they're produced)
- Prototype summaries already exist in `tmp/summary_2026-03-17.md` and `tmp/summary_2026-03-24.md`

## What to remove from the clone

Delete everything that lives in `discord-agent` (the generic lib):
- `archive.py`, `build_db.py`, `build_index.py`, `server.py`, `summarize.py`
- `fetch_raw.py`, `fetch_self.py`, `fetch_test.py`
- `viewer.html`
- `app/` (entire viewer)
- `api/src/` (Worker source)
- `api/d1-import.sh`, `api/d1-sync.py`
- `README.md` (write a new Marin-specific one)
- `specs/` (move done specs to discord-agent, keep this spec)

## How this repo uses discord-agent

The scripts from `discord-agent` are invoked directly (it's a sibling directory, or installed as a tool):

```bash
# Archive
~/c/oa/discord-agent/archive.py

# Build DB
~/c/oa/discord-agent/build_db.py

# Summarize
~/c/oa/discord-agent/summarize.py \
  --week 2026-03-24 \
  --viewer-base https://marin-discord.pages.dev \
  --guild-id 1354881461060243556

# Local dev
~/c/oa/discord-agent/server.py &
cd ~/c/oa/discord-agent/app && pnpm dev

# D1 sync
cd api && ~/c/oa/discord-agent/api/d1-sync.py --remote
```

Or, once discord-agent is published to PyPI:
```bash
pip install discord-agent
discord-archive --guild 1354881461060243556
discord-build-db
discord-summarize --week 2026-03-24
```

## GH secrets/variables needed

Secrets:
- `CLOUDFLARE_TOKEN` — CF API token (Workers Scripts Edit, D1 Edit, Pages Edit)
- `DISCORD_TOKEN` — Discord bot token

Variables:
- `CLOUDFLARE_ACCOUNT_ID` — `0dcad5654e9744de6616f74b8df4af63`
- `VITE_API_BASE` — `https://marin-discord-api.ryan-0dc.workers.dev`
- `PAGES_PROJECT_NAME` — `marin-discord`
- `AWS_ROLE_ARN` — for OIDC-based AWS auth (DVX push to S3)

## Steps to complete

1. Create GH repo `Open-Athena/marin-discord` (private)
2. Remove generic lib files (see list above)
3. Keep: `wrangler.toml`, `.dvc/config`, `archive.dvc`, `.envrc`, `.gitignore`, GHA workflows
4. Write Marin-specific `README.md`
5. Set up GH secrets/variables (already done on `discord-agent`, may need to redo here)
6. `dvx pull` to restore archive data
7. Test: `discord-agent/archive.py` → `discord-agent/build_db.py` → `api/d1-sync.py --remote`
8. Generate and commit weekly summary for Mar 24-30

## Current deployment state

- **Viewer**: https://marin-discord.pages.dev/ (deployed, working)
- **API**: https://marin-discord-api.ryan-0dc.workers.dev/ (deployed, working)
- **D1**: `marin-discord` database, 13MB, 24.4k messages, FTS5 indexed
- **S3**: `s3://openathena/marin-discord/.dvc/cache/` (761 files pushed)
- **Archive**: last refreshed 2026-03-29, 24,477 messages across 569 channels+threads
