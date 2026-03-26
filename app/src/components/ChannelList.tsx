import type { Channel } from '../types'
import { prefetchMessages } from '../api'

interface Props {
  channels: Channel[]
  activeChannelId: string | null
  onSelectChannel: (channel: Channel) => void
}

export default function ChannelList({ channels, activeChannelId, onSelectChannel }: Props) {
  if (!channels.length) return <div className="channel-list-loading">Loading channels...</div>

  return (
    <div className="channel-list">
      {channels.map(ch => (
        <div
          key={ch.id}
          className={`channel-item${ch.id === activeChannelId ? ' active' : ''}`}
          onClick={() => onSelectChannel(ch)}
          onMouseEnter={() => prefetchMessages(ch.id)}
        >
          <span className="channel-hash">#</span>
          <span className="channel-name">{ch.name}</span>
          <span className="channel-count">{ch.message_count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
