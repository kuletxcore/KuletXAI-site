import { describe, expect, it, vi } from 'vitest'

// isk-stats.ts reads localStorage and matchMedia through the module-level helpers it imports; stub those modules.
vi.mock('#/lib/perf', () => ({ isLite: () => true }))

const { countOf, formatCount, totalOf, trimzCountOf } = await import('#/lib/isk-stats')
const { STORIES, TRIMZ } = await import('#/data/content')

const story = STORIES[0]
const series = TRIMZ[0]

describe('countOf', () => {
  it('falls back to the baked-in number when no live stats exist', () => {
    expect(countOf(null, story, 'messages')).toBe(story.messages)
  })

  it('never shows a drop below the baked-in floor', () => {
    const stats = { t: Date.now(), stories: { [story.slug]: { messages: 1 } } }
    expect(countOf(stats, story, 'messages')).toBe(story.messages)
  })

  it('takes a live number when it is higher', () => {
    const live = story.messages + 5000
    const stats = { t: Date.now(), stories: { [story.slug]: { messages: live } } }
    expect(countOf(stats, story, 'messages')).toBe(live)
  })

  it('ignores unknown stories and non-numeric values', () => {
    const stats = { t: Date.now(), stories: { [story.slug]: { messages: 'lots' as unknown as number } } }
    expect(countOf(stats, story, 'messages')).toBe(story.messages)
    expect(countOf({ t: 0, stories: {} }, story, 'chats')).toBe(story.chats)
  })
})

describe('trimzCountOf', () => {
  it('floors views but follows live episodes', () => {
    const stats = { t: 0, stories: {}, trimz: { [series.slug]: { views: 2, episodes: series.episodes + 3 } } }
    expect(trimzCountOf(stats, series, 'views')).toBe(series.views)
    expect(trimzCountOf(stats, series, 'episodes')).toBe(series.episodes + 3)
  })

  it('keeps baked-in episodes when Trimz reports zero', () => {
    const stats = { t: 0, stories: {}, trimz: { [series.slug]: { episodes: 0 } } }
    expect(trimzCountOf(stats, series, 'episodes')).toBe(series.episodes)
  })

  it('falls back with no live data', () => {
    expect(trimzCountOf(null, series, 'views')).toBe(series.views)
  })
})

describe('totalOf', () => {
  it('equals the sum of the baked-in totals with no live data', () => {
    const expected = STORIES.reduce((n, s) => n + s.messages, 0)
    expect(totalOf(null, 'messages')).toBe(expected)
  })

  it('is never smaller than the baked-in total', () => {
    const stats = { t: 0, stories: Object.fromEntries(STORIES.map((s) => [s.slug, { chats: 0 }])) }
    const floor = STORIES.reduce((n, s) => n + s.chats, 0)
    expect(totalOf(stats, 'chats')).toBe(floor)
  })
})

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(1234567)).toBe('1,234,567')
    expect(formatCount(0)).toBe('0')
  })
})
