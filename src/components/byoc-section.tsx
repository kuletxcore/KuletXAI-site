import { useEffect, useId, useState } from 'react'
import { ARCHETYPES, SECRETS, announceByoc, clearByoc, forgeByoc, readByoc, type ByocPassport } from '#/lib/byoc'
import { play as sfx } from '#/lib/sfx'

/**
 * BYOC — Bring Your Original Character. Every KuletX world is played as
 * you; this forges the on-device passport that proves it. Nothing here
 * talks to a server: name, archetype and secret live in localStorage and
 * nowhere else until you choose to step into a world.
 */

const NAME_MAX = 22

const GLYPHS: Record<string, React.ReactNode> = {
  saint: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v3.4M12 18.1v3.4M2.5 12h3.4M18.1 12h3.4M5 5l2.4 2.4M16.6 16.6L19 19M19 5l-2.4 2.4M7.4 16.6L5 19" />
    </>
  ),
  ghost: <path d="M12 3a6.8 6.8 0 0 0-6.8 6.9v10.4l2.3-1.9 2.2 1.9 2.3-1.9 2.3 1.9 2.2-1.9 2.3 1.9V9.9A6.8 6.8 0 0 0 12 3zM9.6 10.4h.01M14.4 10.4h.01" />,
  spark: <path d="M13.2 2 5.4 13.6h4.8L9.1 22l7.9-11.6h-4.9z" />,
  anchor: <path d="M12 3v13M12 3a2.4 2.4 0 1 0 .01 0M7.5 9.5h9M4.5 13.5c.6 4 3.6 6.5 7.5 6.5s6.9-2.5 7.5-6.5M4.5 13.5l2.6.4M4.5 13.5l.4-2.6M19.5 13.5l-2.6.4M19.5 13.5l-.4-2.6" />,
  blade: <path d="M12 2.5 14.8 9 12 21.5 9.2 9zM6.5 12.5h11" />,
  starless: <path d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5 9.6 14.4 2.5 12l7.1-2.4z" />,
}

function ArcheGlyph({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {GLYPHS[id]}
    </svg>
  )
}

export function ByocSection() {
  const [passport, setPassport] = useState<ByocPassport | null>(null)
  const [name, setName] = useState('')
  const [archetype, setArchetype] = useState<string | null>(null)
  const [secret, setSecret] = useState<string>(SECRETS[0])
  const [stamp, setStamp] = useState(0) // increments on forge → replays the FORGED stamp
  const nameId = useId()

  // SSR renders the fresh-forge form; the on-device passport swaps in after mount
  useEffect(() => {
    const saved = readByoc()
    if (saved) {
      setPassport(saved)
      setName(saved.name)
      setArchetype(saved.archetype)
      setSecret(saved.secret)
    } else {
      setSecret(SECRETS[Math.floor(Math.random() * SECRETS.length)])
    }
  }, [])

  const valid = name.trim().length > 0 && archetype !== null

  const forge = () => {
    if (!valid || !archetype) return
    const p = forgeByoc({ name, archetype, secret })
    if (!p) return
    setPassport(p)
    setStamp((n) => n + 1)
    announceByoc()
    sfx('enter')
  }

  const erase = () => {
    clearByoc()
    setPassport(null)
    setName('')
    setArchetype(null)
    setSecret(SECRETS[Math.floor(Math.random() * SECRETS.length)])
    announceByoc()
    sfx('back')
  }

  const roll = () => {
    setSecret((cur) => {
      let next = cur
      while (next === cur) next = SECRETS[Math.floor(Math.random() * SECRETS.length)]
      return next
    })
    sfx('tab')
  }

  const shown = {
    name: name.trim() || 'YOUR NAME',
    archetype,
    secret,
  }
  const forgedOn = passport ? new Date(passport.at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : null

  return (
    <section id="byoc" aria-label="Forge your BYOC passport" className="scroll-mt-16 border-b border-line bg-panel/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-24">
        {/* The pitch + the forge form */}
        <div>
          <p className="font-gamer text-sm text-neon">00 // YOUR CHARACTER</p>
          <h2 className="pixel mt-3 font-pixel text-5xl leading-none text-ink sm:text-6xl">BYOC</h2>
          <p className="mt-4 max-w-md text-mute">
            <span className="font-semibold text-ink">Bring Your Original Character.</span> Every KuletX world is played as <em>you</em> — not a preset hero,
            not a chosen one on rails. Your name, your read on the room, the secret you carried in.
          </p>
          <ol className="mt-6 space-y-2 text-sm text-mute">
            <li><span className="font-gamer text-neon">01</span> · Forge your passport here. It stays on this device.</li>
            <li><span className="font-gamer text-neon">02</span> · Step into any world in the library below.</li>
            <li><span className="font-gamer text-neon">03</span> · On IsekaiZero or KageSekai, the storyteller writes around who you are.</li>
          </ol>

          <form className="mt-8 max-w-md" onSubmit={(e) => { e.preventDefault(); forge() }}>
            <label htmlFor={nameId} className="font-gamer text-[10px] uppercase tracking-[0.25em] text-mute">
              Callsign
            </label>
            <input
              id={nameId}
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.G. RIN AOYAMA"
              autoComplete="off"
              spellCheck={false}
              className="mt-2 w-full border border-line bg-void px-4 py-3 font-mono text-lg uppercase tracking-wide text-ink placeholder:text-mute/50 focus:border-neon focus:outline-none"
            />

            <fieldset className="mt-6">
              <legend className="font-gamer text-[10px] uppercase tracking-[0.25em] text-mute">Archetype</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ARCHETYPES.map((a) => {
                  const active = archetype === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => { setArchetype(a.id); sfx('nav') }}
                      title={a.epithet}
                      className={`flex flex-col items-center gap-1.5 border px-2 py-3 text-center transition-colors ${
                        active ? 'border-neon bg-void text-neon' : 'border-line bg-void text-mute hover:border-neon/60 hover:text-ink'
                      }`}
                    >
                      <ArcheGlyph id={a.id} />
                      <span className="font-gamer text-[10px] uppercase leading-tight">{a.name}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="font-gamer text-[10px] uppercase tracking-[0.25em] text-mute">The secret you carry in</legend>
              <div className="mt-2 flex items-stretch gap-2">
                <p className="flex-1 border border-dashed border-line bg-void px-4 py-3 text-sm italic leading-snug text-ink/90">“{secret}”</p>
                <button
                  type="button"
                  onClick={roll}
                  aria-label="Roll a different secret"
                  title="Roll a different secret"
                  className="grid w-14 shrink-0 place-items-center border border-line bg-void text-mute transition-colors hover:border-neon hover:text-neon"
                >
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.15" fill="currentColor" stroke="none" />
                    <circle cx="15.5" cy="15.5" r="1.15" fill="currentColor" stroke="none" />
                    <circle cx="15.5" cy="8.5" r="1.15" fill="currentColor" stroke="none" />
                    <circle cx="8.5" cy="15.5" r="1.15" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              </div>
            </fieldset>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!valid}
                className="border border-neon bg-neon px-6 py-3.5 font-gamer text-xs font-bold uppercase tracking-widest text-void transition-all enabled:hover:shadow-[0_0_28px_rgba(0,255,163,0.35)] disabled:cursor-not-allowed disabled:border-line disabled:bg-panel disabled:text-mute/60"
              >
                {passport ? 'Re-forge passport' : 'Forge passport'}
              </button>
              {passport && (
                <button
                  type="button"
                  onClick={erase}
                  className="px-3 py-3.5 font-gamer text-[10px] uppercase tracking-widest text-mute underline decoration-dotted underline-offset-4 hover:text-danger"
                >
                  Erase
                </button>
              )}
            </div>
            {passport && (
              <p className="mt-3 font-mono text-[11px] text-mute">On file — forged {forgedOn} · stored on this device only</p>
            )}
          </form>
        </div>

        {/* The passport card */}
        <div className="flex items-center">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative overflow-hidden border border-neon/40 bg-void shadow-[0_0_60px_rgba(0,255,163,0.07)]">
              {/* header strip */}
              <div className="flex items-center justify-between border-b border-neon/25 bg-panel/60 px-5 py-3">
                <span className="font-gamer text-[10px] uppercase tracking-[0.3em] text-neon">KuletX // BYOC Passport</span>
                <span aria-hidden className="h-4 w-20 opacity-70" style={{ background: 'repeating-linear-gradient(90deg,#e8e8e8 0 2px,transparent 2px 5px,#e8e8e8 5px 6px,transparent 6px 11px)' }} />
              </div>
              {/* identity row */}
              <div className="flex gap-5 px-5 py-6 sm:px-7">
                <div className="grid w-24 shrink-0 grid-rows-[auto_auto] sm:w-28">
                  <div className="relative grid aspect-[3/4] place-items-center overflow-hidden border border-line bg-panel">
                    <span className="pixel font-pixel text-5xl text-neon/90 sm:text-6xl">{(shown.name[0] ?? '?').toUpperCase()}</span>
                    {passport && (
                      <div
                        key={stamp}
                        aria-hidden
                        className={`pointer-events-none absolute grid place-items-center rotate-[-12deg] border-[3px] border-neon px-1.5 py-0.5 font-pixel text-[11px] uppercase tracking-widest text-neon ${stamp > 0 ? 'kx-byoc-stamp' : 'opacity-80'}`}
                      >
                        Forged
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-center font-gamer text-[8px] uppercase tracking-widest text-mute">Portrait<br />on file</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-gamer text-[9px] uppercase tracking-[0.3em] text-mute">Callsign</p>
                  <p className="mt-0.5 truncate font-mono text-xl font-bold uppercase leading-tight text-ink sm:text-2xl">{shown.name}</p>
                  <p className="mt-3 font-gamer text-[9px] uppercase tracking-[0.3em] text-mute">Archetype</p>
                  <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-neon">
                    {shown.archetype ? <ArcheGlyph id={shown.archetype} /> : null}
                    {shown.archetype ? ARCHETYPES.find((a) => a.id === shown.archetype)?.name : 'Unchosen'}
                  </p>
                  <p className="mt-3 font-gamer text-[9px] uppercase tracking-[0.3em] text-mute">Secret</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink/85 line-clamp-3">{shown.secret}</p>
                </div>
              </div>
              {/* footer strip */}
              <div className="flex items-center justify-between border-t border-neon/25 bg-panel/60 px-5 py-2.5 font-mono text-[10px] text-mute">
                <span>SERIAL <span className="text-ink">{passport?.serial ?? 'KX-·······'}</span></span>
                <span className="hidden sm:inline">VALID IN ALL WORLDS</span>
                <span>{passport ? 'ISSUED' : 'UNFORGED'}</span>
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-mute/80">
              Nothing is sent anywhere. This card never leaves your browser —<br />it just reminds the storyteller who walked in.
            </p>
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {passport ? `Passport forged for ${passport.name}.` : ''}
      </p>
    </section>
  )
}
