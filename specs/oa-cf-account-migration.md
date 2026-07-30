# Migrate Cloudflare stack from personal account to Open Athena account

All CF resources currently live in Ryan's personal account (`0dcad5654e9744de6616f74b8df4af63`, "Ryan@runsascoded.com's Account"). Target: the shared "Open Athena" account (`74981a43be0de7712369306c7b19133d`), which `ryan.williams@openathena.ai` is a member of.

Cloudflare has no cross-account transfer for Workers, D1, R2, or Pages — this is a parallel-build + cutover, not a move. Fortunately the stack is small and fully parameterized via GH repo vars/secrets, so cutover is mostly a vars swap plus redeploys.

## Current inventory (personal account)

| Resource | Name | Notes |
|---|---|---|
| Worker | `marin-discord-api` | API + `*/2m` D1-sync cron; URL `marin-discord-api.ryan-0dc.workers.dev` |
| D1 | `marin-discord` (`8ca54637-…`) | ~20MB; recreatable via `full_reimport` |
| R2 bucket | `marin-discord` | holds `archive.db` mirror (+ R2 API keys in GH secrets) |
| Pages project | `marin-discord` | viewer at `marin-discord.pages.dev` |

GH config that points at it: vars `CLOUDFLARE_ACCOUNT_ID`, `VITE_API_BASE`, `PAGES_PROJECT_NAME`; secrets `CLOUDFLARE_TOKEN`, `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`. Parent-repo `api/wrangler.toml` carries the D1 `database_id`.

## Decisions

1. **Pages URL**: `marin-discord.pages.dev` is globally unique and referenced by every posted digest (Discord + Slack) and README. Options:
   - (a) **Delete-recreate** (recommended): delete the personal Pages project, immediately create same-named project in the OA account, redeploy. Small window where the name could theoretically be squatted; links break only for the minutes between delete and first OA deploy.
   - (b) New name + leave old project up as a redirect shim. More moving parts, permanent split-brain URL.
2. **Worker URL**: changes to `marin-discord-api.<oa-subdomain>.workers.dev` regardless (workers.dev subdomains are per-account). Only `VITE_API_BASE` references it; old digest posts do not. No name preservation needed.
3. **Token**: CI needs a `CLOUDFLARE_TOKEN` scoped to the OA account (Workers Scripts:Edit, D1:Edit, Pages:Edit, R2:Edit + Account Settings:Read). Must be created in the OA dashboard (user action). New R2 keys likewise (R2 API tokens are account-scoped).

## Phases

### 1. Parallel build (no user-facing impact) — DONE 2026-07-30

Built via local `wrangler` OAuth targeting the OA account:

- D1 `marin-discord` created: `database_id = d5d5e231-d247-405d-a167-534a19cbd83b`
- R2 bucket `marin-discord` created (empty; CI populates at cutover)
- Worker deployed as `marin-discord-api` → `https://marin-discord-api.open-athena.workers.dev`, cron `*/2 * * * *`, `DISCORD_TOKEN` secret set
- D1 seeded via `d1-import.sh --remote` from a fresh local `build_db.py` build (32,554 messages); first cron tick then caught up the 298-message delta, subsequent ticks quiet/ok
- OA-variant config lives at `.discord-agent/api/wrangler-oa.toml` (untracked; only difference from `api/wrangler.toml` is `database_id`); helper scripts under `tmp/oa-*.sh`
- Verified: `curl https://marin-discord-api.open-athena.workers.dev/api/channels/…/messages` serves data; `sync_runs` shows healthy `cfw` ticks

Note: `ARCHIVE_DB_URL` var still points at `marin-discord.pages.dev` (correct — that URL is preserved through cutover).

### 2. Cutover — DONE 2026-07-30 (~13:00–13:55 UTC)

- User: create OA-scoped API token + R2 keys; update GH secrets `CLOUDFLARE_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- Update GH vars: `CLOUDFLARE_ACCOUNT_ID` → `74981a43…`, `VITE_API_BASE` → new workers.dev URL.
- Pages: delete personal `marin-discord` project → create in OA account → dispatch Deploy Viewer App (uses `PAGES_PROJECT_NAME`, unchanged).
- Dispatch `update-archive.yml` with `full_reimport=true` (idempotent re-seed of OA D1 from the canonical archive; also exercises R2 upload with new keys).
- Verify: viewer loads, search works, digest links in old posts resolve, `sync_runs` shows `cfw` ticks in OA D1.

Executed: GH secrets (`CLOUDFLARE_TOKEN` → OA token `d06ed379…`, new R2 keys) and vars (`CLOUDFLARE_ACCOUNT_ID`, `VITE_API_BASE` → `marin-discord-api.open-athena.workers.dev`) flipped; personal Pages project deleted (via `RW_CLOUDFLARE_API_TOKEN`) and `marin-discord` recreated in OA — the `pages.dev` name transferred without incident; cutover commit `77070da` (OA `database_id` in `api/wrangler.toml`, `_redirects` → `pub-32e3fd2e…r2.dev`); deploy-worker + deploy-app green; `full_reimport` run 30548391549 green (D1 rebuilt, `archive.db` on OA R2, 20.2MB). Verified: viewer bundle compiled with OA API base; `/archive.db` redirect serves; `sync_runs` ticking. The hourly workflow was disabled during the flip and re-enabled after.

Known behavior: each full reimport drops ~298 messages that only the CFW captures (threads invisible to `archive.py` — see the thread-discovery gap), and the next `*/2` tick re-adds them. Fixing `archive.py` thread enumeration closes this.

### 3. Teardown (after a soak period, e.g. a week) — PENDING

- Delete personal-account worker (stops its cron double-writing Discord fetches — harmless but wasteful), D1 database, R2 bucket.
- Remove any local `.envrc` reliance on the personal `CLOUDFLARE_TOKEN` for this project.

## Rollback

Until teardown, the personal stack keeps running untouched (its worker cron continues syncing its own D1). Rollback = revert the GH vars/secrets and redeploy Pages to the personal project.

## Non-goals

- AWS side (S3 `openathena` bucket, OIDC role) already lives in OA's AWS account — unchanged.
- GHA sunset / Lambda migration: orthogonal, tracked separately.
