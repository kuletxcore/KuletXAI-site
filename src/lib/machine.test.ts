import { describe, expect, it } from 'vitest'
import { STORIES } from '#/data/content'
import { llmsFullTxt, llmsJson, llmsTxt, storyMarkdown } from '#/lib/machine'

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

  it('uses the real creator links and hosts', () => {
    const all = llmsTxt(origin) + llmsFullTxt(origin)
    expect(all).not.toContain('/creator/kuletxcore')
    expect(all).not.toContain('kuletx-core.workers.dev')
    expect(all).toContain('/creator/6a9457a462f8f09c667828f7')
  })

  it('renders a Markdown page for every story, titled and linked back', () => {
    for (const s of STORIES) {
      const md = storyMarkdown(s, origin)
      expect(md.startsWith(`# ${s.title}`)).toBe(true)
      expect(md).toContain(`${origin}/stories/${s.slug}`)
    }
  })
})
