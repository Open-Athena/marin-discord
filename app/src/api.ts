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

export function fetchMessagesAround(channelId: string, messageId: string, limit = 50): Promise<Message[]> {
  const search = new URLSearchParams({ around: messageId, limit: String(limit) })
  return fetchJson(`${BASE}/channels/${channelId}/messages?${search}`)
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
