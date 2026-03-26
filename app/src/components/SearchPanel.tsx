import { useState, useEffect, useRef, type ReactNode } from 'react'
import type { SearchResult } from '../types'
import { searchMessages } from '../api'
import { useLookup } from '../context'

interface Props {
  onNavigate: (channelId: string, messageId: string) => void
  onClose: () => void
}

export default function SearchPanel({ onNavigate, onClose }: Props) {
  const lookup = useLookup()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true)
      searchMessages(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function snippetAround(text: string, q: string, maxLen: number): string {
    if (text.length <= maxLen) return text
    const needle = q.toLowerCase()
    const idx = text.toLowerCase().indexOf(needle)
    if (idx < 0) {
      // No match in resolved text — just truncate from start
      return text.slice(0, maxLen) + '...'
    }
    const padding = Math.floor((maxLen - needle.length) / 2)
    let start = Math.max(0, idx - padding)
    let end = Math.min(text.length, idx + needle.length + padding)
    let snippet = text.slice(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'
    return snippet
  }

  function resolveMentions(text: string): string {
    return text
      .replace(/<#(\d+)>/g, (_, id) => {
        const ch = lookup.channels.get(id)
        return ch ? `#${ch.name}` : '#unknown-channel'
      })
      .replace(/<@!?(\d+)>/g, (_, id) => {
        const user = lookup.users.get(id)
        return user ? `@${user.global_name || user.username}` : '@unknown-user'
      })
      .replace(/<@&(\d+)>/g, '@role')
  }

  function highlightMatch(text: string, q: string): ReactNode {
    if (!q.trim()) return <>{text}</>
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part)
            ? <mark key={i}>{part}</mark>
            : part
        )}
      </>
    )
  }

  function avatarUrl(authorId: string | undefined, avatar: string | null): string {
    if (!authorId) return `https://cdn.discordapp.com/embed/avatars/0.png`
    if (avatar) return `https://cdn.discordapp.com/avatars/${authorId}/${avatar}.png?size=32`
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(authorId) % 5}.png`
  }

  return (
    <div className="search-panel">
      <div className="search-header">
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onClose() }}
        />
        <button className="search-close" onClick={onClose}>X</button>
      </div>
      <div className="search-results">
        {loading && <div className="search-loading">Searching...</div>}
        {!loading && query.trim() && results.length === 0 && (
          <div className="search-empty">No results found</div>
        )}
        {results.map(r => (
          <div
            key={r.id}
            className="search-result"
            onClick={() => {
              onNavigate(r.channel_id, r.id)
              onClose()
            }}
          >
            <div className="search-result-header">
              <img
                className="search-result-avatar"
                src={avatarUrl(undefined, r.avatar)}
                alt=""
                width={20}
                height={20}
              />
              <span className="search-result-author">{r.global_name || r.username}</span>
              <span className="search-result-channel">#{r.channel_name}</span>
              <span className="search-result-time">
                {new Date(r.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="search-result-content">
              {(() => {
                const resolved = resolveMentions(r.content)
                const display = snippetAround(resolved, query, 200)
                return highlightMatch(display, query)
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
