# Marin Bot Roadmap

## Current State (2026-03-27)

### Done
- `archive.py`: Full Discord archiver (channels, threads, attachments, pagination, rate limits, incremental)
- `build_db.py`: JSON → normalized SQLite (13MB, FTS5 search)
- `build_index.py`: JSON → index.json for static viewer
- `server.py`: Local dev API server (Starlette, SQLite-backed)
- `viewer.html`: Static single-file viewer (legacy v1)
- `app/`: Vite React viewer v2 (virtual scroll, search, permalinks, mentions, tooltips, 28 e2e tests)
- Prototype weekly summaries (tmp/summary_2026-03-17.md, tmp/summary_2026-03-24.md)

### Archive Stats
- 65 channels, 499 threads, ~24,250 messages, 900 users
- 195 downloaded attachments (53MB), ~514 expired CDN URLs
- Raw JSON: 91MB, SQLite: 13MB

## Phase 1: Archive Tracking + Viewer Polish (current)

### 1a. DVX-track the archive
- `dvx add archive/` — tracks the directory, individual file blobs deduped
- Configure remote (S3/R2/GCS) for pushing
- Treat `archive.db` as a derived artifact from JSON (re-derivable via `build_db.py`)
- Daily `archive.py` runs produce incremental updates; only changed files need new blobs
- Commit the `.dvc` file after each archive refresh

### 1b. Viewer polish (Vite app)
- [ ] Migrate data fetching to @tanstack/react-query (replace DIY useState/useEffect)
  - Caching, deduplication, refetching, stale-while-revalidate
  - Prefetch on hover becomes trivial (queryClient.prefetchQuery)
  - Loading/error states handled declaratively
- [ ] Infinite scroll upward (load older messages) — currently loads 50, needs scroll-up trigger
- [ ] Thread panel (side panel showing thread messages, like viewer.html had)
- [ ] Image lightbox (click to enlarge)
- [ ] Keyboard shortcuts (/ for search, Esc to close panels)
- [ ] `@user` mention search (currently shows results but doesn't highlight the user)
- [ ] Mobile responsive layout

### 1c. D1 deployment
- [ ] Create `api/` directory with `wrangler.toml` + CF Worker (`index.ts`)
  - Port SQL queries from `server.py` to Worker binding D1
  - Same endpoints, same response shapes
  - Reference: ~/c/hccs/crashes/api/ for patterns
- [ ] `d1-import.sh` script
  - Dump `archive.db` to SQL
  - Chunk for D1 size limits (200k lines per file)
  - Metadata table with MD5 + timestamp
  - Support both `--local` and `--remote` modes
- [ ] Deploy Vite app to R2/Pages
  - `pnpm build` → `dist/` → Cloudflare Pages or R2
  - Environment variable for API URL (local vs prod)
- [ ] Domain: TBD (marin-discord.oa.dev? archive.marin.community?)

## Phase 2: Summarization

### 2a. `summarize.py`
- Query archive.db for a given week's Discord activity
- Aggregate: top channels, active users, reaction counts, progress signals, GH links
- Call Claude API with the raw data + Percy's format as few-shot examples
- Output: Markdown summary organized by workstream
- Options: --week YYYY-MM-DD, --output stdout/file/gdoc

### 2b. Google Doc integration
- Use `gws` CLI to create/update a Google Doc with weekly summaries
- Separate doc from Percy's (we don't edit his directly)
- Link Percy to our doc each week
- Structure: one heading per week, newest at top

### 2c. Combine Discord + GitHub summaries
- Isaac's mws.oa.dev covers GitHub activity (PRs, issues, milestones, W&B runs)
- Our tool covers Discord activity (discussions, decisions, research updates)
- Combined weekly summary: GitHub changes + Discord context
- Could feed into Percy's meeting agenda

## Phase 3: Automation + Packaging

### 3a. Cron / scheduled runs
- `archive.py` on daily cron (or more frequent)
- `summarize.py` on weekly cron (Monday before Tuesday meeting)
- Push archive updates to DVX remote
- Push DB updates to D1
- Post summary to Google Doc + optionally Discord

### 3b. Package structure
- `discord-archive` (PyPI): generic archiver, DB builder, API server
  - `archive.py`, `build_db.py`, `server.py` as entry points
  - No Marin-specific code
- `discord-viewer` (npm): generic Vite React viewer app
  - `app/` as publishable package
  - Configurable API base URL, branding
- `marin-bot`: this repo, Marin-specific glue
  - Summarization templates, workstream knowledge
  - Google Doc integration
  - Deployment config (wrangler.toml, D1 bindings)

### 3c. Bot capabilities
- Live Discord bot (already registered as "Marin Bot")
- Respond to commands: `/summary`, `/search`, `/archive`
- Post weekly summaries to #announcements or a dedicated channel
- Eventually: real-time archiving via Gateway events (not just periodic polling)
