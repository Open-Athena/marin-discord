# Spec: Search autocomplete for channels and users

## Goal
When typing in the search bar, show autocomplete suggestions for channel names (prefixed with `#`) and user names (prefixed with `@`), in addition to the existing full-text message search results.

## Behavior

### Trigger
- Typing `#` shows a filtered list of channel names
- Typing `#inf` filters to channels matching "inf" (e.g. #infra, #inference)
- Typing `@` shows a filtered list of user display names
- Typing `@ah` filters to users matching "ah" (e.g. @Ahmed M Ahmed)
- Plain text (no prefix) shows message search results as today

### UI
- Autocomplete suggestions appear above/before the message search results
- Each suggestion shows the entity icon (# or @) + name + message count or role
- Clicking a channel suggestion navigates to that channel
- Clicking a user suggestion searches for messages by/mentioning that user
- Keyboard: arrow keys to navigate suggestions, Enter to select, Escape to dismiss

### Data source
- Channel and user lists are already loaded via `useChannels()` and `useUsers()` hooks (cached by TanStack Query)
- Filtering is client-side (no API call needed), instant
- Only trigger message search API call after a debounce, as today

## Implementation

1. In `SearchPanel.tsx`, add a `suggestions` computed value:
   - If query starts with `#`: filter `channels` by name match
   - If query starts with `@`: filter `users` by username/global_name match
   - Otherwise: no suggestions (just message results)
2. Render suggestions in a `<div className="search-suggestions">` above results
3. Track `selectedSuggestionIndex` for keyboard navigation
4. On Enter with a suggestion selected: navigate to channel or search for user
5. Suggestions disappear once the user continues typing past the entity name (i.e., mixed query like `#infra scaling` should search messages, not show channel suggestions)

## Notes
- This complements the `use-kbd` omnibar: omnibar is for "go to channel", search autocomplete is for "search within/about a channel"
- The `#channel` search already works for message search — this just adds the quick-nav suggestion before results load
