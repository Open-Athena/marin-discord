/**
 * Marin Discord Archive API — Cloudflare Worker with D1.
 *
 * Endpoints:
 *   GET /api/channels
 *   GET /api/channels/:id/messages?limit=&before=&after=&around=
 *   GET /api/channels/:id/threads
 *   GET /api/messages/:id
 *   GET /api/search?q=&limit=
 *   GET /api/users
 */

interface Env {
	DB: D1Database
	CORS_ORIGIN: string
}

function corsHeaders(env: Env): HeadersInit {
	return {
		"Access-Control-Allow-Origin": env.CORS_ORIGIN,
		"Access-Control-Allow-Methods": "GET, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Content-Type": "application/json",
	}
}

function json(data: unknown, env: Env, status = 200): Response {
	return new Response(JSON.stringify(data), { status, headers: corsHeaders(env) })
}

function intParam(url: URL, name: string, fallback: number): number {
	const v = url.searchParams.get(name)
	if (!v) return fallback
	const n = parseInt(v, 10)
	return isNaN(n) ? fallback : n
}

function strParam(url: URL, name: string): string | null {
	return url.searchParams.get(name)
}

// Route matching
function match(pathname: string, pattern: string): Record<string, string> | null {
	const patParts = pattern.split("/")
	const pathParts = pathname.split("/")
	if (patParts.length !== pathParts.length) return null
	const params: Record<string, string> = {}
	for (let i = 0; i < patParts.length; i++) {
		if (patParts[i].startsWith(":")) {
			params[patParts[i].slice(1)] = pathParts[i]
		} else if (patParts[i] !== pathParts[i]) {
			return null
		}
	}
	return params
}

async function getChannels(db: D1Database): Promise<unknown[]> {
	const { results } = await db.prepare(`
		SELECT c.id, c.name, c.type, c.position, COUNT(m.id) as message_count,
		       MIN(m.timestamp) as oldest, MAX(m.timestamp) as newest
		FROM channels c
		LEFT JOIN messages m ON m.channel_id = c.id
		WHERE c.type != 11
		GROUP BY c.id
		ORDER BY c.name
	`).all()
	return results
}

async function getMessages(db: D1Database, channelId: string, url: URL): Promise<unknown[]> {
	const before = strParam(url, "before")
	const after = strParam(url, "after")
	const around = strParam(url, "around")
	const limit = Math.min(intParam(url, "limit", 50), 200)

	let rows: D1Result<Record<string, unknown>>

	if (around) {
		const half = Math.floor(limit / 2)
		const beforeRows = await db.prepare(`
			SELECT m.*, u.username, u.global_name, u.avatar
			FROM messages m LEFT JOIN users u ON m.author_id = u.id
			WHERE m.channel_id = ?1 AND CAST(m.id AS INTEGER) <= CAST(?2 AS INTEGER)
			ORDER BY CAST(m.id AS INTEGER) DESC LIMIT ?3
		`).bind(channelId, around, half + 1).all()

		const afterRows = await db.prepare(`
			SELECT m.*, u.username, u.global_name, u.avatar
			FROM messages m LEFT JOIN users u ON m.author_id = u.id
			WHERE m.channel_id = ?1 AND CAST(m.id AS INTEGER) > CAST(?2 AS INTEGER)
			ORDER BY CAST(m.id AS INTEGER) ASC LIMIT ?3
		`).bind(channelId, around, half).all()

		const combined = [...beforeRows.results.reverse(), ...afterRows.results]
		rows = { results: combined.reverse(), success: true, meta: {} as D1Meta }
	} else if (after) {
		rows = await db.prepare(`
			SELECT m.*, u.username, u.global_name, u.avatar
			FROM messages m LEFT JOIN users u ON m.author_id = u.id
			WHERE m.channel_id = ?1 AND CAST(m.id AS INTEGER) > CAST(?2 AS INTEGER)
			ORDER BY CAST(m.id AS INTEGER) ASC LIMIT ?3
		`).bind(channelId, after, limit).all()
	} else if (before) {
		rows = await db.prepare(`
			SELECT m.*, u.username, u.global_name, u.avatar
			FROM messages m LEFT JOIN users u ON m.author_id = u.id
			WHERE m.channel_id = ?1 AND CAST(m.id AS INTEGER) < CAST(?2 AS INTEGER)
			ORDER BY CAST(m.id AS INTEGER) DESC LIMIT ?3
		`).bind(channelId, before, limit).all()
	} else {
		rows = await db.prepare(`
			SELECT m.*, u.username, u.global_name, u.avatar
			FROM messages m LEFT JOIN users u ON m.author_id = u.id
			WHERE m.channel_id = ?1
			ORDER BY CAST(m.id AS INTEGER) DESC LIMIT ?2
		`).bind(channelId, limit).all()
	}

	const messages = rows.results
	if (!messages.length) return messages

	// Fetch related data for these messages
	const ids = messages.map(m => m.id as string)
	const placeholders = ids.map((_, i) => `?${i + 1}`).join(",")

	const [attachments, reactions, embeds] = await Promise.all([
		db.prepare(`SELECT * FROM attachments WHERE message_id IN (${placeholders})`).bind(...ids).all(),
		db.prepare(`SELECT * FROM reactions WHERE message_id IN (${placeholders})`).bind(...ids).all(),
		db.prepare(`SELECT * FROM embeds WHERE message_id IN (${placeholders})`).bind(...ids).all(),
	])

	const attByMsg = new Map<string, unknown[]>()
	for (const a of attachments.results) {
		const mid = a.message_id as string
		if (!attByMsg.has(mid)) attByMsg.set(mid, [])
		attByMsg.get(mid)!.push(a)
	}

	const rxnByMsg = new Map<string, unknown[]>()
	for (const r of reactions.results) {
		const mid = r.message_id as string
		if (!rxnByMsg.has(mid)) rxnByMsg.set(mid, [])
		rxnByMsg.get(mid)!.push(r)
	}

	const embByMsg = new Map<string, unknown[]>()
	for (const e of embeds.results) {
		const mid = e.message_id as string
		if (!embByMsg.has(mid)) embByMsg.set(mid, [])
		embByMsg.get(mid)!.push(e)
	}

	return messages.map(m => ({
		...m,
		attachments: attByMsg.get(m.id as string) || [],
		reactions: rxnByMsg.get(m.id as string) || [],
		embeds: embByMsg.get(m.id as string) || [],
	}))
}

async function getMessage(db: D1Database, messageId: string): Promise<unknown | null> {
	const row = await db.prepare(`
		SELECT m.*, u.username, u.global_name, u.avatar
		FROM messages m LEFT JOIN users u ON m.author_id = u.id
		WHERE m.id = ?1
	`).bind(messageId).first()

	if (!row) return null

	const [attachments, reactions, embeds] = await Promise.all([
		db.prepare("SELECT * FROM attachments WHERE message_id = ?1").bind(messageId).all(),
		db.prepare("SELECT * FROM reactions WHERE message_id = ?1").bind(messageId).all(),
		db.prepare("SELECT * FROM embeds WHERE message_id = ?1").bind(messageId).all(),
	])

	return {
		...row,
		attachments: attachments.results,
		reactions: reactions.results,
		embeds: embeds.results,
	}
}

async function searchMessages(db: D1Database, url: URL): Promise<unknown[]> {
	const query = strParam(url, "q")?.trim()
	if (!query) return []

	const limit = Math.min(intParam(url, "limit", 50), 100)
	const isChannelSearch = query.startsWith("#")
	const isUserSearch = query.startsWith("@")
	const nameQuery = query.replace(/^[#@]/, "")
	const qLike = `%${nameQuery}%`

	const baseSelect = `
		SELECT m.id, m.channel_id, m.content, m.timestamp,
		       u.username, u.global_name, u.avatar,
		       c.name as channel_name
		FROM messages m
		LEFT JOIN users u ON m.author_id = u.id
		LEFT JOIN channels c ON m.channel_id = c.id
	`

	if (isChannelSearch) {
		if (!nameQuery) {
			// Bare "#" — return recent messages containing any channel mention
			const { results } = await db.prepare(
				`${baseSelect} WHERE m.content LIKE '%<#%>%' ORDER BY m.timestamp DESC LIMIT ?1`
			).bind(limit).all()
			return results
		}
		const { results: matchingChannels } = await db.prepare(
			"SELECT id FROM channels WHERE name LIKE ?1"
		).bind(qLike).all()

		if (!matchingChannels.length) return []
		const conds = matchingChannels.map((_, i) => `m.content LIKE ?${i + 1}`).join(" OR ")
		const params = matchingChannels.map(c => `%<#${c.id}>%`)
		const { results } = await db.prepare(
			`${baseSelect} WHERE ${conds} ORDER BY m.timestamp DESC LIMIT ?${params.length + 1}`
		).bind(...params, limit).all()
		return results
	}

	if (isUserSearch) {
		if (!nameQuery) {
			// Bare "@" — return recent messages containing any user mention
			const { results } = await db.prepare(
				`${baseSelect} WHERE m.content LIKE '%<@%>%' ORDER BY m.timestamp DESC LIMIT ?1`
			).bind(limit).all()
			return results
		}
		const { results: matchingUsers } = await db.prepare(
			"SELECT id FROM users WHERE username LIKE ?1 OR global_name LIKE ?1"
		).bind(qLike).all()

		if (!matchingUsers.length) return []
		const conds: string[] = []
		const params: unknown[] = []
		for (const u of matchingUsers) {
			params.push(`%<@${u.id}>%`)
			conds.push(`m.content LIKE ?${params.length}`)
			params.push(`%<@!${u.id}>%`)
			conds.push(`m.content LIKE ?${params.length}`)
			params.push(u.id)
			conds.push(`m.author_id = ?${params.length}`)
		}
		const { results } = await db.prepare(
			`${baseSelect} WHERE ${conds.join(" OR ")} ORDER BY m.timestamp DESC LIMIT ?${params.length + 1}`
		).bind(...params, limit).all()
		return results
	}

	// FTS query (primary), with LIKE fallback
	const ftsResults = await db.prepare(`
		SELECT m.id, m.channel_id, m.content, m.timestamp,
		       u.username, u.global_name, u.avatar,
		       c.name as channel_name
		FROM messages_fts f
		JOIN messages m ON m.rowid = f.rowid
		LEFT JOIN users u ON m.author_id = u.id
		LEFT JOIN channels c ON m.channel_id = c.id
		WHERE messages_fts MATCH ?1
		LIMIT ?2
	`).bind(nameQuery, limit).all().catch(() => ({ results: [] as Record<string, unknown>[] }))

	// Content LIKE fallback (catches FTS reserved words, partial matches)
	const { results: likeResults } = await db.prepare(
		`${baseSelect} WHERE m.content LIKE ?1 ORDER BY m.timestamp DESC LIMIT ?2`
	).bind(`%${nameQuery}%`, limit).all()

	// Mention resolution (capped at 10 to avoid expression-depth limits)
	const { results: matchingChannels } = await db.prepare(
		"SELECT id FROM channels WHERE name LIKE ?1 LIMIT 10"
	).bind(qLike).all()

	const { results: matchingUsers } = await db.prepare(
		"SELECT id FROM users WHERE (username LIKE ?1 OR global_name LIKE ?1) LIMIT 10"
	).bind(qLike).all()

	let mentionResults: Record<string, unknown>[] = []
	const mentionConds: string[] = []
	const mentionParams: unknown[] = []
	for (const c of matchingChannels) {
		mentionParams.push(`%<#${c.id}>%`)
		mentionConds.push(`m.content LIKE ?${mentionParams.length}`)
	}
	for (const u of matchingUsers) {
		mentionParams.push(`%<@${u.id}>%`)
		mentionConds.push(`m.content LIKE ?${mentionParams.length}`)
	}
	if (mentionConds.length > 0) {
		const { results } = await db.prepare(
			`${baseSelect} WHERE ${mentionConds.join(" OR ")} ORDER BY m.timestamp DESC LIMIT ?${mentionParams.length + 1}`
		).bind(...mentionParams, limit).all()
		mentionResults = results
	}

	// Merge and deduplicate (FTS results first for ranking)
	const seen = new Set<string>()
	const merged: Record<string, unknown>[] = []
	for (const row of [...ftsResults.results, ...likeResults, ...mentionResults]) {
		const id = row.id as string
		if (!seen.has(id)) {
			seen.add(id)
			merged.push(row)
		}
	}
	return merged.slice(0, limit)
}

async function getThreads(db: D1Database, channelId: string): Promise<unknown[]> {
	const { results } = await db.prepare(
		"SELECT * FROM threads WHERE parent_channel_id = ?1 ORDER BY id DESC"
	).bind(channelId).all()
	return results
}

async function getUsers(db: D1Database): Promise<unknown[]> {
	const { results } = await db.prepare("SELECT * FROM users").all()
	return results
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders(env) })
		}

		const url = new URL(request.url)
		const path = url.pathname

		try {
			// GET /api/channels
			if (path === "/api/channels") {
				return json(await getChannels(env.DB), env)
			}

			// GET /api/channels/:id/messages
			let params = match(path, "/api/channels/:id/messages")
			if (params) {
				return json(await getMessages(env.DB, params.id, url), env)
			}

			// GET /api/channels/:id/threads
			params = match(path, "/api/channels/:id/threads")
			if (params) {
				return json(await getThreads(env.DB, params.id), env)
			}

			// GET /api/messages/:id
			params = match(path, "/api/messages/:id")
			if (params) {
				const msg = await getMessage(env.DB, params.id)
				if (!msg) return json({ error: "not found" }, env, 404)
				return json(msg, env)
			}

			// GET /api/search
			if (path === "/api/search") {
				return json(await searchMessages(env.DB, url), env)
			}

			// GET /api/users
			if (path === "/api/users") {
				return json(await getUsers(env.DB), env)
			}

			return json({ error: "not found" }, env, 404)
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			return json({ error: message }, env, 500)
		}
	},
}
