import { useEffect, useRef } from 'react'
import type { Channel } from '../types'
import { usePrefetchMessages } from '../hooks'

interface Props {
  channels: Channel[]
  activeChannelId: string | null
  onSelectChannel: (channel: Channel) => void
}

export default function ChannelList({ channels, activeChannelId, onSelectChannel }: Props) {
  const activeRef = useRef<HTMLDivElement>(null)
  const prefetch = usePrefetchMessages()

  // Scroll active channel into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeChannelId])

  if (!channels.length) return <div className="channel-list-loading">Loading channels...</div>

  return (
    <div className="channel-list">
      {channels.map(ch => (
        <div
          key={ch.id}
          ref={ch.id === activeChannelId ? activeRef : undefined}
          className={`channel-item${ch.id === activeChannelId ? ' active' : ''}`}
          onClick={() => onSelectChannel(ch)}
          onMouseEnter={() => prefetch(ch.id)}
        >
          <span className="channel-hash">#</span>
          <span className="channel-name">{ch.name}</span>
          <span className="channel-count">{ch.message_count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
