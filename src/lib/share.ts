import type { Story } from '#/data/content'

/** One share path for the whole site: native sheet where it exists, clipboard after. */
export async function shareWorld(story: Story, origin: string): Promise<'shared' | 'copied' | 'failed'> {
  const url = `${origin}/stories/${story.slug}`
  try {
    if (navigator.share) { await navigator.share({ title: story.title, text: `${story.title} — ${story.logline}`, url }); return 'shared' }
    throw new Error('no native share')
  } catch {
    try { await navigator.clipboard.writeText(url); return 'copied' } catch { return 'failed' }
  }
}
export async function shareText(text: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) { await navigator.share({ title: 'KuletX AI', text, url }); return 'shared' }
    throw new Error('no native share')
  } catch {
    try { await navigator.clipboard.writeText(`${text} ${url}`); return 'copied' } catch { return 'failed' }
  }
}
