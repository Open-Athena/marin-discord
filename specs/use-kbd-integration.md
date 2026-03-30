# Spec: `use-kbd` integration

## Goal
Add keyboard shortcuts and omnibar (Cmd+K) to the Discord archive viewer using [`use-kbd`].

## Actions to register

### Navigation
| Action ID | Label | Default Binding | Handler |
|---|---|---|---|
| `nav:search` | Search messages | `/` | Focus search input, open panel if closed |
| `nav:channel-prev` | Previous channel | `alt+ArrowUp` | Select the channel above the current one |
| `nav:channel-next` | Next channel | `alt+ArrowDown` | Select the channel below the current one |
| `nav:channel-goto` | Go to channel… | `meta+k` (via Omnibar) | Omnibar with channel list as items |

### UI
| Action ID | Label | Default Binding | Handler |
|---|---|---|---|
| `ui:close` | Close panel | `Escape` | Close search panel (or any open modal) |
| `ui:shortcuts` | Keyboard shortcuts | `?` | Open ShortcutsModal |

### Per-channel (dynamic, registered via Omnibar items)
Each channel becomes an Omnibar item so Cmd+K → type channel name → Enter navigates there. No individual keybindings for channels; they're searchable via the omnibar.

## Implementation

1. `pnpm add use-kbd` (or `pds init -H runsascoded/use-kbd` for latest dist branch)
2. Wrap `App` in `<HotkeysProvider>`, add `<ShortcutsModal />`, `<Omnibar />`, `<SequenceModal />`
3. Import `use-kbd/styles.css`
4. Register actions in `App.tsx` (or a new `useKeyboardNav` hook)
5. Omnibar items: map `channels` array to omnibar items with `id`, `label` (`#channel-name`), `group: 'Channels'`, `handler: () => handleSelectChannel(ch)`

## Notes
- `/` for search is standard (GitHub, Slack, Discord all use it)
- `Escape` should close the topmost open thing (search > omnibar > modal)
- Omnibar doubles as channel switcher — no need for a separate channel picker UI

[`use-kbd`]: https://github.com/runsascoded/use-kbd
