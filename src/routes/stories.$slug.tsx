import { Link, createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { LINKS, STORIES, TRIMZ, isekaiStoryUrl, trimzSeriesUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { ISK } from '#/data/isk'
import { BOOT_HEAD_SCRIPT, BootScreen } from '#/components/boot-screen'
import { MotionConfig } from 'motion/react'
import type { IskCast, IskMedia } from '#/data/isk'

export const Route = createFileRoute('/stories/$slug')({
  loader: ({ params }) => {
    const story = STORIES.find((s) => s.slug === params.slug)
    if (!story) throw notFound()
    return story
  },
  head: ({ loaderData }) => ({
    scripts: [{ children: BOOT_HEAD_SCRIPT }],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
      },
    ],
    meta: loaderData
      ? [
          { title: `${loaderData.title} | KuletX AI` },
          { name: 'description', content: loaderData.logline },
          { property: 'og:title', content: loaderData.title },
          { property: 'og:description', content: loaderData.logline },
          { property: 'og:image', content: loaderData.cover },
          { name: 'theme-color', content: '#030508' },
        ]
      : [],
  }),
  component: StoryHub,
  notFoundComponent: () => (
    <div className="ps5 grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="ps5-title">World not found</p>
        <p className="mt-4 text-white/70">That world hasn’t spawned yet.</p>
        <Link to="/" className="ps5-cta mt-8">
          Back to KuletX AI
        </Link>
      </div>
    </div>
  ),
})

type HubTab = 'stories' | 'series'
type Section = 'overview' | 'intro' | 'cast' | 'gallery' | 'world' | 'watch'

const SECTION_LABEL: Record<Section, string> = {
  overview: 'Overview',
  intro: 'Intro',
  gallery: 'Gallery',
  world: 'World',
  cast: 'Cast',
  watch: 'Watch',
}

function StoryHub() {
  const story = Route.useLoaderData()
  const navigate = useNavigate()
  const [tab, setTab] = useState<HubTab>('stories')
  const [section, setSection] = useState<Section>('overview')
  const [seriesIdx, setSeriesIdx] = useState(0)

  const storyIdx = STORIES.findIndex((s) => s.slug === story.slug)
  const series = TRIMZ.filter((t) => story.trimz?.includes(t.slug))
  const isk = ISK[story.slug]
  const sections: Section[] = [
    'overview',
    ...(isk?.introCard ? (['intro'] as const) : []),
    'cast',
    ...(isk?.gallery.length ? (['gallery'] as const) : []),
    'world',
    ...(series.length ? (['watch'] as const) : []),
  ]
  const [modal, setModal] = useState<Modal | null>(null)
  const play = isekaiStoryUrl(story.id)
  const activeSeries = TRIMZ[seriesIdx]
  const primaryHref = tab === 'stories' ? play : trimzSeriesUrl(activeSeries.slug)

  // New story: start on its overview
  useEffect(() => setSection('overview'), [story.slug])

  const step = (dir: 1 | -1) => {
    if (tab === 'stories') {
      const next = STORIES[(storyIdx + dir + STORIES.length) % STORIES.length]
      navigate({ to: '/stories/$slug', params: { slug: next.slug }, resetScroll: false })
    } else {
      setSeriesIdx((i) => (i + dir + TRIMZ.length) % TRIMZ.length)
    }
  }

  // Controller-style keyboard shortcuts
  const keyState = useRef({ step, sections, primaryHref, tab, modal })
  keyState.current = { step, sections, primaryHref, tab, modal }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      const k = keyState.current
      if (k.modal) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        k.step(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        k.step(-1)
      } else if (e.key === 'Enter' && (!el || el === document.body)) {
        window.open(k.primaryHref, '_blank', 'noopener')
      } else if (e.key === 'm' || e.key === 'M') {
        setTab((t) => (t === 'stories' ? 'series' : 'stories'))
      } else if (k.tab === 'stories' && /^[1-6]$/.test(e.key)) {
        const s = k.sections[Number(e.key) - 1]
        if (s) setSection(s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
    <BootScreen />
    <div className="ps5">
      {/* Backdrops for every item, crossfaded by toggling is-active */}
      <div className="ps5-backdrop" aria-hidden>
        {STORIES.map((s) => (
          <Backdrop key={s.slug} src={s.cover} video={ISK[s.slug]?.videoCover} active={tab === 'stories' && s.slug === story.slug} />
        ))}
        {TRIMZ.map((t, i) => (
          <Backdrop key={t.slug} src={t.poster} active={tab === 'series' && i === seriesIdx} />
        ))}
        <div className="ps5-vignette" />
      </div>

      <div className="ps5-app">
        <TopBar tab={tab} setTab={setTab} />

        {/* Tile ribbon */}
        <div className="ps5-ribbon mt-3 md:mt-5">
          <div className="flex w-max items-center gap-3 md:gap-4" role="list">
            {tab === 'stories'
              ? STORIES.map((s) => (
                  <Tile key={s.slug} active={s.slug === story.slug} label={s.title}>
                    <Link
                      to="/stories/$slug"
                      params={{ slug: s.slug }}
                      resetScroll={false}
                      aria-current={s.slug === story.slug ? 'page' : undefined}
                      aria-label={s.title}
                      className="block h-full w-full"
                    >
                      <img src={s.cover} alt="" />
                    </Link>
                  </Tile>
                ))
              : TRIMZ.map((t, i) => (
                  <Tile key={t.slug} active={i === seriesIdx} label={t.title}>
                    <button
                      type="button"
                      onClick={() => setSeriesIdx(i)}
                      aria-pressed={i === seriesIdx}
                      aria-label={t.title}
                      className="block h-full w-full"
                    >
                      <img src={t.poster} alt="" />
                    </button>
                  </Tile>
                ))}
          </div>
        </div>

        {/* Details */}
        <section className="mt-auto flex flex-col gap-3 pt-24 pb-4 md:max-w-[680px] md:pt-6">
          {tab === 'stories' ? (
            <StoryDetails story={story} section={section} setSection={setSection} sections={sections} series={series} openModal={setModal} />
          ) : (
            <SeriesDetails idx={seriesIdx} />
          )}

          <div className="mt-2 flex items-center gap-3">
            <a href={primaryHref} target="_blank" rel="noreferrer" className="ps5-cta grow sm:grow-0">
              <PlayIcon />
              {tab === 'stories' ? 'Play on IsekaiZero' : 'Watch on Trimz'}
            </a>
            {tab === 'stories' && series[0] && (
              <a href={trimzSeriesUrl(series[0].slug)} target="_blank" rel="noreferrer" className="ps5-round" aria-label="Watch the series on Trimz" title="Watch on Trimz">
                <TvIcon />
              </a>
            )}
            <ShareButton />
            <Link to="/" className="ps5-round" aria-label="KuletX AI home" title="Home">
              <HomeIcon />
            </Link>
          </div>
        </section>

        {modal && <ModalView modal={modal} setModal={setModal} />}

        <BottomBar onPrev={() => step(-1)} onNext={() => step(1)} primaryHref={primaryHref} toggleTab={() => setTab((t) => (t === 'stories' ? 'series' : 'stories'))} />
      </div>
    </div>
    </MotionConfig>
  )
}

function Backdrop({ src, video, active }: { src: string; video?: string; active: boolean }) {
  return (
    <div className={`ps5-layer ${active ? 'is-active' : ''}`}>
      <img className="ps5-layer-blur" src={src} alt="" loading={active ? 'eager' : 'lazy'} />
      {video && active ? (
        <video className="ps5-layer-art ps5-motion" src={video} poster={src} autoPlay muted loop playsInline />
      ) : (
        <img className="ps5-layer-art" src={src} alt="" loading={active ? 'eager' : 'lazy'} />
      )}
    </div>
  )
}

function Tile({ active, label, children }: { active: boolean; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [active])
  return (
    <div ref={ref} role="listitem" title={label} className={`ps5-tile ${active ? 'is-active' : ''}`}>
      {children}
    </div>
  )
}

function TopBar({ tab, setTab }: { tab: HubTab; setTab: (t: HubTab) => void }) {
  return (
    <header className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
      <nav className="flex gap-6 overflow-x-auto md:gap-8" role="tablist" aria-label="Hub">
        <button type="button" role="tab" aria-selected={tab === 'stories'} className={`ps5-tab ${tab === 'stories' ? 'is-active' : ''}`} onClick={() => setTab('stories')}>
          Storylines
        </button>
        <button type="button" role="tab" aria-selected={tab === 'series'} className={`ps5-tab ${tab === 'series' ? 'is-active' : ''}`} onClick={() => setTab('series')}>
          Trimz Series
        </button>
        <a href={LINKS.youtube} target="_blank" rel="noreferrer" className="ps5-tab">
          YouTube
        </a>
      </nav>
      <div className="flex items-center justify-between gap-5 md:justify-end">
        <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20 md:hidden">
          <ChevronLeft /> Back
        </Link>
        <div className="flex items-center gap-5">
          <Link to="/" className="font-pixel text-lg text-white/90 hover:text-white">
            KULETX<span className="text-neon">_AI</span>
          </Link>
          <Clock />
        </div>
      </div>
    </header>
  )
}

function StoryDetails({
  story,
  section,
  setSection,
  sections,
  series,
  openModal,
}: {
  story: Story
  section: Section
  setSection: (s: Section) => void
  sections: Section[]
  series: typeof TRIMZ
  openModal: (m: Modal) => void
}) {
  const isk = ISK[story.slug]
  return (
    <>
      <Badge pill="IsekaiZero" meta={[story.rating, ...story.tags]} />
      <h1 key={story.slug} className="ps5-title">
        {story.title}
      </h1>
      <p className="ps5-shadow max-w-[560px] text-sm leading-relaxed text-white/85 md:text-[15px]">{story.logline}</p>

      <div className="mt-1 flex flex-wrap gap-2" role="tablist" aria-label="Story sections">
        {sections.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={section === s}
            className={`ps5-pill ${section === s ? 'is-active' : ''}`}
            onClick={() => setSection(s)}
          >
            {SECTION_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="ps5-glass ps5-scroll max-h-[34vh] overflow-y-auto px-5 py-4 md:max-h-[30vh]" role="tabpanel">
        {section === 'overview' && (
          <div className="space-y-3 text-sm leading-relaxed text-white/85">
            {story.pitch.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <p className="pt-1 text-xs font-semibold text-white/55">
              ♥ {story.likes} likes · {story.chats} chats on IsekaiZero
            </p>
          </div>
        )}
        {section === 'world' && (
          <dl className="grid gap-3 sm:grid-cols-2">
            {story.world.map((w) => (
              <div key={w.label}>
                <dt className="text-xs font-bold tracking-wide text-white uppercase">{w.label}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-white/75">{w.text}</dd>
              </div>
            ))}
          </dl>
        )}
        {section === 'intro' && isk?.introCard && (
          <div className="flex h-full flex-col gap-3">
            <iframe
              src={isk.introCard}
              title={`${story.title} intro card`}
              loading="lazy"
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              className="h-[22vh] w-full rounded-xl border border-white/10 bg-[#0d0f14] md:h-[19vh]"
            />
            <button type="button" className="ps5-pill self-start" onClick={() => openModal({ kind: 'card', title: story.title, src: isk.introCard!, image: story.cover })}>
              Open full intro card ↗
            </button>
          </div>
        )}
        {section === 'cast' &&
          (isk?.cast.length ? (
            <ul className="ps5-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {isk.cast.map((c) => (
                <li key={c.id} className="w-24 shrink-0 md:w-28">
                  <button type="button" onClick={() => openModal({ kind: 'cast', cast: c })} className="group block w-full text-left" aria-label={`${c.name}: open character card`}>
                    <span className="block overflow-hidden rounded-xl border-2 border-transparent group-hover:border-white group-focus-visible:border-white">
                      {c.portrait ? (
                        <img src={c.portrait} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <span className="grid aspect-[3/4] place-items-center bg-white/10 text-2xl font-bold">{c.name[0]}</span>
                      )}
                    </span>
                    <span className="mt-1.5 block text-xs leading-snug font-semibold text-white/90">{c.name}</span>
                    {c.role === 'persona' && <span className="block text-[10px] font-bold tracking-wide text-white/50 uppercase">You play</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {story.cast.map((c) => (
                <li key={c.name} className="text-sm leading-relaxed">
                  <span className="font-bold text-white">{c.name}</span>
                  <span className="text-white/75"> · {c.role}</span>
                </li>
              ))}
            </ul>
          ))}
        {section === 'gallery' && isk && (
          <ul className="ps5-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {isk.gallery.map((m, i) => (
              <li key={m.src} className="shrink-0">
                <button type="button" onClick={() => openModal({ kind: 'gallery', items: isk.gallery, index: i })} className="group block" aria-label={`Open image: ${tidyCaption(m.caption) || 'artwork'}`}>
                  <span className="relative block h-28 overflow-hidden rounded-xl border-2 border-transparent group-hover:border-white group-focus-visible:border-white md:h-32">
                    {m.type === 'video' ? (
                      <>
                        <video src={m.src} muted playsInline preload="metadata" className="h-full w-auto object-cover" />
                        <span className="absolute inset-0 grid place-items-center bg-black/30 text-xl">▶</span>
                      </>
                    ) : (
                      <img src={m.thumb} alt="" loading="lazy" className="h-full w-auto object-cover" />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {section === 'watch' && (
          <ul className="flex gap-4">
            {series.map((t) => (
              <li key={t.slug} className="w-28 shrink-0">
                <a href={trimzSeriesUrl(t.slug)} target="_blank" rel="noreferrer" className="group block">
                  <img src={t.poster} alt={`Poster for ${t.title}`} className="aspect-[2/3] w-full rounded-xl border-2 border-transparent object-cover group-hover:border-white" />
                  <p className="mt-2 text-xs font-semibold leading-snug text-white/85 group-hover:text-white">{t.title}</p>
                  <p className="text-[11px] text-white/55">
                    {t.episodes} ep · {t.views} views
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function SeriesDetails({ idx }: { idx: number }) {
  const t = TRIMZ[idx]
  const related = STORIES.find((s) => s.trimz?.includes(t.slug))
  return (
    <>
      <Badge pill="Trimz" meta={[`${t.episodes} episode${t.episodes === 1 ? '' : 's'}`, `${t.views} views`]} />
      <h1 key={t.slug} className="ps5-title">
        {t.title}
      </h1>
      <p className="ps5-shadow max-w-[560px] text-sm leading-relaxed text-white/85 md:text-[15px]">{t.summary}</p>
      {related && (
        <div className="ps5-glass flex items-center gap-4 px-4 py-3">
          <img src={related.cover} alt="" className="size-12 rounded-lg object-cover" />
          <p className="text-sm text-white/80">
            Based on the storyline{' '}
            <Link to="/stories/$slug" params={{ slug: related.slug }} className="font-bold text-white underline-offset-2 hover:underline">
              {related.title}
            </Link>
            . Play it on IsekaiZero.
          </p>
        </div>
      )}
    </>
  )
}

function Badge({ pill, meta }: { pill: string; meta: string[] }) {
  return (
    <div className="ps5-shadow flex flex-wrap items-center gap-2 text-[13px] text-white/75">
      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">{pill}</span>
      {meta.map((m, i) => (
        <span key={m} className="flex items-center gap-2">
          {i > 0 && <span className="text-white/40">•</span>}
          {m}
        </span>
      ))}
    </div>
  )
}

type Modal =
  | { kind: 'card'; title: string; src: string; image?: string }
  | { kind: 'cast'; cast: IskCast }
  | { kind: 'gallery'; items: IskMedia[]; index: number }

function tidyCaption(c: string) {
  const t = c.replace(/\.\s*use for[\s\S]*$/i, '').trim()
  return t ? t[0].toUpperCase() + t.slice(1) : ''
}

function ModalView({ modal, setModal }: { modal: Modal; setModal: (m: Modal | null) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const close = () => setModal(null)
  const isGallery = modal.kind === 'gallery'
  const go = (d: number) => {
    if (modal.kind !== 'gallery') return
    setModal({ ...modal, index: (modal.index + d + modal.items.length) % modal.items.length })
  }
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => prev?.focus()
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (isGallery && e.key === 'ArrowRight') go(1)
      if (isGallery && e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const title = modal.kind === 'cast' ? modal.cast.name : modal.kind === 'card' ? modal.title : tidyCaption(modal.items[modal.index].caption) || 'Gallery'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md md:p-8" role="dialog" aria-modal="true" aria-label={title} onClick={close}>
      <div className="ps5-glass relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden !bg-[#0b0d12]/90" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
          <p className="truncate text-sm font-bold md:text-base">{title}</p>
          <button ref={closeRef} type="button" onClick={close} className="ps5-round !size-9 text-lg" aria-label="Close">
            ✕
          </button>
        </div>

        {modal.kind === 'gallery' ? (
          <div className="relative flex min-h-0 flex-1 flex-col items-center gap-3 p-4">
            {(() => {
              const m = modal.items[modal.index]
              return m.type === 'video' ? (
                <video key={m.src} src={m.src} controls autoPlay muted loop playsInline className="max-h-[70vh] w-auto max-w-full rounded-xl" />
              ) : (
                <img key={m.src} src={m.src} alt={tidyCaption(m.caption)} className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain" />
              )
            })()}
            <div className="flex items-center gap-3 text-sm text-white/70">
              <button type="button" onClick={() => go(-1)} className="ps5-round !size-10" aria-label="Previous image">←</button>
              <span className="tabular-nums">
                {modal.index + 1} / {modal.items.length}
              </span>
              <button type="button" onClick={() => go(1)} className="ps5-round !size-10" aria-label="Next image">→</button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {(modal.kind === 'cast' ? modal.cast.portrait : modal.image) && (
              <div className="hidden shrink-0 md:block md:w-[34%]">
                <img src={modal.kind === 'cast' ? modal.cast.portrait : modal.image} alt="" className="h-full max-h-[78vh] w-full object-cover" />
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col">
              {modal.kind === 'cast' && (
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
                  {modal.cast.portrait && <img src={modal.cast.portrait} alt="" className="size-12 rounded-lg object-cover md:hidden" />}
                  <p className="text-sm leading-relaxed text-white/80">{modal.cast.summary}</p>
                </div>
              )}
              {(modal.kind === 'card' ? modal.src : modal.cast.card) ? (
                <iframe
                  src={modal.kind === 'card' ? modal.src : modal.cast.card}
                  title={`${title} card`}
                  sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  className="h-[68vh] w-full bg-[#0d0f14] md:h-[72vh]"
                />
              ) : (
                <p className="p-5 text-sm text-white/70">No card for this character yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BottomBar({
  onPrev,
  onNext,
  primaryHref,
  toggleTab,
}: {
  onPrev: () => void
  onNext: () => void
  primaryHref: string
  toggleTab: () => void
}) {
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[13px] text-white/75 md:justify-start md:gap-6">
      <Link to="/" className="hidden items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 font-semibold text-white hover:bg-white/10 md:inline-flex">
        <ChevronLeft /> Back
      </Link>
      {/* Desktop: keyboard hints */}
      <span className="hidden items-center gap-1.5 md:inline-flex">
        <span className="ps5-key">←</span>/<span className="ps5-key">→</span> Navigate
      </span>
      <span className="hidden items-center gap-1.5 md:inline-flex">
        <span className="ps5-key">Enter</span> Play
      </span>
      <span className="hidden items-center gap-1.5 lg:inline-flex">
        <span className="ps5-key">1</span>–<span className="ps5-key">{6}</span> Section
      </span>
      <span className="hidden items-center gap-1.5 md:inline-flex">
        <span className="ps5-key">M</span> Switch tab
      </span>
      {/* Touch: real buttons */}
      <div className="flex gap-2 md:hidden">
        <button type="button" onClick={onPrev} className="ps5-round !size-11 !rounded-xl" aria-label="Previous">
          ←
        </button>
        <button type="button" onClick={onNext} className="ps5-round !size-11 !rounded-xl" aria-label="Next">
          →
        </button>
      </div>
      <a href={primaryHref} target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-semibold text-white md:hidden">
        Enter
      </a>
      <button type="button" onClick={toggleTab} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-semibold text-white md:hidden">
        Switch Tab
      </button>
    </footer>
  )
}

function Clock() {
  const [now, setNow] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])
  return <span className="hidden min-w-16 text-right text-lg font-semibold tabular-nums md:inline">{now}</span>
}

function ShareButton() {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ url, title: document.title })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }
    } catch {
      /* share sheet dismissed */
    }
  }
  return (
    <button type="button" onClick={share} className="ps5-round relative" aria-label="Share this page" title="Share">
      <ShareIcon />
      {copied && (
        <span className="absolute -top-9 rounded-full bg-white px-2.5 py-1 text-xs font-bold whitespace-nowrap text-black">Link copied</span>
      )}
    </button>
  )
}

/* Icons */
const iconProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 4l15 8-15 8z" />
  </svg>
)
const TvIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M8 2l4 4 4-4" />
  </svg>
)
const ShareIcon = () => (
  <svg {...iconProps}>
    <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
    <path d="M12 3v12M7 8l5-5 5 5" />
  </svg>
)
const HomeIcon = () => (
  <svg {...iconProps}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
)
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
