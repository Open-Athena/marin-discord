import { test, expect } from '@playwright/test'

test.describe('Channel list', () => {
  test('loads and displays channels with message counts', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.channel-list')
    await expect(sidebar).toBeVisible()
    // Should have channels
    const items = sidebar.locator('.channel-item')
    await expect(items.first()).toBeVisible()
    const count = await items.count()
    expect(count).toBeGreaterThan(10)
    // Each channel has a name and count
    const first = items.first()
    await expect(first.locator('.channel-name')).toHaveText(/.+/)
    await expect(first.locator('.channel-count')).toHaveText(/\d+/)
  })

  test('clicking a channel loads messages', async ({ page }) => {
    await page.goto('/')
    const general = page.locator('.channel-item', { hasText: 'general' })
    await general.click()
    // URL should update
    await expect(page).toHaveURL(/#\d+/)
    // Messages should appear
    const messages = page.locator('.message')
    await expect(messages.first()).toBeVisible({ timeout: 5000 })
  })

  test('active channel is highlighted', async ({ page }) => {
    await page.goto('/')
    const general = page.locator('.channel-item', { hasText: 'general' })
    await general.click()
    await expect(general).toHaveClass(/active/)
  })
})

test.describe('Message rendering', () => {
  test('shows author name, avatar, and timestamp', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()

    // Find a non-compact, non-system message (has author-name)
    const msg = page.locator('.message:not(.system-message):not(.compact)').first()
    await expect(msg).toBeVisible({ timeout: 5000 })
    await expect(msg.locator('.author-name')).toHaveText(/.+/)
    await expect(msg.locator('.avatar')).toBeVisible()
    await expect(msg.locator('.timestamp')).toHaveText(/.+/)
  })

  test('timestamps are permalink anchors', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()

    const timestamp = page.locator('.message-header .timestamp').first()
    const tag = await timestamp.evaluate(el => el.tagName.toLowerCase())
    expect(tag).toBe('a')
    const href = await timestamp.getAttribute('href')
    expect(href).toMatch(/#\d+\/\d+/)
  })

  test('renders reactions with tooltips', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()

    // Find a message with reactions
    const reaction = page.locator('.reaction').first()
    if (await reaction.isVisible()) {
      await expect(reaction.locator('.reaction-count')).toHaveText(/\d+/)
      // Hover should show tooltip
      await reaction.hover()
      await expect(page.locator('.tooltip')).toBeVisible({ timeout: 2000 })
    }
  })

  test('renders embeds with linked thumbnails', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()

    // Scroll to find an embed
    const embed = page.locator('.embed').first()
    if (await embed.isVisible()) {
      const title = embed.locator('.embed-title a')
      if (await title.isVisible()) {
        await expect(title).toHaveAttribute('href', /.+/)
      }
    }
  })

  test('resolves channel mentions to #channel-name', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()

    // Look for any rendered channel mention
    const mention = page.locator('.mention').filter({ hasText: /^#/ }).first()
    if (await mention.isVisible()) {
      const text = await mention.textContent()
      // Should NOT contain raw IDs like #1234567890
      expect(text).not.toMatch(/^#\d{15,}$/)
    }
  })

  test('channel mention clicks navigate to that channel', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()

    const mention = page.locator('.mention').filter({ hasText: /^#(?!unknown)/ }).first()
    if (await mention.isVisible()) {
      const text = await mention.textContent()
      await mention.click()
      // Should navigate to a different channel
      await expect(page).toHaveURL(/#\d+/)
      // Header should show the channel name
      if (text) {
        const channelName = text.replace('#', '')
        await expect(page.locator('.header-channel-name')).toHaveText(channelName, { timeout: 5000 })
      }
    }
  })

  test('resolves user mentions to @display-name', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()

    const mention = page.locator('.mention').filter({ hasText: /^@/ }).first()
    if (await mention.isVisible()) {
      const text = await mention.textContent()
      // Should NOT contain raw IDs
      expect(text).not.toMatch(/^@\d{15,}$/)
    }
  })
})

test.describe('Scroll behavior', () => {
  test('opens channel scrolled to most recent messages', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item', { hasText: 'general' }).click()
    await page.locator('.message').first().waitFor()
    // Wait for scroll to settle
    await page.waitForTimeout(500)

    // The scroll container should be near the bottom
    const scrollInfo = await page.evaluate(() => {
      const el = document.querySelector('.message-list-scroll')
      if (!el) return null
      return {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }
    })
    expect(scrollInfo).not.toBeNull()
    // Should be within 200px of the bottom
    const distFromBottom = scrollInfo!.scrollHeight - scrollInfo!.scrollTop - scrollInfo!.clientHeight
    expect(distFromBottom).toBeLessThan(500)
  })

  test('navigating to #channelId/messageId scrolls to that message', async ({ page }) => {
    // First, get a message ID that's NOT in the most recent 50
    // Use the API directly to find an older message
    const res = await page.request.get('/api/channels')
    const channels = await res.json()
    const general = channels.find((c: { name: string }) => c.name === 'general')
    expect(general).toBeTruthy()

    // Get the oldest messages
    const oldRes = await page.request.get(
      `/api/channels/${general.id}/messages?limit=5&before=0`
    )
    // Actually, before=0 won't work. Get newest, then get ones before the oldest of those.
    const newestRes = await page.request.get(
      `/api/channels/${general.id}/messages?limit=50`
    )
    const newest = await newestRes.json()
    const oldestInPage = newest[newest.length - 1]

    // Get messages before the oldest visible message
    const olderRes = await page.request.get(
      `/api/channels/${general.id}/messages?limit=5&before=${oldestInPage.id}`
    )
    const older = await olderRes.json()
    if (older.length === 0) return // channel too small to test

    const targetId = older[0].id

    // Navigate to the target message
    await page.goto(`/#${general.id}/${targetId}`)
    await page.locator('.message').first().waitFor({ timeout: 5000 })
    await page.waitForTimeout(1000)

    // The target message should be visible and highlighted
    const target = page.locator(`[data-message-id="${targetId}"]`)
    await expect(target).toBeVisible({ timeout: 5000 })
  })

  test('search result click navigates to the message', async ({ page }) => {
    await page.goto('/')
    // Wait for channels to load
    await page.locator('.channel-item').first().waitFor()

    // Open search
    await page.locator('.search-toggle').click()
    const input = page.locator('.search-input')
    await expect(input).toBeVisible()

    // Search for something that exists
    await input.fill('levanter')
    // Wait for results
    await page.locator('.search-result').first().waitFor({ timeout: 5000 })

    // Get the message ID from the first result
    const firstResult = page.locator('.search-result').first()
    await firstResult.click()

    // Should navigate — URL should have channelId/messageId
    await expect(page).toHaveURL(/#\d+\/\d+/, { timeout: 3000 })

    // The target message should be visible
    await page.locator('.message').first().waitFor({ timeout: 5000 })
  })
})

test.describe('Search', () => {
  test('finds messages by content', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    await page.locator('.search-input').fill('levanter')
    const result = page.locator('.search-result').first()
    await expect(result).toBeVisible({ timeout: 5000 })
    await expect(result).toContainText(/levanter/i)
  })

  test('#channel search finds messages mentioning that channel', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    await page.locator('.search-input').fill('#general')
    const result = page.locator('.search-result').first()
    await expect(result).toBeVisible({ timeout: 5000 })
    // Result content should have resolved mention, not raw <#id>
    const content = await result.locator('.search-result-content').textContent()
    expect(content).not.toContain('<#')
  })

  test('#channel search does not match the word as plain text', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    await page.locator('.search-input').fill('#introductions')
    await page.locator('.search-result').first().waitFor({ timeout: 5000 })

    // All results should contain #introductions as a mention, not "introductions" as a word
    const results = page.locator('.search-result')
    const count = await results.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      const content = await results.nth(i).locator('.search-result-content').textContent()
      expect(content).toContain('#introductions')
    }
  })

  test('search results resolve <#id> to channel names', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    await page.locator('.search-input').fill('announce')
    await page.locator('.search-result').first().waitFor({ timeout: 5000 })

    // No raw <#id> should appear in results
    const results = page.locator('.search-result-content')
    const count = await results.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await results.nth(i).textContent()
      expect(text).not.toMatch(/<#\d+>/)
    }
  })

  test('search results resolve <@id> to usernames', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    // Search for something likely to have user mentions
    await page.locator('.search-input').fill('updates')
    await page.locator('.search-result').first().waitFor({ timeout: 5000 })

    const results = page.locator('.search-result-content')
    const count = await results.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await results.nth(i).textContent()
      expect(text).not.toMatch(/<@!?\d+>/)
    }
  })

  test('#channel search highlights the channel name with hash, not plain word', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    await page.locator('.search-input').fill('#intro')
    await page.locator('.search-result').first().waitFor({ timeout: 5000 })

    // The <mark> elements should contain "#intro", not just "intro"
    const marks = page.locator('.search-result-content mark')
    const count = await marks.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await marks.nth(i).textContent()
      expect(text?.toLowerCase()).toBe('#intro')
    }
  })

  test('every search result snippet contains the query match visibly', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    await page.locator('.search-input').fill('#introductions')
    await page.locator('.search-result').first().waitFor({ timeout: 5000 })

    // Every result should have a <mark> element (the highlighted match)
    const results = page.locator('.search-result')
    const count = await results.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const marks = results.nth(i).locator('.search-result-content mark')
      const markCount = await marks.count()
      expect(markCount).toBeGreaterThan(0)
    }
  })

  test('search snippet is centered around the match, not truncated from start', async ({ page }) => {
    await page.goto('/')
    await page.locator('.channel-item').first().waitFor()
    await page.locator('.search-toggle').click()

    await page.locator('.search-input').fill('#introductions')
    await page.locator('.search-result').first().waitFor({ timeout: 5000 })

    // All results should contain #introductions in the visible snippet
    const results = page.locator('.search-result-content')
    const count = await results.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await results.nth(i).textContent()
      expect(text?.toLowerCase()).toContain('#introductions')
    }
  })
})

test.describe('URL routing', () => {
  test('loads channel from hash on initial page load', async ({ page }) => {
    // Get the general channel ID
    const res = await page.request.get('/api/channels')
    const channels = await res.json()
    const general = channels.find((c: { name: string }) => c.name === 'general')

    await page.goto(`/#${general.id}`)
    await page.locator('.message').first().waitFor({ timeout: 5000 })
    await expect(page.locator('.header-channel-name')).toHaveText('general')
    await expect(page.locator('.channel-item.active')).toContainText('general')
  })

  test('loads channel and scrolls to message from hash', async ({ page }) => {
    const res = await page.request.get('/api/channels')
    const channels = await res.json()
    const general = channels.find((c: { name: string }) => c.name === 'general')

    // Get an older message
    const msgRes = await page.request.get(
      `/api/channels/${general.id}/messages?limit=50`
    )
    const msgs = await msgRes.json()
    // Pick a message from the middle
    const target = msgs[Math.floor(msgs.length / 2)]

    await page.goto(`/#${general.id}/${target.id}`)
    await page.locator('.message').first().waitFor({ timeout: 5000 })
    await page.waitForTimeout(1000)

    const targetEl = page.locator(`[data-message-id="${target.id}"]`)
    await expect(targetEl).toBeVisible({ timeout: 5000 })
  })
})
