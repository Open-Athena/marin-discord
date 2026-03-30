# Spec: Prefetch on hover

## Goal
Prefetch data when the user hovers over links/items, so navigation feels instant. TanStack Query's `queryClient.prefetchQuery` makes this trivial.

## What to prefetch

### Channel list items (already done)
`ChannelList` already calls `usePrefetchMessages()` on `onMouseEnter`. This prefetches the latest 50 messages for a channel on hover. ✅

### Search results
When hovering a search result, prefetch:
- Messages around the target message (`fetchMessagesAround`)
- This way clicking the result and navigating to the message is instant

### Channel mentions in messages
When hovering `#channel-name` mentions in message content, prefetch that channel's messages.

### User mentions in messages
When hovering `@username` mentions, could prefetch a search for that user's messages. Lower priority — the search isn't instant anyway.

### Embed/link previews
Not applicable — these are external URLs, not our data.

## Implementation

### Search result hover prefetch
1. In `SearchPanel.tsx`, add `onMouseEnter` to each `.search-result`:
   ```tsx
   onMouseEnter={() => {
     queryClient.prefetchQuery({
       queryKey: ['messages', r.channel_id, r.id],
       queryFn: () => fetchMessagesAround(r.channel_id, r.id, 50)
         .then(around => fetchMessages(r.channel_id, { limit: 50 })
           .then(newest => mergeMessages(around, newest))),
       staleTime: 30_000,
     })
   }}
   ```
2. Extract the merge logic from `useMessages` into a shared helper to avoid duplication.

### Channel mention hover prefetch
1. In the `renderContent` function (or `ChannelMention` component), add `onMouseEnter` to the `<span className="channel-mention">`:
   ```tsx
   onMouseEnter={() => prefetch(channelId)}
   ```
2. Use the same `usePrefetchMessages` hook.

## Notes
- TanStack Query deduplicates: hovering the same item multiple times doesn't re-fetch
- `staleTime: 30_000` means data is considered fresh for 30s after prefetch
- Channel list prefetch is the highest-value one (already done); search result prefetch is next
