---
name: sync-discord-agent
description: Rearrange `.discord-agent` submodule commits so that general/reusable work lands on upstream `discord-agent@main`, and Marin-specific customizations sit as a single squashed commit on top of that on `marin`. Use after adding commits directly to `marin` that should have gone upstream.
---

# Skill: sync-discord-agent

Keeps the `.discord-agent` submodule's two branches cleanly factored:

- `main` — upstream `discord-agent@main`, general/reusable code that any
  Discord server owner could use.
- `marin` — `main` + exactly one squashed commit containing Marin-specific
  customizations (guild ID, `ARCHIVE_DB_URL`, branding, R2/Pages wiring).

When you commit new work directly to `marin`, this skill splits it: general
commits get upstreamed to `main`; Marin-specific edits get folded into the
single customization commit on top.

## When to use

- You pushed a new commit to `marin` that's actually general (e.g. a bug
  fix, retry logic, schema change) and it belongs upstream.
- The delta between `main` and `marin` has grown beyond the single
  customization commit.
- Before cutting a release / bumping the SM pointer in the parent repo,
  to keep the topology clean.

## Preconditions

- Working in `/Users/ryan/c/oa/marin/discord/.discord-agent` (the SM checkout).
- `da` remote (`git@github.com:Open-Athena/discord-agent.git`) configured.
- Local `main` tracks `da/main`; local `marin` tracks `da/marin`.
- No uncommitted changes in the SM.

## Steps

### 1. Refresh refs and audit

```bash
cd /Users/ryan/c/oa/marin/discord/.discord-agent
git fetch da
git log --oneline da/main..marin
```

List the commits on `marin` ahead of upstream `main`. For each one, classify:

- **general** — feature/fix/refactor that any downstream user would want.
  Examples: retry logic, schema changes, new API routes, viewer fixes.
- **marin** — anything that encodes *this deployment's identity*.
  Examples: `GUILD_ID=1354…`, `ARCHIVE_DB_URL=https://marin-discord.pages.dev/…`,
  `marin-discord-api` naming, the Marin server's channel filters, branding
  strings that say "Marin".

If a commit mixes both concerns, split it first (rebase `-i` → `edit` →
`git reset HEAD^` → two commits). Don't silently upstream files that
contain Marin-specific substrings.

### 2. Before rewriting, archive the current `marin` tip

Rebasing orphans old SHAs — any parent repo pointing to them can't fetch
them once GC'd. Tag the tip first so it stays fetchable:

```bash
STAMP=$(date -u +%Y-%m-%d)
git tag marin-archive/$STAMP marin
git push da marin-archive/$STAMP
```

### 3. Rebase general commits onto `main`

Check out a working branch off upstream main:

```bash
git checkout -B sync-upstream da/main
```

Cherry-pick the general commits from `marin` in chronological order:

```bash
git cherry-pick <general-sha-1> <general-sha-2> ...
```

Resolve conflicts the normal way. If a general commit has to be reworded
(e.g. strip "marin" references from the message), use
`git cherry-pick -e <sha>` and edit interactively.

### 4. Push general commits upstream

Decide whether you have direct push rights to `da/main`:

- **If yes, and commits are well-formed:**

  ```bash
  git push da sync-upstream:main
  git branch -f main da/main
  git checkout main
  ```

- **If no (or commits need review):** open a PR instead:

  ```bash
  git push da sync-upstream:u/rw/sync-upstream
  gh pr create --repo Open-Athena/discord-agent --base main \
    --head u/rw/sync-upstream \
    --title "<short summary>" --body "<summary of the N commits>"
  ```

  Wait for merge, then `git fetch da && git branch -f main da/main`.

### 5. Rebuild `marin` = `main` + one customization commit

```bash
git checkout -B marin-new da/main
git cherry-pick <marin-customization-sha>
```

If there are multiple Marin-specific commits, squash them into one via
interactive rebase:

```bash
git rebase -i da/main
# change all but the first "pick" to "squash" (or "fixup"), save
```

Title the resulting commit descriptively, e.g.:
`Marin customizations: branding + clean archive.db URL`.

### 6. Replace `marin` and push with lease

```bash
git branch -f marin marin-new
git checkout marin
git branch -D marin-new sync-upstream
git push --force-with-lease da marin
```

### 7. Bump the SM pointer in the parent repo

```bash
cd /Users/ryan/c/oa/marin/discord
git add .discord-agent
git status .discord-agent  # should show pointer bump only
git commit -m "Bump SM to rebased marin (<short summary>)"
git pull --rebase
git push
```

### 8. Verify CI

Watch `Deploy Worker API` and `Deploy Viewer App` on the parent repo; both
should go green within ~2 minutes. If either fails, investigate before
moving on.

## Rules

- NEVER force-push `main` in the SM. `marin` is force-pushed; `main` is only
  fast-forwarded to upstream.
- NEVER upstream commits that still contain Marin-specific strings (search
  the diff for `marin-discord`, `1354881461060243556`, the R2 pub hash,
  etc. before pushing).
- Always archive the old `marin` tip with a `marin-archive/<date>` tag
  before force-pushing — downstream pulls of older parent commits depend
  on that SHA staying fetchable.
- If a commit is ambiguous (could be general, could be marin-specific),
  prefer keeping it on `marin`. Upstreaming it later is easy; unbaking
  Marin-isms from upstream `main` is not.
- Don't skip step 2 (the tag) even if it "feels safe" — cost is zero and
  it's the only cheap insurance against orphaning old parent SHAs.
