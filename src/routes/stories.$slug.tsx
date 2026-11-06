import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { Footer } from '#/components/site'
import { STORIES, TRIMZ, isekaiStoryUrl, trimzSeriesUrl } from '#/data/content'

export const Route = createFileRoute('/stories/$slug')({
  loader: ({ params }) => {
    const story = STORIES.find((s) => s.slug === params.slug)
    if (!story) throw notFound()
    return story
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.title} | KuletX AI` },
            { name: 'description', content: loaderData.logline },
            { property: 'og:title', content: loaderData.title },
            { property: 'og:description', content: loaderData.logline },
            { property: 'og:image', content: loaderData.cover },
            { name: 'theme-color', content: loaderData.accent },
          ],
        }
      : {},
  component: StorySite,
  notFoundComponent: () => (
    <div className="crt grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="pixel font-pixel text-5xl text-neon">404</p>
        <p className="mt-4 text-mute">That world hasn’t spawned yet.</p>
        <Link to="/" className="mt-6 inline-block font-gamer text-sm text-neon">
          ← Back to KuletX AI
        </Link>
      </div>
    </div>
  ),
})

function StorySite() {
  const s = Route.useLoaderData()
  const play = isekaiStoryUrl(s.id)
  const series = TRIMZ.filter((t) => s.trimz?.includes(t.slug))
  const others = STORIES.filter((o) => o.slug !== s.slug)

  return (
    <div className="crt min-h-screen" style={{ '--accent': s.accent } as CSSProperties}>
      {/* Mini-site bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="font-gamer text-xs text-mute hover:text-neon sm:text-sm">
            ← <span className="pixel font-pixel text-base text-neon">KULETX_AI</span>
          </Link>
          <a
            href={play}
            target="_blank"
            rel="noreferrer"
            className="bg-[var(--accent)] px-4 py-2 font-gamer text-xs uppercase text-void hover:brightness-110"
          >
            ▶ Play now
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line">
          <img src={s.cover} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/70 to-void" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr] md:items-center md:py-24">
            <div>
              <p className="font-gamer text-xs text-[var(--accent)] sm:text-sm">&gt; {s.kicker}</p>
              <h1 className="pixel mt-4 font-pixel text-4xl leading-[1.1] text-ink sm:text-6xl">{s.title}</h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">{s.logline}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="bg-[var(--accent)] px-2 py-0.5 font-gamer text-xs text-void">{s.rating}</span>
                {s.tags.map((t) => (
                  <span key={t} className="border border-line bg-void/60 px-2 py-0.5 text-xs text-mute">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={play}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[var(--accent)] px-5 py-3 font-gamer text-sm uppercase text-void hover:brightness-110"
                >
                  ▶ Play on IsekaiZero
                </a>
                {series[0] && (
                  <a
                    href={trimzSeriesUrl(series[0].slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-line bg-void/60 px-5 py-3 font-gamer text-sm uppercase text-ink hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Watch the series
                  </a>
                )}
              </div>
              <p className="mt-6 font-gamer text-xs text-mute">
                ♥ {s.likes} likes · ✉ {s.chats} chats on IsekaiZero
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm border border-[var(--accent)]/60 shadow-[0_0_60px_-10px_var(--accent)]">
              <img src={s.cover} alt={`Cover art for ${s.title}`} className="aspect-[3/4] w-full object-cover" />
            </div>
          </div>
        </section>

        {/* Pitch */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-16 text-lg leading-relaxed text-ink/90 sm:px-6 sm:text-xl">
            {s.pitch.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </section>

        {/* World */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-gamer text-sm text-[var(--accent)]">01 // The world</p>
            <h2 className="pixel mt-3 font-pixel text-3xl text-ink sm:text-4xl">Know the rules</h2>
            <dl className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {s.world.map((w) => (
                <div key={w.label} className="bg-void p-6">
                  <dt className="font-gamer text-xs uppercase text-[var(--accent)]">{w.label}</dt>
                  <dd className="mt-3 text-sm leading-relaxed text-mute">{w.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Cast */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-gamer text-sm text-[var(--accent)]">02 // {s.castTitle ?? 'The cast'}</p>
            <h2 className="pixel mt-3 font-pixel text-3xl text-ink sm:text-4xl">
              {s.castTitle ? 'Climb it' : 'Who you’ll meet'}
            </h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2">
              {s.cast.map((c, i) => (
                <li key={c.name} className="flex gap-4 border border-line bg-panel p-5">
                  <span className="pixel font-pixel text-2xl text-[var(--accent)]">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-mono font-bold text-ink">{c.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-mute">{c.role}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trimz */}
        {series.length > 0 && (
          <section className="border-b border-line bg-panel/40">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
              <p className="font-gamer text-sm text-[var(--accent)]">03 // On Trimz</p>
              <h2 className="pixel mt-3 font-pixel text-3xl text-ink sm:text-4xl">Watch it as a series</h2>
              <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {series.map((t) => (
                  <li key={t.slug}>
                    <a href={trimzSeriesUrl(t.slug)} target="_blank" rel="noreferrer" className="group block">
                      <div className="cover overflow-hidden border border-line group-hover:border-[var(--accent)]">
                        <img src={t.poster} alt={`Poster for ${t.title}`} loading="lazy" className="aspect-[2/3] w-full object-cover" />
                      </div>
                      <p className="mt-3 font-mono text-sm font-bold leading-snug text-ink group-hover:text-[var(--accent)]">{t.title}</p>
                      <p className="mt-1 font-gamer text-xs text-mute">
                        {t.episodes} EP · {t.views} VIEWS
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Hook + CTA */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
            <p className="pixel font-pixel text-3xl leading-tight text-ink sm:text-5xl">“{s.hook}”</p>
            <a
              href={play}
              target="_blank"
              rel="noreferrer"
              className="mt-10 inline-block bg-[var(--accent)] px-6 py-4 font-gamer text-sm uppercase text-void hover:brightness-110"
            >
              ▶ Start the story
            </a>
          </div>
        </section>

        {/* Other worlds */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-gamer text-sm text-neon">// Other worlds</p>
            <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link to="/stories/$slug" params={{ slug: o.slug }} className="group block">
                    <div className="cover overflow-hidden border border-line group-hover:border-neon">
                      <img src={o.cover} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
                    </div>
                    <p className="mt-3 font-mono text-sm font-bold leading-snug text-ink group-hover:text-neon">{o.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
