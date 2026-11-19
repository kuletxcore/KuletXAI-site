import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { STORIES } from '#/data/content'
import { STORY_MUSIC } from '#/data/music'
import { play as sfx } from '#/lib/sfx'

// STORY RADIO: one player for the six world themes, straight from /public/music. It never starts on its own;
// press play once and it keeps going across the slate.

const TRACKS = Object.entries(STORY_MUSIC).flatMap(([slug, track]) => {
  const story = STORIES.find((s) => s.slug === slug)
  return story ? [{ slug, track, story }] : []
})

const time = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function StoryRadio() {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [at, setAt] = useState(0)
  const [length, setLength] = useState(0)
  const audio = useRef<HTMLAudioElement>(null)
  const current = TRACKS[idx]

  const start = useCallback((i: number) => {
    const el = audio.current
    if (!el) return
    setAt(0)
    setLength(0)
    setIdx(i)
    // The source is set here, not by React: a re-render mid-playback must not reload the element
    el.src = TRACKS[i].track.src
    el.load()
    void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [])

  // The element starts on the first track, still paused
  useEffect(() => {
    const el = audio.current
    if (el && !el.getAttribute('src')) el.src = TRACKS[0].track.src
  }, [])

  const toggle = () => {
    const el = audio.current
    if (!el) return
    sfx('nav')
    if (el.paused) void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    else {
      el.pause()
      setPlaying(false)
    }
  }

  const step = (dir: 1 | -1) => {
    sfx('nav')
    start((idx + dir + TRACKS.length) % TRACKS.length)
  }

  const openTrack = useMemo(() => current?.track.trackUrl, [current])

  if (!current) return null
  const max = length || 0

  return (
    <section id="radio" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:gap-12">
          <div>
            <p className="font-gamer text-sm text-neon">03 // Soundtracks</p>
            <h2 className="pixel mt-3 font-pixel text-4xl text-ink sm:text-5xl">Turn it up</h2>
            <p className="mt-4 max-w-md text-mute">
              Every world is scored. Six themes from the storylines, streaming here while you browse. Pick one and it rolls
              on through the rest.
            </p>
            <p className="mt-4 font-gamer text-[10px] uppercase text-mute/80">
              {TRACKS.length} tracks · full albums on IsekaiZero and KageSekai
            </p>
          </div>

          <div className="border border-line bg-panel">
            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'Pause the soundtrack' : 'Play the soundtrack'}
                className="grid size-12 shrink-0 place-items-center bg-neon text-void transition-colors hover:bg-ink"
              >
                <span aria-hidden className="font-gamer text-base">
                  {playing ? '❚❚' : '▶'}
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-gamer text-[10px] uppercase text-mute">
                  <Eq on={playing} />
                  {playing ? 'Now playing' : 'Ready'}
                </p>
                <p className="truncate font-mono text-sm font-bold text-ink">{current.track.title}</p>
                <p className="truncate font-gamer text-[10px] text-mute/80">
                  {current.story.title} · {current.story.rating}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous track"
                  className="grid size-11 place-items-center border border-line text-ink hover:border-neon hover:text-neon"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next track"
                  className="grid size-11 place-items-center border border-line text-ink hover:border-neon hover:text-neon"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-line px-3 py-2">
              <input
                type="range"
                min={0}
                max={max || 1}
                step={0.1}
                value={at}
                onChange={(e) => {
                  const el = audio.current
                  if (el) {
                    el.currentTime = Number(e.target.value)
                    setAt(Number(e.target.value))
                  }
                }}
                aria-label="Seek within the track"
                className="h-1 min-w-0 flex-1 cursor-pointer accent-neon"
              />
              <span className="w-16 shrink-0 text-right font-gamer text-[10px] tabular-nums text-mute">
                {time(at)} / {time(length)}
              </span>
            </div>

            <ul className="flex flex-wrap gap-1 border-t border-line p-2" aria-label="Tracks">
              {TRACKS.map((t, i) => {
                const on = i === idx
                return (
                  <li key={t.slug}>
                    <button
                      type="button"
                      onClick={() => start(i)}
                      aria-pressed={on}
                      title={`Play ${t.track.title}`}
                      className={`inline-flex min-h-11 items-center gap-1.5 border px-2 font-gamer text-[10px] uppercase transition-colors ${
                        on ? 'border-neon text-neon' : 'border-line text-mute hover:border-neon hover:text-ink'
                      }`}
                    >
                      <span aria-hidden className={on ? 'text-neon' : 'text-mute/60'}>
                        {on && playing ? '❚❚' : '▶'}
                      </span>
                      <span className="max-w-28 truncate">{t.story.title.split(':')[0]}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="border-t border-line px-3 py-2 text-center font-mono text-[10px] text-mute/70">
              {current.track.ost ? (
                <a href={current.track.ost.url} target="_blank" rel="noreferrer" className="underline hover:text-neon">
                  {current.track.ost.title}
                </a>
              ) : (
                <a href={openTrack} target="_blank" rel="noreferrer" className="underline hover:text-neon">
                  This track on IsekaiZero
                </a>
              )}
            </p>
          </div>
        </div>
      </div>

      <audio
        ref={audio}
        preload="none"
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => start((idx + 1) % TRACKS.length)}
      />
    </section>
  )
}

/** Five bars that move only while the track plays, and hold still when the page does. */
function Eq({ on }: { on: boolean }) {
  return (
    <span className={`kx-eq ${on ? '' : 'is-idle'}`} aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}
