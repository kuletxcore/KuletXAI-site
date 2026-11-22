import { describe, expect, it } from 'vitest'
import { STORIES } from '#/data/content'
import { firstBeat, jsonLd, llmsFullTxt, llmsJson, llmsTxt, shortTitle, storyJsonLd, storyMarkdown } from '#/lib/machine'

const origin = 'https://kuletxai.whop.site'

describe('machine layer', () => {
  const json = llmsJson(origin) as { stories: { slug: string; rating: string; play: string }[] }

  it('lists every story with a play link on the right platform', () => {
    expect(json.stories.map((s) => s.slug).sort()).toEqual(STORIES.map((s) => s.slug).sort())
    for (const s of json.stories) {
      if (s.rating === '18+') {
        expect(s.play).toMatch(/^https:\/\/www\.kagesekai\.ai\/storylines\//)
        expect(s.play).not.toContain('referralCode')
      } else {
        expect(s.play).toMatch(/^https:\/\/www\.isekaizero\.ai\/storylines\/.*referralCode=/)
      }
    }
  })

  it('links both creator pages and only real hosts', () => {
    const all = llmsTxt(origin) + llmsFullTxt(origin)
    expect(all).toContain('https://www.kagesekai.ai/creator/kuletxcore')
    expect(all).toMatch(/https:\/\/www\.isekaizero\.ai\/creator\/\S+referralCode=/)
    expect(all).not.toContain('kuletx-core.workers.dev')
  })

  it('renders a Markdown page for every story, titled and linked back', () => {
    for (const s of STORIES) {
      const md = storyMarkdown(s, origin)
      expect(md.startsWith(`# ${s.title}`)).toBe(true)
      expect(md).toContain(`${origin}/stories/${s.slug}`)
    }
  })

  it('builds a playable first beat and escapes JSON-LD safely', () => {
    for (const s of STORIES) {
      const beat = firstBeat(s)
      expect(beat.slug).toBe(s.slug)
      expect(beat.choices).toHaveLength(2)
      expect(beat.hook).toBe(s.hook)
      const ld = jsonLd(storyJsonLd(s, origin))
      expect(ld).not.toContain('<')
    }
    expect(shortTitle('Acolytes: Maid for your Protection')).toBe('Acolytes')
    expect(shortTitle('I AM THE TABLE!!!')).toBe('I AM THE TABLE')
  })
})
