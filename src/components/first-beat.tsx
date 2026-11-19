import { useState } from 'react'
import type { Story } from '#/data/content'
import { storyPlatformName, storyUrl } from '#/data/content'
import { firstBeat, shortTitle } from '#/lib/machine'
import { play as sfx } from '#/lib/sfx'

/**
 * The first beat, on the story page's Overview: a playable cold open that replaces two paragraphs of pitch.
 *
 * Everything in it is the story's own words (kicker, first pitch line, world rules, hook, cast), assembled by
 * firstBeat() rather than written here. That matters for two reasons: it cannot drift from the page, and the
 * seven worlds all get a beat without seven hand-written scenes.
 *
 * The moves are ordinary buttons, so touch, mouse, Tab+Enter and a controller's focus click all work without a
 * key handler of its own: the hub already owns the number keys for sections, and two owners of "1" would be a bug.
 * The world answers once, then the exits are the platform (primary), this story's cast, and its trophy list.
 */
export function FirstBeat({ story, onOpenCast }: { story: Story; onOpenCast?: () => void }) {
  const beat = firstBeat(story)
  const [picked, setPicked] = useState<0 | 1 | null>(null)
  const platform = storyPlatformName(story)

  const pick = (i: 0 | 1) => {
    if (picked !== null) return
    sfx('enter')
    setPicked(i)
  }

  const reset = () => {
    sfx('back')
    setPicked(null)
  }

  return (
    <div className="kx-beat ps5-shadow" style={{ ['--beat-accent' as string]: story.accent }}>
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 font-semibold uppercase">
        <span className="kx-beat-dot" aria-hidden />
        <span className="text-[11px] tracking-[0.14em] text-white/90">First beat</span>
        <span className="text-[10px] tracking-[0.1em] text-white/45">· the story's own pages, cut to one turn</span>
      </div>

      <p className="mt-2.5 text-[10px] font-bold tracking-[0.16em] text-white/50 uppercase">{beat.scene}</p>

      <p className="mt-1.5 text-[13px] leading-relaxed text-white/90 md:text-sm">{beat.line}</p>

      {picked !== null && (
        <>
          <p className="kx-beat-in mt-2.5 border-l-2 border-white/25 pl-2.5 text-[12px] leading-relaxed text-white/70">
            <span className="block text-[9px] font-bold tracking-[0.14em] text-white/45 uppercase">
              {beat.you ? `You · ${beat.you}` : 'You'}
            </span>
            {beat.choices[picked].label}
          </p>
          <p className="kx-beat-in mt-2 text-[13px] leading-relaxed text-white/90 md:text-sm">
            <span className="mb-0.5 block text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: story.accent }}>
              {beat.scene.split('·')[0].trim()}
            </span>
            {beat.choices[picked].reply}
          </p>
          <p className="kx-beat-hook mt-2 text-[13px] leading-snug font-semibold text-white">{beat.hook}</p>
        </>
      )}

      {picked === null ? (
        <div className="mt-3 flex flex-col gap-1.5" role="group" aria-label="Your first move">
          {beat.choices.map((c, i) => (
            <button key={c.label} type="button" onClick={() => pick(i as 0 | 1)} className="kx-beat-move">
              <span className="kx-beat-key" aria-hidden>
                {i === 0 ? '▸' : '·'}
              </span>
              {c.label}
            </button>
          ))}
          <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-white/40 uppercase">
            Pick one · free to start · no account
          </p>
        </div>
      ) : (
        <div className="kx-beat-in mt-3 flex flex-col gap-2">
          <a href={storyUrl(story)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="ps5-cta kx-beat-cta">
            ▶ Play {shortTitle(story.title)} on {platform}
          </a>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {onOpenCast && beat.cast.length > 0 && (
              <button type="button" onClick={onOpenCast} className="kx-beat-link">
                Meet the cast ({beat.cast.length}) →
              </button>
            )}
            <button type="button" onClick={reset} className="kx-beat-link">
              ↻ Try the other move
            </button>
          </div>
          <p className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
            Scripted first beat · the live story improvises from here
          </p>
        </div>
      )}
    </div>
  )
}
