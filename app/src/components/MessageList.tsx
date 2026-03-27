import { useEffect, useRef, useCallback, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Message as MessageType } from '../types'
import { useMessages } from '../hooks'
import { fetchMessages } from '../api'
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
  const { data: messages = [], isLoading } = useMessages(channelId, targetMessageId)
  const [allMessages, setAllMessages] = useState<MessageType[]>([])
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlder, setHasOlder] = useState(true)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)
  const targetIndexRef = useRef<number | null>(null)

  // Sync query data into allMessages, prepending any previously loaded older messages
  useEffect(() => {
    if (messages.length > 0) {
      setAllMessages(prev => {
        if (prev.length === 0) return messages
        // Merge: keep older messages that aren't in the new set
        const newIds = new Set(messages.map(m => m.id))
        const older = prev.filter(m => !newIds.has(m.id))
        const merged = [...older, ...messages]
        merged.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        return merged
      })
      setHasOlder(messages.length >= PAGE_SIZE)
    }
  }, [messages])

  // Reset when channel changes
  useEffect(() => {
    setAllMessages([])
    setInitialScrollDone(false)
    setHasOlder(true)
  }, [channelId, targetMessageId])

  const rows = buildRows(allMessages)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index]
      if (row.type === 'date') return 40
      if (row.compact) return 24
      const msg = row.message
      let h = 70
      if (msg?.attachments?.some(a => a.content_type?.startsWith('image/'))) h += 320
      if (msg?.embeds?.length) h += 120
      return h
    },
    overscan: 20,
  })

  function scrollToTarget(idx: number) {
    const scrollEl = parentRef.current
    if (!scrollEl) return
    virtualizer.scrollToIndex(idx, { align: 'start' })
    requestAnimationFrame(() => {
      const targetItem = virtualizer.getVirtualItems().find(v => v.index === idx)
      if (!targetItem) return
      const viewportH = scrollEl.clientHeight
      const desiredOffset = targetItem.start - viewportH * 0.3
      const maxScroll = scrollEl.scrollHeight - viewportH
      if (maxScroll - desiredOffset < 50) {
        scrollEl.scrollTop = maxScroll
      } else {
        scrollEl.scrollTop = Math.max(0, desiredOffset)
      }
    })
  }

  function highlightTarget() {
    if (!targetMessageId) return
    const el = parentRef.current?.querySelector(`[data-message-id="${targetMessageId}"]`)
    if (el) {
      el.classList.add('highlight')
      setTimeout(() => el.classList.remove('highlight'), 3000)
    }
  }

  // Scroll to bottom on initial load, or to target message
  useEffect(() => {
    if (isLoading || allMessages.length === 0 || initialScrollDone) return

    if (targetMessageId) {
      const idx = rows.findIndex(r => r.key === targetMessageId)
      if (idx >= 0) {
        targetIndexRef.current = idx
        scrollToTarget(idx)
        setInitialScrollDone(true)
        setTimeout(highlightTarget, 200)
        return
      }
    }

    // Scroll to bottom
    virtualizer.scrollToIndex(rows.length - 1, { align: 'end' })
    setInitialScrollDone(true)
  }, [isLoading, allMessages.length, initialScrollDone, targetMessageId, rows, virtualizer])

  // Re-scroll to target when images load
  useEffect(() => {
    if (targetIndexRef.current === null) return
    const el = parentRef.current
    if (!el) return

    const idx = targetIndexRef.current
    let rescrollCount = 0

    function onImgLoad() {
      if (rescrollCount++ < 10) {
        scrollToTarget(idx)
      }
    }

    el.addEventListener('load', onImgLoad, { capture: true })
    const timers = [
      setTimeout(() => scrollToTarget(idx), 300),
      setTimeout(() => scrollToTarget(idx), 800),
      setTimeout(() => { targetIndexRef.current = null }, 3000),
    ]
    return () => {
      el.removeEventListener('load', onImgLoad, { capture: true })
      timers.forEach(clearTimeout)
    }
  }, [initialScrollDone, virtualizer])

  // Infinite scroll: load older messages
  const loadOlder = useCallback(() => {
    if (loadingOlder || !hasOlder || allMessages.length === 0) return
    setLoadingOlder(true)
    const oldestId = allMessages[0].id

    fetchMessages(channelId, { limit: PAGE_SIZE, before: oldestId }).then(older => {
      if (older.length < PAGE_SIZE) setHasOlder(false)
      if (older.length > 0) {
        const sorted = [...older].reverse()
        setAllMessages(prev => [...sorted, ...prev])
      }
    }).finally(() => setLoadingOlder(false))
  }, [channelId, loadingOlder, hasOlder, allMessages])

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

  if (isLoading) {
    return <div className="message-list-loading">Loading messages...</div>
  }

  if (allMessages.length === 0) {
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
                  targeted={row.key === targetMessageId}
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
