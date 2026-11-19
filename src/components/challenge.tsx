import { useState } from 'react'
import { STORIES, storyUrl } from '#/data/content'
import { SectionHead } from '#/components/site'
import { shareText } from '#/lib/share'
import { play as sfx } from '#/lib/sfx'

/** Ship 6: Challenge Mode. Stories are better dared than advertised: three
 *  pre-written dares, one tap to send, one tap to take it yourself. */
const DARES: { slug: string; dare: string; forWho: string }[] = [
  { slug: 'i-am-the-table', dare: 'I survived being furniture. Your turn.', forWho: 'for the friend who quotes memes at funerals' },
  { slug: 'colossus-protocol', dare: '300 metres tall. Ten minutes of fuel. Go save the coast.', forWho: 'for the friend who always picks the tank' },
  { slug: 'acolytes', dare: 'Maid café by day, black-ops by night. Keep up, Agent.', forWho: 'for the friend who lies about having seen it' },
]

export function Challenge() {
  const [sent, setSent] = useState<string | null>(null)
  const send = async (slug: string, dare: string) => {
    const story = STORIES.find((s) => s.slug === slug)!
    const r = await shareText(`${dare} Play ${story.title} free:`, `${window.location.origin}/stories/${slug}`)
    if (r !== 'failed') { sfx('enter'); setSent(slug); window.setTimeout(() => setSent((v) => (v === slug ? null : v)), 2400) }
  }
  return (
    <section id="challenge" className="kx-cv scroll-mt-16 border-b border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <SectionHead kicker="04 // Challenge mode" title="Dare a friend" body="Stories spread by dare, not by ad. Pick a victim, send the dare, take it yourself after." />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {DARES.map((d) => {
            const s = STORIES.find((x) => x.slug === d.slug)!
            return (
              <li key={d.slug} className="flex flex-col border border-line bg-void">
                <div className="cover relative aspect-[16/9] overflow-hidden border-b border-line">
                  <img src={s.tile ?? s.cover} alt={`Art for ${s.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
                  <span className="absolute top-3 left-3 bg-danger px-2 py-1 font-gamer text-[10px] text-white">DARE</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-mono text-base font-bold leading-snug text-ink">“{d.dare}”</p>
                  <p className="mt-2 flex-1 text-sm text-mute">{d.forWho} · {s.title}</p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => void send(d.slug, d.dare)} className="pixel inline-flex min-h-11 items-center justify-center bg-neon px-3 font-gamer text-[11px] uppercase text-void hover:bg-ink">
                      {sent === d.slug ? '✓ Sent' : '↗ Send dare'}
                    </button>
                    <a href={storyUrl(s)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="inline-flex min-h-11 items-center justify-center border border-line px-3 font-gamer text-[11px] uppercase text-ink hover:border-neon hover:text-neon">Take it →</a>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        <p aria-live="polite" className="mt-4 font-gamer text-[11px] uppercase text-neon">{sent ? 'Dare away. Their move.' : ''}</p>
      </div>
    </section>
  )
}
