import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { HotkeysProvider, ShortcutsModal, Omnibar, LookupModal, SequenceModal, SpeedDial, useAction, useActions } from 'use-kbd'
import 'use-kbd/styles.css'
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

function useKeyboardNav({
  channels,
  activeChannel,
  searchOpen,
  onSelectChannel,
  onToggleSearch,
}: {
  channels: Channel[]
  activeChannel: Channel | null
  searchOpen: boolean
  onSelectChannel: (ch: Channel) => void
  onToggleSearch: () => void
}) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useAction('nav:search', {
    label: 'Search messages',
    group: 'Navigation',
    defaultBindings: ['/'],
    handler: () => {
      onToggleSearch()
      setTimeout(() => searchInputRef.current?.focus(), 50)
    },
  })

  useAction('nav:channel-prev', {
    label: 'Previous channel',
    group: 'Navigation',
    defaultBindings: ['alt+ArrowUp'],
    handler: () => {
      if (!channels.length) return
      const idx = activeChannel ? channels.findIndex(c => c.id === activeChannel.id) : 0
      const prev = channels[Math.max(0, idx - 1)]
      if (prev) onSelectChannel(prev)
    },
  })

  useAction('nav:channel-next', {
    label: 'Next channel',
    group: 'Navigation',
    defaultBindings: ['alt+ArrowDown'],
    handler: () => {
      if (!channels.length) return
      const idx = activeChannel ? channels.findIndex(c => c.id === activeChannel.id) : -1
      const next = channels[Math.min(channels.length - 1, idx + 1)]
      if (next) onSelectChannel(next)
    },
  })

  useAction('ui:close', {
    label: 'Close panel',
    group: 'UI',
    defaultBindings: ['Escape'],
    handler: () => {
      if (searchOpen) onToggleSearch()
    },
  })

  return { searchInputRef }
}

function AppContent() {
  const { data: channels = [] } = useChannels()
  const { data: users = [] } = useUsers()
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const lookup = useMemo(() => ({
    channels: new Map(channels.map(c => [c.id, c])),
    users: new Map(users.map(u => [u.id, u])),
  }), [channels, users])

  const navigateToHash = useCallback(() => {
    if (!channels.length) return
    const { channelId, messageId } = parseHash()
    if (channelId) {
      const ch = channels.find(c => c.id === channelId)
      setActiveChannel(ch || { id: channelId, name: '', type: 0, position: 0, message_count: 0, oldest: null, newest: null })
      setTargetMessageId(messageId)
    }
  }, [channels])

  useEffect(() => { navigateToHash() }, [navigateToHash])

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

  const toggleSearch = useCallback(() => setSearchOpen(s => !s), [])

  const { searchInputRef } = useKeyboardNav({
    channels,
    activeChannel,
    searchOpen,
    onSelectChannel: handleSelectChannel,
    onToggleSearch: toggleSearch,
  })

  // Register each channel as an omnibar-searchable action
  const channelActions = useMemo(() => {
    const actions: Record<string, { label: string; group: string; keywords: string[]; handler: () => void }> = {}
    for (const ch of channels) {
      actions[`channel:${ch.id}`] = {
        label: `#${ch.name}`,
        group: 'Channels',
        keywords: [ch.name, `#${ch.name}`],
        handler: () => handleSelectChannel(ch),
      }
    }
    return actions
  }, [channels, handleSelectChannel])
  useActions(channelActions)

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
              onClick={toggleSearch}
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
              inputRef={searchInputRef}
              onNavigate={handleNavigate}
              onClose={() => setSearchOpen(false)}
            />
          )}
        </div>
      </div>
      <ShortcutsModal />
      <Omnibar placeholder="Go to channel or command..." />
      <LookupModal />
      <SequenceModal />
      <SpeedDial />
    </LookupContext.Provider>
  )
}

export default function App() {
  return (
    <HotkeysProvider>
      <AppContent />
    </HotkeysProvider>
  )
}
