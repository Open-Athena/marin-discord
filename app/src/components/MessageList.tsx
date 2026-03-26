import { useEffect, useState, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Message as MessageType } from '../types'
import { fetchMessages, fetchMessagesAround, getPrefetched } from '../api'
import MessageComponent from './Message'

const PAGE_SIZE = 50
const GROUP_INTERVAL_MS = 7 * 60 * 1000

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate()
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

interface Row {
  type: 'date' | 'message'
  key: string
  date?: string
  message?: MessageType
  compact?: boolean
}

function buildRows(messages: MessageType[]): Row[] {
  const rows: Row[] = []
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const prev = i > 0 ? messages[i - 1] : null

    // Date separator
    if (!prev || !isSameDay(prev.timestamp, msg.timestamp)) {
      rows.push({ type: 'date', key: `date-${msg.timestamp}`, date: formatDate(msg.timestamp) })
    }

    // Compact grouping: same author, within 7 min, not system, no reply
    const compact = !!prev
      && prev.author_id === msg.author_id
      && isSameDay(prev.timestamp, msg.timestamp)
      && (new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime()) < GROUP_INTERVAL_MS
      && msg.type === 0
      && prev.type === 0
      && !msg.reference_message_id

    rows.push({ type: 'message', key: msg.id, message: msg, compact })
  }
  return rows
}

interface Props {
  channelId: string
  targetMessageId?: string | null
  onNavigate: (channelId: string, messageId: string) => void
}

export default function MessageList({ channelId, targetMessageId, onNavigate }: Props) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlder, setHasOlder] = useState(true)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)
  const prevChannelRef = useRef<string>('')

  // Load initial messages
  useEffect(() => {
    if (channelId === prevChannelRef.current) return
    prevChannelRef.current = channelId

    setMessages([])
    setLoading(true)
    setHasOlder(true)
    setInitialScrollDone(false)

    let promise: Promise<MessageType[]>
    if (targetMessageId) {
      // Fetch messages centered around the target
      promise = fetchMessagesAround(channelId, targetMessageId, PAGE_SIZE)
    } else {
      const prefetched = getPrefetched(channelId)
      promise = prefetched || fetchMessages(channelId, { limit: PAGE_SIZE })
    }

    promise.then(msgs => {
      // API returns newest-first, reverse to chronological
      const sorted = [...msgs].reverse()
      setMessages(sorted)
      setHasOlder(msgs.length >= PAGE_SIZE)
    }).finally(() => setLoading(false))
  }, [channelId])

  const rows = buildRows(messages)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index]
      if (row.type === 'date') return 40
      return row.compact ? 24 : 70
    },
    overscan: 20,
  })

  // Scroll to bottom on initial load, or to target message
  useEffect(() => {
    if (loading || messages.length === 0 || initialScrollDone) return

    if (targetMessageId) {
      const idx = rows.findIndex(r => r.key === targetMessageId)
      if (idx >= 0) {
        virtualizer.scrollToIndex(idx, { align: 'center' })
        setInitialScrollDone(true)

        // Highlight the target message briefly
        setTimeout(() => {
          const el = parentRef.current?.querySelector(`[data-message-id="${targetMessageId}"]`)
          if (el) {
            el.classList.add('highlight')
            setTimeout(() => el.classList.remove('highlight'), 2000)
          }
        }, 100)
        return
      }
    }

    // Scroll to bottom
    virtualizer.scrollToIndex(rows.length - 1, { align: 'end' })
    setInitialScrollDone(true)
  }, [loading, messages.length, initialScrollDone, targetMessageId, rows, virtualizer])

  // Infinite scroll: load older messages when scrolling near the top
  const loadOlder = useCallback(() => {
    if (loadingOlder || !hasOlder || messages.length === 0) return

    setLoadingOlder(true)
    const oldestId = messages[0].id

    fetchMessages(channelId, { limit: PAGE_SIZE, before: oldestId }).then(older => {
      if (older.length < PAGE_SIZE) setHasOlder(false)
      if (older.length === 0) {
        setLoadingOlder(false)
        return
      }

      // older arrives newest-first, reverse to chronological
      const sorted = [...older].reverse()
      setMessages(prev => [...sorted, ...prev])
      setLoadingOlder(false)
    }).catch(() => setLoadingOlder(false))
  }, [channelId, loadingOlder, hasOlder, messages])

  // Watch scroll position for loading older messages
  useEffect(() => {
    const el = parentRef.current
    if (!el) return

    function onScroll() {
      if (!el) return
      if (el.scrollTop < 200 && hasOlder && !loadingOlder && initialScrollDone) {
        loadOlder()
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [hasOlder, loadingOlder, loadOlder, initialScrollDone])

  if (loading) {
    return <div className="message-list-loading">Loading messages...</div>
  }

  if (messages.length === 0) {
    return <div className="message-list-empty">No messages in this channel</div>
  }

  return (
    <div ref={parentRef} className="message-list-scroll">
      {loadingOlder && <div className="loading-older">Loading older messages...</div>}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={row.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.type === 'date' ? (
                <div className="date-separator">
                  <span>{row.date}</span>
                </div>
              ) : (
                <MessageComponent
                  message={row.message!}
                  compact={row.compact!}
                  onNavigate={onNavigate}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
