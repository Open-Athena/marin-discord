import { useState, useCallback, useMemo, useEffect } from 'react'
import type { Channel } from './types'
import { useChannels, useUsers } from './hooks'
import { LookupContext } from './context'
import ChannelList from './components/ChannelList'
import MessageList from './components/MessageList'
import SearchPanel from './components/SearchPanel'
import './App.css'

function parseHash(): { channelId: string | null; messageId: string | null } {
  const hash = window.location.hash.replace('#', '')
  if (!hash) return { channelId: null, messageId: null }
  const parts = hash.split('/')
  return {
    channelId: parts[0] || null,
    messageId: parts[1] || null,
  }
}

export default function App() {
  const { data: channels = [] } = useChannels()
  const { data: users = [] } = useUsers()
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const lookup = useMemo(() => ({
    channels: new Map(channels.map(c => [c.id, c])),
    users: new Map(users.map(u => [u.id, u])),
  }), [channels, users])

  // Parse hash on load and on hash changes
  const navigateToHash = useCallback(() => {
    if (!channels.length) return
    const { channelId, messageId } = parseHash()
    if (channelId) {
      const ch = channels.find(c => c.id === channelId)
      setActiveChannel(ch || { id: channelId, name: '', type: 0, position: 0, message_count: 0, oldest: null, newest: null })
      setTargetMessageId(messageId)
    }
  }, [channels])

  useEffect(() => {
    navigateToHash()
  }, [navigateToHash])

  useEffect(() => {
    window.addEventListener('hashchange', navigateToHash)
    return () => window.removeEventListener('hashchange', navigateToHash)
  }, [navigateToHash])

  const handleSelectChannel = useCallback((channel: Channel) => {
    setActiveChannel(channel)
    setTargetMessageId(null)
    window.location.hash = channel.id
  }, [])

  const handleNavigate = useCallback((channelId: string, messageId: string) => {
    window.location.hash = messageId ? `${channelId}/${messageId}` : channelId
    if (!activeChannel || activeChannel.id !== channelId) {
      setActiveChannel({ id: channelId, name: '', type: 0, position: 0, message_count: 0, oldest: null, newest: null })
    }
    setTargetMessageId(messageId || null)
  }, [activeChannel])

  return (
    <LookupContext.Provider value={lookup}>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>Discord Archive</h1>
          </div>
          <ChannelList
            channels={channels}
            activeChannelId={activeChannel?.id ?? null}
            onSelectChannel={handleSelectChannel}
          />
        </div>
        <div className="main">
          <div className="main-header">
            <div className="main-header-left">
              {activeChannel && (
                <>
                  <span className="header-hash">#</span>
                  <span className="header-channel-name">{activeChannel.name}</span>
                </>
              )}
            </div>
            <button
              className="search-toggle"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              Search
            </button>
          </div>
          <div className="main-content">
            {activeChannel ? (
              <MessageList
                key={`${activeChannel.id}-${targetMessageId || ''}`}
                channelId={activeChannel.id}
                targetMessageId={targetMessageId}
                onNavigate={handleNavigate}
              />
            ) : (
              <div className="no-channel">Select a channel to view messages</div>
            )}
          </div>
          {searchOpen && (
            <SearchPanel
              onNavigate={handleNavigate}
              onClose={() => setSearchOpen(false)}
            />
          )}
        </div>
      </div>
    </LookupContext.Provider>
  )
}
