import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useSearch } from '../hooks'
import { useLookup } from '../context'

interface Props {
  onNavigate: (channelId: string, messageId: string) => void
  onClose: () => void
}

export default function SearchPanel({ onNavigate, onClose }: Props) {
  const lookup = useLookup()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results = [], isLoading } = useSearch(debouncedQuery)

  function snippetAround(text: string, q: string, maxLen: number): string {
    if (text.length <= maxLen) return text
    const needle = q.toLowerCase()
    const idx = text.toLowerCase().indexOf(needle)
    if (idx < 0) return text.slice(0, maxLen) + '...'
    const padding = Math.floor((maxLen - needle.length) / 2)
    const start = Math.max(0, idx - padding)
    const end = Math.min(text.length, idx + needle.length + padding)
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
        {isLoading && <div className="search-loading">Searching...</div>}
        {!isLoading && debouncedQuery && results.length === 0 && (
          <div className="search-empty">No results found</div>
        )}
        {results.map(r => (
          <div
            key={r.id}
            className="search-result"
            onClick={() => onNavigate(r.channel_id, r.id)}
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
                const display = snippetAround(resolved, debouncedQuery, 200)
                return highlightMatch(display, debouncedQuery)
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
