import type { Channel, Message, SearchResult, User } from './types'

const BASE = '/api'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export function fetchChannels(): Promise<Channel[]> {
  return fetchJson(`${BASE}/channels`)
}

export function fetchMessages(
  channelId: string,
  params: { limit?: number; before?: string; after?: string } = {},
): Promise<Message[]> {
  const search = new URLSearchParams()
  if (params.limit) search.set('limit', String(params.limit))
  if (params.before) search.set('before', params.before)
  if (params.after) search.set('after', params.after)
  const qs = search.toString()
  return fetchJson(`${BASE}/channels/${channelId}/messages${qs ? `?${qs}` : ''}`)
}

export function fetchMessage(id: string): Promise<Message> {
  return fetchJson(`${BASE}/messages/${id}`)
}

export function fetchUsers(): Promise<User[]> {
  return fetchJson(`${BASE}/users`)
}

export function searchMessages(query: string, limit = 50): Promise<SearchResult[]> {
  const search = new URLSearchParams({ q: query, limit: String(limit) })
  return fetchJson(`${BASE}/search?${search}`)
}

const prefetchCache = new Map<string, Promise<Message[]>>()

export function prefetchMessages(channelId: string): void {
  if (prefetchCache.has(channelId)) return
  const promise = fetchMessages(channelId, { limit: 50 })
  prefetchCache.set(channelId, promise)
}

export function getPrefetched(channelId: string): Promise<Message[]> | undefined {
  const result = prefetchCache.get(channelId)
  if (result) prefetchCache.delete(channelId)
  return result
}
