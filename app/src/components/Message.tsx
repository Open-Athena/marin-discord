import { useEffect, useState, type ReactNode } from 'react'
import type { Message as MessageType } from '../types'
import type { LookupData } from '../context'
import { useLookup } from '../context'
import { fetchMessage } from '../api'
import Tooltip from './Tooltip'

function avatarUrl(authorId: string, avatar: string | null): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${authorId}/${avatar}.png?size=32`
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(authorId) % 5}.png`
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function renderContent(content: string, lookup: LookupData): ReactNode[] {
  if (!content) return []

  const parts: ReactNode[] = []
  let key = 0

  // Split into code blocks first
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderInline(content.slice(lastIndex, match.index), key, lookup))
      key += 100
    }
    parts.push(
      <pre key={`cb-${key++}`} className="code-block">
        <code>{match[2]}</code>
      </pre>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(...renderInline(content.slice(lastIndex), key, lookup))
  }

  return parts
}

function renderInline(text: string, keyOffset: number, lookup: LookupData): ReactNode[] {
  const parts: ReactNode[] = []
  let key = keyOffset

  // Process inline patterns
  const inlineRegex = /(`[^`]+`)|(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\|\|(.+?)\|\|)|(\[([^\]]+)\]\((https?:\/\/[^)]+)\))|(https?:\/\/[^\s<>)]+)|(<#(\d+)>)|(<@!?(\d+)>)|(<@&(\d+)>)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // inline code
      parts.push(<code key={`ic-${key++}`} className="inline-code">{match[1].slice(1, -1)}</code>)
    } else if (match[3]) {
      // bold italic
      parts.push(<strong key={`bi-${key++}`}><em>{match[3]}</em></strong>)
    } else if (match[5]) {
      // bold
      parts.push(<strong key={`b-${key++}`}>{match[5]}</strong>)
    } else if (match[7]) {
      // italic
      parts.push(<em key={`i-${key++}`}>{match[7]}</em>)
    } else if (match[9]) {
      // spoiler
      parts.push(<span key={`sp-${key++}`} className="spoiler">{match[9]}</span>)
    } else if (match[10]) {
      // markdown link [text](url)
      parts.push(<a key={`a-${key++}`} href={match[12]} target="_blank" rel="noopener noreferrer">{match[11]}</a>)
    } else if (match[13]) {
      // bare link
      parts.push(<a key={`a-${key++}`} href={match[13]} target="_blank" rel="noopener noreferrer">{match[13]}</a>)
    } else if (match[14]) {
      // channel mention <#id>
      const chId = match[15]
      const ch = lookup.channels.get(chId)
      const chName = ch ? ch.name : 'unknown-channel'
      parts.push(<span key={`ch-${key++}`} className="mention" onClick={() => { location.hash = chId }}>#{chName}</span>)
    } else if (match[16]) {
      // user mention <@id> or <@!id>
      const user = lookup.users.get(match[17])
      const userName = user?.global_name || user?.username || 'Unknown User'
      parts.push(<span key={`um-${key++}`} className="mention">@{userName}</span>)
    } else if (match[18]) {
      // role mention <@&id>
      parts.push(<span key={`rm-${key++}`} className="mention">@role</span>)
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function isSystemMessage(type: number): boolean {
  return type === 7 || type === 18
}

function systemMessageText(msg: MessageType): string {
  if (msg.type === 7) return `${msg.global_name || msg.username} joined the server.`
  if (msg.type === 18) return `${msg.global_name || msg.username} pinned a message.`
  return ''
}

interface ReplySnippetProps {
  messageId: string
}

function ReplySnippet({ messageId }: ReplySnippetProps) {
  const [refMsg, setRefMsg] = useState<MessageType | null>(null)

  useEffect(() => {
    fetchMessage(messageId).then(setRefMsg).catch(() => {})
  }, [messageId])

  if (!refMsg) return <div className="reply-snippet">...</div>

  const displayName = refMsg.global_name || refMsg.username
  const snippet = refMsg.content.length > 100
    ? refMsg.content.slice(0, 100) + '...'
    : refMsg.content

  return (
    <div className="reply-snippet">
      <img
        className="reply-avatar"
        src={avatarUrl(refMsg.author_id, refMsg.avatar)}
        alt=""
        width={16}
        height={16}
      />
      <span className="reply-author">{displayName}</span>
      <span className="reply-text">{snippet}</span>
    </div>
  )
}

interface Props {
  message: MessageType
  compact: boolean
  onNavigate?: (channelId: string, messageId: string) => void
}

export default function MessageComponent({ message, compact, onNavigate }: Props) {
  const lookup = useLookup()

  if (isSystemMessage(message.type)) {
    return (
      <div className="message system-message" data-message-id={message.id}>
        <em>{systemMessageText(message)}</em>
        <a className="timestamp" href={`#${message.channel_id}/${message.id}`}>{formatTimestamp(message.timestamp)}</a>
      </div>
    )
  }

  const displayName = message.global_name || message.username
  const avatar = avatarUrl(message.author_id, message.avatar)
  const permalink = `#${message.channel_id}/${message.id}`

  return (
    <div className={`message${compact ? ' compact' : ''}`} data-message-id={message.id}>
      {message.reference_message_id && (
        <ReplySnippet messageId={message.reference_message_id} />
      )}
      <div className="message-body">
        {compact ? (
          <div className="compact-gutter">
            <a className="compact-timestamp" href={permalink} title={formatTimestamp(message.timestamp)}>
              {new Date(message.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </a>
          </div>
        ) : (
          <img className="avatar" src={avatar} alt="" width={40} height={40} />
        )}
        <div className="message-content">
          {!compact && (
            <div className="message-header">
              <span className="author-name">{displayName}</span>
              <a className="timestamp" href={permalink}>{formatTimestamp(message.timestamp)}</a>
              {message.edited_timestamp && <span className="edited">(edited)</span>}
            </div>
          )}
          <div className="message-text">{renderContent(message.content, lookup)}</div>

          {message.attachments.length > 0 && (
            <div className="attachments">
              {message.attachments.map(att => {
                if (att.content_type?.startsWith('image/')) {
                  return (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer">
                      <img
                        className="attachment-image"
                        src={att.url}
                        alt={att.filename}
                        style={{
                          maxWidth: Math.min(att.width || 400, 400),
                          maxHeight: 300,
                        }}
                      />
                    </a>
                  )
                }
                return (
                  <a key={att.id} className="attachment-file" href={att.url} target="_blank" rel="noopener noreferrer">
                    {att.filename} ({(att.size / 1024).toFixed(1)} KB)
                  </a>
                )
              })}
            </div>
          )}

          {message.embeds.length > 0 && (
            <div className="embeds">
              {message.embeds.map((embed, i) => (
                <div key={i} className="embed">
                  {embed.title && (
                    <div className="embed-title">
                      {embed.url ? (
                        <a href={embed.url} target="_blank" rel="noopener noreferrer">{embed.title}</a>
                      ) : embed.title}
                    </div>
                  )}
                  {embed.description && (
                    <div className="embed-description">{embed.description}</div>
                  )}
                  {embed.thumbnail_url && (
                    embed.url
                      ? <a href={embed.url} target="_blank" rel="noopener noreferrer"><img className="embed-thumbnail" src={embed.thumbnail_url} alt="" /></a>
                      : <img className="embed-thumbnail" src={embed.thumbnail_url} alt="" />
                  )}
                  {embed.image_url && (
                    embed.url
                      ? <a href={embed.url} target="_blank" rel="noopener noreferrer"><img className="embed-image" src={embed.image_url} alt="" /></a>
                      : <img className="embed-image" src={embed.image_url} alt="" />
                  )}
                </div>
              ))}
            </div>
          )}

          {message.reactions.length > 0 && (
            <div className="reactions">
              {message.reactions.map((r, i) => {
                const emoji = r.emoji_id
                  ? <img className="reaction-emoji-img" src={`https://cdn.discordapp.com/emojis/${r.emoji_id}.webp?size=20`} alt={r.emoji_name} />
                  : <span className="reaction-emoji">{r.emoji_name}</span>
                return (
                  <Tooltip key={i} content={`:${r.emoji_name}:`}>
                    <span className="reaction">
                      {emoji}
                      <span className="reaction-count">{r.count}</span>
                    </span>
                  </Tooltip>
                )
              })}
            </div>
          )}

          {message.thread_id && (
            <div
              className="thread-link"
              onClick={() => onNavigate?.(message.thread_id!, '')}
            >
              View thread
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
