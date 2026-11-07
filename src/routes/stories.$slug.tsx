import { Link, createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { memo, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { STORIES, TRIMZ, isekaiStoryUrl, trimzSeriesUrl } from '#/data/content'
import type { Logo as TitleArt, Story } from '#/data/content'
import { ISK } from '#/data/isk'
import { LiveCount, LiveDot } from '#/components/live-count'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { BOOT_HEAD_SCRIPT, BootScreen } from '#/components/boot-screen'
import { Logo } from '#/components/site'
import { isMuted, play as sfx, setMuted, useMuted } from '#/lib/sfx'
import { glideIntoView, glideTo, stopAllGlides } from '#/lib/smooth-scroll'
import { PAD_LABEL, useGamepad } from '#/lib/gamepad'
import { setPerfMode, useLite, usePerfMode, watchFrameRate } from '#/lib/perf'
import { holdForMedia, playOst, setMusic, setMusicVolume, stopOst, useMusicVolume, useOstState } from '#/lib/music'
import { OSTS } from '#/data/ost'
import { TROPHIES } from '#/data/trophies'
import { SERIES_MUSIC, STORY_MUSIC } from '#/data/music'
import type { Track } from '#/data/music'
import type { PadButton, PadKind } from '#/lib/gamepad'
import { YT_CHANNEL_URL, loadYoutubeVideos, ytEmbedUrl, ytThumb, ytWatchUrl } from '#/data/youtube'
import type { YtVideo } from '#/data/youtube'
import { MotionConfig } from 'motion/react'
import type { IskCast, IskMedia } from '#/data/isk'

/** Shareable hub state: which tab, and which series / video / section is open. */
type HubSearch = { tab?: 'trimz' | 'youtube'; series?: string; v?: string; section?: string }

export const Route = createFileRoute('/stories/$slug')({
  validateSearch: (s: Record<string, unknown>): HubSearch => ({
    tab: s.tab === 'trimz' || s.tab === 'youtube' ? s.tab : undefined,
    series: typeof s.series === 'string' ? s.series : undefined,
    v: typeof s.v === 'string' ? s.v : undefined,
    section: typeof s.section === 'string' ? s.section : undefined,
  }),
  loader: async ({ params }) => {
    const story = STORIES.find((s) => s.slug === params.slug)
    if (!story) throw notFound()
    const videos = await loadYoutubeVideos()
    return { story, videos }
  },
  head: ({ loaderData }) => ({
    scripts: [{ children: BOOT_HEAD_SCRIPT }],
    links: [
      { rel: 'preload', href: '/sfx/ps5-startup.mp3', as: 'audio' },
      { rel: 'preload', href: '/brand/kuletx-ai-1200.webp', as: 'image' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
      },
    ],
    meta: loaderData
      ? [
          { title: `${loaderData.story.title} | KuletX AI` },
          { name: 'description', content: loaderData.story.logline },
          { property: 'og:title', content: loaderData.story.title },
          { property: 'og:description', content: loaderData.story.logline },
          { property: 'og:image', content: loaderData.story.cover },
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

type HubTab = 'stories' | 'series' | 'youtube'
const TAB_ORDER: HubTab[] = ['stories', 'series', 'youtube']
const TAB_LABEL: Record<HubTab, string> = { stories: 'Storylines', series: 'Trimz Series', youtube: 'YouTube' }
type Section = 'overview' | 'intro' | 'cast' | 'gallery' | 'ost' | 'trophies' | 'world' | 'watch'

const SECTION_LABEL: Record<Section, string> = {
  overview: 'Overview',
  intro: 'Intro',
  gallery: 'Gallery',
  ost: 'OST',
  trophies: 'Trophies',
  world: 'World',
  cast: 'Cast',
  watch: 'Watch',
}

const canScroll = (el: Element, dy: number) =>
  dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0

/** A same-origin iframe (our HTML cards) can be scrolled from here; YouTube can't. */
function scrollFrame(frame: HTMLIFrameElement | null, dy: number) {
  try {
    const win = frame?.contentWindow
    if (!frame || !win || !frame.src.startsWith(window.location.origin)) return false
    const doc = win.document.scrollingElement
    if (!doc || !canScroll(doc, dy)) return false
    doc.scrollTop += dy
    return true
  } catch {
    return false
  }
}

/** Left stick: scroll what's in focus — open card, then the section panel, then the page. */
function stickScroll(dy: number) {
  if (window.__kxBootActive) return
  stopAllGlides()
  const dialog = document.querySelector('[role=dialog][aria-modal]')
  if (dialog) {
    if (scrollFrame(dialog.querySelector('iframe'), dy)) return
    const box = Array.from(dialog.querySelectorAll('*')).find((el) => canScroll(el, dy) && getComputedStyle(el).overflowY !== 'visible')
    if (box) box.scrollTop += dy
    return
  }
  const panel = document.querySelector('.ps5 [role=tabpanel]')
  if (panel) {
    if (scrollFrame(panel.querySelector('iframe'), dy)) return
    if (canScroll(panel, dy)) {
      panel.scrollTop += dy
      return
    }
  }
  const page = document.scrollingElement
  // 'instant' bypasses the page's CSS smooth scrolling, which would lag a per-frame scroll
  if (page && canScroll(page, dy)) window.scrollBy({ top: dy, behavior: 'instant' })
}

function StoryHub() {
  const { story, videos } = Route.useLoaderData()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [tab, setTab] = useState<HubTab>(() => (search.tab === 'trimz' ? 'series' : search.tab === 'youtube' ? 'youtube' : 'stories'))
  const [section, setSection] = useState<Section>(() => (search.section && search.section in SECTION_LABEL ? (search.section as Section) : 'overview'))
  const [seriesIdx, setSeriesIdx] = useState(() => Math.max(0, TRIMZ.findIndex((t) => t.key === search.series)))
  const [ytIdx, setYtIdx] = useState(() => Math.max(0, videos.findIndex((v) => v.id === search.v)))
  const activeVideo: YtVideo | undefined = videos[ytIdx]

  const storyIdx = STORIES.findIndex((s) => s.slug === story.slug)
  const series = TRIMZ.filter((t) => story.trimz?.includes(t.slug))
  const isk = ISK[story.slug]
  const sections: Section[] = [
    'overview',
    ...(isk?.introCard ? (['intro'] as const) : []),
    'cast',
    ...(isk?.gallery.length ? (['gallery'] as const) : []),
    ...(OSTS[story.slug]?.tracks.length ? (['ost'] as const) : []),
    ...(TROPHIES[story.slug] ? (['trophies'] as const) : []),
    'world',
    ...(series.length ? (['watch'] as const) : []),
  ]
  const [modal, setModal] = useState<Modal | null>(null)
  useEffect(() => {
    if (!sections.includes(section)) setSection('overview')
  }, [sections.join(), section])

  // Keep the address and the hub state in step, both ways:
  // - our own changes are written with replace (so Back still leaves the page)
  // - an address we didn't write (Back/Forward, a pasted link) drives the state
  const searchKey = (q: HubSearch) => [q.tab ?? '', q.series ?? '', q.v ?? '', q.section ?? ''].join('|')
  const written = useRef(searchKey(search))
  useEffect(() => {
    const current = searchKey(search)
    if (current !== written.current) {
      written.current = current
      setTab(search.tab === 'trimz' ? 'series' : search.tab === 'youtube' ? 'youtube' : 'stories')
      setSeriesIdx(Math.max(0, TRIMZ.findIndex((t) => t.key === search.series)))
      setYtIdx(Math.max(0, videos.findIndex((v) => v.id === search.v)))
      setSection(search.section && search.section in SECTION_LABEL ? (search.section as Section) : 'overview')
      return
    }
    const next: HubSearch =
      tab === 'series'
        ? { tab: 'trimz', series: TRIMZ[seriesIdx]?.key }
        : tab === 'youtube'
          ? { tab: 'youtube', v: videos[ytIdx]?.id }
          : { section: section !== 'overview' ? section : undefined }
    const nextKey = searchKey(next)
    if (nextKey !== current) {
      written.current = nextKey
      navigate({ to: '/stories/$slug', params: { slug: story.slug }, search: next, replace: true, resetScroll: false })
    }
  }, [search, tab, section, seriesIdx, ytIdx, story.slug])
  const play = isekaiStoryUrl(story.id)
  const activeSeries = TRIMZ[seriesIdx]
  const primaryHref = tab === 'stories' ? play : tab === 'series' ? trimzSeriesUrl(activeSeries.slug) : activeVideo ? ytWatchUrl(activeVideo) : YT_CHANNEL_URL

  // New story: start on its overview
  // New story: start on its overview — unless the address asks for a section
  // (on Back/Forward the address can arrive a render before the story data does)
  const firstSlug = useRef(story.slug)
  const latestSearch = useRef(search)
  latestSearch.current = search
  useEffect(() => {
    if (story.slug === firstSlug.current) return
    firstSlug.current = ''
    if (!latestSearch.current.section) setSection('overview')
  }, [story.slug])

  const step = (dir: 1 | -1) => {
    sfx('nav')
    if (tab === 'stories') {
      const next = STORIES[(storyIdx + dir + STORIES.length) % STORIES.length]
      navigate({ to: '/stories/$slug', params: { slug: next.slug }, resetScroll: false })
    } else if (tab === 'series') {
      setSeriesIdx((i) => (i + dir + TRIMZ.length) % TRIMZ.length)
    } else if (videos.length) {
      setYtIdx((i) => (i + dir + videos.length) % videos.length)
    }
  }

  const switchTab = (next: HubTab) => {
    if (next === tab) return
    sfx('tab')
    setTab(next)
  }
  const cycleTab = (dir: 1 | -1) => switchTab(TAB_ORDER[(TAB_ORDER.indexOf(tab) + dir + TAB_ORDER.length) % TAB_ORDER.length])
  // X / Square: "enter" the highlighted section and move between its items
  const [subIdx, setSubIdx] = useState<number | null>(null)
  const subItems = () => Array.from(document.querySelectorAll<HTMLElement>('.ps5 [data-sub-scope] [data-sub-item]'))
  useEffect(() => setSubIdx(null), [story.slug, tab, section, seriesIdx])
  useEffect(() => {
    const items = subItems()
    items.forEach((el) => el.removeAttribute('data-sub-active'))
    if (subIdx === null) return
    const el = items[subIdx]
    if (!el) return
    el.setAttribute('data-sub-active', '')
    el.focus({ preventScroll: true })
    glideIntoView(el)
  }, [subIdx, modal])
  const seriesHasStory = tab === 'series' && STORIES.some((s) => s.trimz?.includes(TRIMZ[seriesIdx].slug))
  const canEnter = (tab === 'stories' && ['intro', 'cast', 'gallery', 'ost', 'trophies', 'watch'].includes(section)) || seriesHasStory
  const enterSection = () => {
    if (!canEnter) return
    const isk = ISK[story.slug]
    if (tab === 'stories' && section === 'intro' && isk?.introCard) {
      openModal({ kind: 'card', title: story.title, src: isk.introCard, image: story.cover })
      return
    }
    if (subItems().length) {
      sfx('enter')
      setSubIdx(0)
    }
  }
  const moveSub = (dir: 1 | -1) => {
    const n = subItems().length
    if (!n || subIdx === null) return
    const next = Math.min(n - 1, Math.max(0, subIdx + dir))
    if (next !== subIdx) {
      sfx('nav')
      setSubIdx(next)
    }
  }
  const leaveSub = () => {
    sfx('back')
    setSubIdx(null)
  }

  const pickSection = (s: Section) => {
    if (s === section) return
    sfx('nav')
    setSection(s)
  }
  const stepSection = (dir: 1 | -1) => {
    if (tab !== 'stories') return
    const i = sections.indexOf(section)
    const next = sections[i + dir]
    if (next) {
      pickSection(next)
      requestAnimationFrame(revealSections)
    }
  }
  const openModal = (m: Modal) => {
    sfx('enter')
    setModal(m)
  }
  const openExternal = (url: string) => {
    sfx('enter')
    const w = window.open(url, '_blank')
    if (w) w.opener = null
    else window.location.assign(url) // popup blocked (e.g. controller input)
  }
  // A / Enter / the big white button
  const primary = () => {
    if (tab === 'youtube') {
      if (activeVideo) openModal({ kind: 'video', video: activeVideo })
      else openExternal(YT_CHANNEL_URL)
    } else openExternal(primaryHref)
  }
  const goHome = () => {
    sfx('back')
    navigate({ to: '/' })
  }

  // Phones: the tile row scrolls under your finger and the selection follows the
  // tile in the first slot, then glides into place when you let go
  const ribbonRef = useRef<HTMLDivElement>(null)
  const reelIdx = tab === 'stories' ? storyIdx : tab === 'series' ? seriesIdx : ytIdx
  const reelCount = tab === 'stories' ? STORIES.length : tab === 'series' ? TRIMZ.length : videos.length
  const reel = useTouchReel(ribbonRef, reelIdx, reelCount, tab, (i, first) => {
    sfx('nav')
    if (tab === 'stories') {
      // One history entry per swipe, not one per tile it passes
      navigate({ to: '/stories/$slug', params: { slug: STORIES[i].slug }, resetScroll: false, replace: !first })
    } else if (tab === 'series') setSeriesIdx(i)
    else setYtIdx(i)
  })

  // Controller
  const pad = useGamepad((b: PadButton) => {
    const fire = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    if (window.__kxBootActive) return fire('Enter') // any button skips the start screen
    if (modal) {
      if (b === 'b') fire('Escape')
      else if (b === 'x') window.dispatchEvent(new Event('kx-toggle-redaction'))
      else if (b === 'left') fire('ArrowLeft')
      else if (b === 'right') fire('ArrowRight')
      return
    }
    if (subIdx !== null) {
      // Inside a section: D-pad picks an item, A opens/plays it, B or X steps back out
      if (b === 'left' || b === 'up') moveSub(-1)
      else if (b === 'right' || b === 'down') moveSub(1)
      else if (b === 'a') {
        const el = subItems()[subIdx]
        if (el instanceof HTMLAnchorElement && el.target === '_blank') openExternal(el.href)
        else el?.click()
      }
      else if (b === 'b' || b === 'x') leaveSub()
      else if (b === 'lb' || b === 'rb') {
        setSubIdx(null)
        cycleTab(b === 'lb' ? -1 : 1)
      }
      return
    }
    if (b === 'x') enterSection()
    else if (b === 'lb') cycleTab(-1)
    else if (b === 'rb') cycleTab(1)
    else if (b === 'left') step(-1)
    else if (b === 'right') step(1)
    else if (b === 'up') stepSection(-1)
    else if (b === 'down') stepSection(1)
    else if (b === 'a' || b === 'start') primary()
    else if (b === 'b') goHome()
    else if (b === 'y') {
      const next = !isMuted()
      setMuted(next)
      if (!next) sfx('nav')
    }
  }, stickScroll)

  // Background music for whatever is highlighted; the YouTube tab stays quiet for the videos
  const nowPlaying: Track | null =
    tab === 'stories' ? (STORY_MUSIC[story.slug] ?? null) : tab === 'series' ? (SERIES_MUSIC[activeSeries.slug] ?? null) : null
  useEffect(() => setMusic(nowPlaying?.src ?? null), [nowPlaying?.src])
  useEffect(() => () => setMusic(null), [])
  // Auto graphics: drop to Lite if this PC can't hold a decent frame rate
  useEffect(() => watchFrameRate(), [])
  // The OST player belongs to one story: leaving it (or the tab) hands back to the
  // background music. Opening that story's trophy list keeps the soundtrack going.
  useEffect(() => {
    const key = `${story.slug}|${tab}`
    const trophies = `/stories/${story.slug}/trophies`
    ostScope = key
    return () => {
      ostScope = null
      window.setTimeout(() => {
        if (ostScope === key) return // remounted on the same story and tab
        if (window.location.pathname.replace(/\/$/, '') !== trophies) stopOst()
      }, 0)
    }
  }, [story.slug, tab])
  const ostState = useOstState()
  const album = OSTS[story.slug]
  const ostTrack = album?.tracks.find((t) => t.src === ostState.src)
  const menuTrack: Track | null = ostTrack
    ? { title: ostTrack.title, src: ostTrack.src, trackUrl: ostTrack.url, ost: { title: album.title, url: album.url } }
    : nowPlaying

  // Console-style notice when a controller connects
  const [padToast, setPadToast] = useState<string | null>(null)
  useEffect(() => {
    if (!pad.connected) return
    setPadToast(pad.kind === 'playstation' ? 'PlayStation controller connected' : pad.kind === 'xbox' ? 'Xbox controller connected' : 'Controller connected')
    const id = window.setTimeout(() => setPadToast(null), 2600)
    return () => clearTimeout(id)
  }, [pad.connected, pad.kind])

  // Controller-style keyboard shortcuts
  const keyState = useRef({ step, sections, tab, modal, cycleTab, pickSection, stepSection, primary })
  keyState.current = { step, sections, tab, modal, cycleTab, pickSection, stepSection, primary }
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
      } else if (e.key === 'ArrowUp' && k.tab === 'stories') {
        e.preventDefault()
        k.stepSection(-1)
      } else if (e.key === 'ArrowDown' && k.tab === 'stories') {
        e.preventDefault()
        k.stepSection(1)
      } else if (e.key === 'Enter' && (!el || el === document.body)) {
        k.primary()
      } else if (e.key === 'q' || e.key === 'Q') {
        k.cycleTab(-1)
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'm' || e.key === 'M') {
        k.cycleTab(1)
      } else if (k.tab === 'stories' && /^[1-8]$/.test(e.key)) {
        const s = k.sections[Number(e.key) - 1]
        if (s) k.pickSection(s)
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
          <Backdrop key={t.slug} src={t.poster} video={t.video} active={tab === 'series' && i === seriesIdx} />
        ))}
        {videos.map((v, i) => (
          <Backdrop key={v.id} src={ytThumb(v.id, 'maxresdefault')} blurSrc={ytThumb(v.id)} active={tab === 'youtube' && i === ytIdx} />
        ))}
        <div className="ps5-vignette" />
      </div>

      <div className="ps5-app">
        <TopBar tab={tab} setTab={switchTab} pad={pad} nowPlaying={menuTrack} />
        {padToast && (
          <div role="status" className="ps5-glass fixed top-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 px-4 py-2.5 text-sm font-semibold">
            <PadIcon /> {padToast}
          </div>
        )}

        {/* Tile ribbon */}
        <div ref={ribbonRef} className="ps5-ribbon mt-3 md:mt-5" {...reel}>
          <div className="flex w-max items-start gap-3 md:gap-4" role="list">
            {tab === 'stories'
              ? STORIES.map((s) => (
                  <Tile key={s.slug} active={s.slug === story.slug} label={s.title}>
                    <Link
                      to="/stories/$slug"
                      params={{ slug: s.slug }}
                      preload={false} // already on this page: hovering shouldn't run the loader
                      resetScroll={false}
                      aria-current={s.slug === story.slug ? 'page' : undefined}
                      onClick={() => s.slug !== story.slug && sfx('nav')}
                      aria-label={s.title}
                      className="block h-full w-full"
                    >
                      <img src={s.tile ?? s.cover} alt="" />
                    </Link>
                  </Tile>
                ))
              : tab === 'youtube'
                ? videos.map((v, i) => (
                    <Tile key={v.id} active={i === ytIdx} label={v.title}>
                      <button
                        type="button"
                        onClick={() => {
                          if (i !== ytIdx) sfx('nav')
                          setYtIdx(i)
                        }}
                        aria-pressed={i === ytIdx}
                        aria-label={v.title}
                        className="relative block h-full w-full"
                      >
                        <img src={ytThumb(v.id)} alt="" loading="lazy" />
                        {v.short && <span className="absolute right-1 bottom-1 rounded bg-black/75 px-1 text-[9px] font-bold tracking-wide">SHORT</span>}
                      </button>
                    </Tile>
                  ))
                : TRIMZ.map((t, i) => (
                  <Tile key={t.slug} active={i === seriesIdx} label={t.title}>
                    <button
                      type="button"
                      onClick={() => {
                        if (i !== seriesIdx) sfx('nav')
                        setSeriesIdx(i)
                      }}
                      aria-pressed={i === seriesIdx}
                      aria-label={t.title}
                      className="block h-full w-full"
                    >
                      <img src={t.tile ?? t.poster} alt="" />
                    </button>
                  </Tile>
                ))}
            <div className="ps5-reel-end" aria-hidden />
          </div>
        </div>

        {/* Details */}
        <section data-sub-scope className="ps5-details mt-auto flex flex-col gap-3 pt-24 pb-4 md:max-w-[680px] md:pt-6">
          {tab === 'stories' ? (
            <StoryDetails story={story} section={section} setSection={pickSection} sections={sections} series={series} openModal={openModal} />
          ) : tab === 'series' ? (
            <SeriesDetails
              idx={seriesIdx}
              onOpenStory={(slug) => {
                sfx('enter')
                setTab('stories')
                setSection('overview')
                if (slug !== story.slug) navigate({ to: '/stories/$slug', params: { slug }, resetScroll: false })
              }}
            />
          ) : (
            <VideoDetails video={activeVideo} />
          )}

          <div className="mt-2 flex items-center gap-3">
            <a
              href={primaryHref}
              target="_blank"
              rel="noreferrer"
              className="ps5-cta grow sm:grow-0"
              onClick={(e) => {
                e.preventDefault()
                primary()
              }}
            >
              <PlayIcon />
              {tab === 'stories' ? 'Play on IsekaiZero' : tab === 'series' ? 'Watch on Trimz' : activeVideo ? (activeVideo.short ? 'Play Short' : 'Play video') : 'Open channel'}
            </a>
            {tab === 'youtube' && activeVideo && (
              <a href={ytWatchUrl(activeVideo)} target="_blank" rel="noreferrer" className="ps5-round" aria-label="Open on YouTube" title="Open on YouTube" onClick={() => sfx('enter')}>
                <YtIcon />
              </a>
            )}
            {tab === 'stories' && series[0] && (
              <a href={trimzSeriesUrl(series[0].slug)} target="_blank" rel="noreferrer" className="ps5-round" aria-label="Watch the series on Trimz" title="Watch on Trimz" onClick={() => sfx('enter')}>
                <TvIcon />
              </a>
            )}
            <ShareButton />
            <Link to="/" className="ps5-round" aria-label="KuletX AI home" title="Home" onClick={() => sfx('back')}>
              <HomeIcon />
            </Link>
          </div>
        </section>

        {modal && <ModalView modal={modal} setModal={setModal} />}

        <BottomBar onPrev={() => step(-1)} onNext={() => step(1)} onPrimary={primary} toggleTab={() => cycleTab(1)} pad={pad} tab={tab} canEnter={canEnter} inSub={subIdx !== null} section={section} />
      </div>
    </div>
    </MotionConfig>
  )
}

type LoadPlan = { preview: boolean; full: boolean }

/** Decide how far to upgrade a backdrop on this device: still → WebM preview → full MP4. */
function loadPlan(): LoadPlan {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { preview: false, full: false }
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const slow = !!conn?.saveData || /(^|slow-)(2g|3g)$/.test(conn?.effectiveType ?? '')
  const webm = document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== ''
  // No WebM support (older Safari): go straight from the still to the MP4
  return { preview: webm, full: !webm || !slow }
}

/**
 * Progressive backdrop: the still image paints first, a small WebM loop fades
 * in once it plays, then the original MP4 loads and takes over in sync.
 */
// Memoized: switching items only re-renders the two layers whose `active` changed
const Backdrop = memo(function Backdrop({ src, blurSrc, video: videoSrc, active }: { src: string; blurSrc?: string; video?: string; active: boolean }) {
  // Lite graphics: the still image only
  const lite = useLite()
  const video = lite ? undefined : videoSrc
  const [plan, setPlan] = useState<LoadPlan | null>(null)
  const [stage, setStage] = useState(0) // 0 still, 1 preview, 2 full
  // The top layer has finished fading in. Layers under it are then hidden:
  // the art fades out at its edges, so stacked layers would show through each
  // other there and look like a ghost (still + preview + full slightly out of step).
  const [settled, setSettled] = useState(0)
  useEffect(() => {
    if (stage === 0) return
    const id = window.setTimeout(() => setSettled(stage), 650)
    return () => clearTimeout(id)
  }, [stage])
  const previewRef = useRef<HTMLVideoElement>(null)
  const fullRef = useRef<HTMLVideoElement>(null)
  const synced = useRef(false)
  // Lite graphics dropped the videos: start over from the still when they come back
  useEffect(() => {
    if (video) return
    setStage(0)
    setSettled(0)
    synced.current = false
  }, [video])

  // Only start loading video the first time this item is highlighted; keep it afterwards
  useEffect(() => {
    if (active && video && !plan) setPlan(loadPlan())
  }, [active, video, plan])

  // Play only while highlighted; once the full video shows, the preview can rest
  useEffect(() => {
    const preview = previewRef.current
    const full = fullRef.current
    if (preview) {
      if (active && stage < 2) void preview.play().catch(() => {})
      else preview.pause()
    }
    if (full) {
      if (active) void full.play().catch(() => {})
      else full.pause()
    }
  }, [active, stage, plan, video])

  const webm = video?.replace(/\.mp4$/, '.webm')
  const loadFull = !!video && !!plan?.full && (stage >= 1 || !plan.preview)

  return (
    <div className={`ps5-layer ${active ? 'is-active' : ''}`}>
      <img className="ps5-layer-blur" src={blurSrc ?? src} alt="" loading={active ? 'eager' : 'lazy'} />
      <img className={`ps5-layer-art ${settled >= 1 && video ? 'invisible' : ''}`} src={src} alt="" loading={active ? 'eager' : 'lazy'} />
      {plan?.preview && webm && (
        <video
          ref={previewRef}
          className={`ps5-layer-art ps5-fade ${stage >= 1 ? 'opacity-100' : 'opacity-0'} ${settled >= 2 ? 'invisible' : ''}`}
          src={webm}
          muted
          loop
          playsInline
          autoPlay={active}
          preload="auto"
          onPlaying={() => setStage((s) => Math.max(s, 1))}
        />
      )}
      {loadFull && video && (
        <video
          ref={fullRef}
          className={`ps5-layer-art ps5-fade ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}
          src={video}
          muted
          loop
          playsInline
          autoPlay={active}
          preload="auto"
          onCanPlayThrough={(e) => {
            // Pick up where the preview is, so the swap is seamless
            const p = previewRef.current
            if (synced.current || !p || !Number.isFinite(p.currentTime)) return
            synced.current = true // seeking fires canplaythrough again; only sync once
            e.currentTarget.currentTime = p.currentTime
          }}
          onPlaying={() => setStage(2)}
        />
      )}
    </div>
  )
})

const COARSE = '(pointer: coarse)'
const SHORT_LANDSCAPE = '(orientation: landscape) and (max-height: 540px)'

/**
 * Short landscape screens scroll the page (see styles.css): after the D-pad or
 * arrow keys change section, bring the section pills and panel into view.
 */
function revealSections() {
  if (!window.matchMedia(SHORT_LANDSCAPE).matches) return
  const pills = document.querySelector('.ps5 [aria-label="Story sections"]')
  const panel = document.querySelector('.ps5 .ps5-panel')
  if (!pills || !panel) return
  const top = pills.getBoundingClientRect().top - 8
  const bottom = panel.getBoundingClientRect().bottom + 8
  let dy = 0
  if (bottom > innerHeight) dy = Math.min(bottom - innerHeight, top) // keep the pills on screen
  else if (top < 0) dy = top
  if (Math.abs(dy) > 1) glideTo(window, window.scrollY + dy)
}
// Which story/tab owns the OST player right now (null while the hub isn't mounted)
let ostScope: string | null = null

/**
 * Touch screens: a "fixed-focus reel". The row scrolls natively; whichever tile
 * sits in the first slot becomes the selection (with a nav tick), and when the
 * row comes to rest it glides so that tile lines up exactly. Selection changes
 * from taps, the D-pad or the address glide the row the same way.
 * `pick(i, first)` gets first=true for the first change in a gesture.
 */
function useTouchReel(
  ref: React.RefObject<HTMLDivElement | null>,
  index: number,
  count: number,
  scope: string,
  pick: (i: number, first: boolean) => void,
) {
  const st = useRef({ touching: false, gliding: false, raf: 0, timer: 0, glideEnd: 0, target: 0, picked: index, fromScroll: -1, picksThisGesture: 0 })
  const pickRef = useRef(pick)
  pickRef.current = pick
  const countRef = useRef(count)
  countRef.current = count

  const coarse = () => typeof window !== 'undefined' && window.matchMedia(COARSE).matches
  const list = () => ref.current?.firstElementChild as HTMLElement | null | undefined
  // Width of one small tile plus the gap: tile i is in the first slot at scrollLeft = i * step
  const stepPx = () => {
    const l = list()
    if (!l) return 0
    const slots = Array.from(l.querySelectorAll<HTMLElement>(':scope > .ps5-tile-slot'))
    if (!slots.length) return 0
    const small = Math.min(...slots.map((el) => el.offsetWidth))
    return small + (parseFloat(getComputedStyle(l).columnGap) || 0)
  }
  // Room after the last tile, so every tile can reach the first slot
  const sizeSpacer = () => {
    const row = ref.current
    const end = list()?.querySelector<HTMLElement>(':scope > .ps5-reel-end')
    if (!row || !end) return
    if (!coarse()) {
      end.style.width = '0px'
      return
    }
    const cs = getComputedStyle(row)
    const inner = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    const l = list()
    const gap = l ? parseFloat(getComputedStyle(l).columnGap) || 0 : 0
    const small = stepPx() - gap
    // the selected tile is drawn 1.45× (see .ps5-tile.is-active)
    end.style.width = `${Math.max(0, Math.ceil(inner - small * 1.45 - gap) + 1)}px`
  }

  const stopGlide = () => {
    const s = st.current
    if (s.raf) cancelAnimationFrame(s.raf)
    s.raf = 0
    s.gliding = false
    clearTimeout(s.glideEnd)
  }
  const glideTo = (i: number, instant = false) => {
    const row = ref.current
    const s = st.current
    if (!row) return
    sizeSpacer()
    s.target = i * stepPx()
    s.gliding = true
    clearTimeout(s.glideEnd)
    const done = () => {
      s.raf = 0
      // the browser fires one more scroll event for the last write
      s.glideEnd = window.setTimeout(() => (s.gliding = false), 120)
    }
    if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (s.raf) cancelAnimationFrame(s.raf)
      row.scrollLeft = s.target
      done()
      return
    }
    if (s.raf) return // already gliding: just move the destination
    const tick = () => {
      const target = Math.min(s.target, row.scrollWidth - row.clientWidth)
      const cur = row.scrollLeft
      const d = target - cur
      if (Math.abs(d) < 0.5) {
        row.scrollLeft = target
        return done()
      }
      row.scrollLeft = cur + d * 0.28
      if (row.scrollLeft === cur) return done() // clamped by the browser
      s.raf = requestAnimationFrame(tick)
    }
    s.raf = requestAnimationFrame(tick)
  }
  const settleSoon = (ms: number) => {
    const s = st.current
    clearTimeout(s.timer)
    s.timer = window.setTimeout(() => {
      if (!s.touching) glideTo(s.picked)
    }, ms)
  }

  // Selection changed by anything other than this row's own scrolling: glide to it
  const first = useRef(true)
  useEffect(() => {
    const s = st.current
    s.picked = index
    if (!coarse()) return
    if (index === s.fromScroll) {
      s.fromScroll = -1
      return
    }
    if (s.touching) return
    glideTo(index, first.current)
    first.current = false
  }, [index, scope, count])

  useEffect(() => {
    const onResize = () => coarse() && glideTo(st.current.picked, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      stopGlide()
      clearTimeout(st.current.timer)
    }
  }, [])

  return {
    onScroll: () => {
      const row = ref.current
      const s = st.current
      if (!row || !coarse() || s.gliding) return
      const step = stepPx()
      if (step <= 0) return
      const i = Math.min(countRef.current - 1, Math.max(0, Math.round(row.scrollLeft / step)))
      if (i !== s.picked) {
        s.picked = i
        s.fromScroll = i
        pickRef.current(i, s.picksThisGesture++ === 0)
      }
      if (!s.touching) settleSoon(140)
    },
    onTouchStart: () => {
      const s = st.current
      s.touching = true
      s.picksThisGesture = 0
      stopGlide()
      clearTimeout(s.timer)
    },
    onTouchEnd: () => {
      st.current.touching = false
      settleSoon(150)
    },
    onTouchCancel: () => {
      st.current.touching = false
      settleSoon(150)
    },
  }
}

function Tile({ active, label, children }: { active: boolean; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  // When the name would run past the edge of the tile row (e.g. the last tile on a phone), anchor it to the tile's right side
  const [alignEnd, setAlignEnd] = useState(false)
  useEffect(() => {
    if (!active) return
    // Touch screens: the row's position is driven by useTouchReel instead
    // (Lite graphics: jump instead of a smooth scroll)
    const smooth = !document.documentElement.classList.contains('kx-lite')
    if (!window.matchMedia(COARSE).matches) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' })
    const measure = () => {
      const label = labelRef.current
      const row = ref.current?.closest('.ps5-ribbon')
      if (!label || !row) return
      setAlignEnd(false)
      requestAnimationFrame(() => {
        const overflow = label.getBoundingClientRect().right > row.getBoundingClientRect().right - 8
        setAlignEnd(overflow)
      })
    }
    const id = window.setTimeout(measure, 380) // after the smooth scroll settles
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', measure)
    }
  }, [active])
  return (
    <div ref={ref} role="listitem" className="ps5-tile-slot">
      <div title={label} className={`ps5-tile ${active ? 'is-active' : ''}`}>
        {children}
      </div>
      {active && (
        <span ref={labelRef} key={label} className="ps5-tile-label" data-align={alignEnd ? 'end' : undefined} aria-hidden>
          {label}
        </span>
      )}
    </div>
  )
}

function TopBar({ tab, setTab, pad, nowPlaying }: { tab: HubTab; setTab: (t: HubTab) => void; pad: { connected: boolean; kind: PadKind }; nowPlaying: Track | null }) {
  const labels = PAD_LABEL[pad.kind]
  return (
    <header className="ps5-top flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 md:gap-4">
        <ShoulderHint label={pad.connected ? labels.lb : 'Q'} />
        <nav className="ps5-tabs flex gap-6 md:gap-8" role="tablist" aria-label="Hub">
          {TAB_ORDER.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`ps5-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </nav>
        <ShoulderHint label={pad.connected ? labels.rb : 'E'} />
      </div>
      <div className="flex items-center justify-between gap-5 md:justify-end">
        <Link to="/" onClick={() => sfx('back')} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20 md:hidden">
          <ChevronLeft /> Back
        </Link>
        <div className="flex items-center gap-4 md:gap-5">
          <SoundMenu nowPlaying={nowPlaying} />
          <Link to="/" aria-label="KuletX AI home" className="shrink-0 transition-transform hover:scale-[1.03]">
            <Logo className="h-8 md:h-9" />
          </Link>
          <Clock />
        </div>
      </div>
    </header>
  )
}

/** Title as its logotype (like a console game tile), falling back to text. */
function TitleLogo({ title, logo }: { title: string; logo?: TitleArt }) {
  if (!logo) return <h1 className="ps5-title">{title}</h1>
  return (
    <h1 className="ps5-title-logo">
      <img src={logo.src} alt={title} width={logo.w} height={logo.h} className="ps5-logo" />
    </h1>
  )
}

function ShoulderHint({ label }: { label: string }) {
  return (
    <span className="hidden shrink-0 md:inline-flex" aria-hidden>
      <span className="ps5-key !h-6 !min-w-8 !rounded-md text-[11px] opacity-70">{label}</span>
    </span>
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
  const live = useIskStats()
  return (
    <>
      <Badge
        pill="IsekaiZero"
        meta={[story.rating, ...story.tags]}
        extra={
          <span className="flex items-center gap-1.5" title="Messages players have sent in this story on IsekaiZero">
            <LiveDot />
            <LiveCount value={countOf(live, story, 'messages')} /> messages
          </span>
        }
      />
      <TitleLogo key={story.slug} title={story.title} logo={story.logo} />
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

      <div className="ps5-glass ps5-scroll ps5-panel max-h-[34vh] overflow-y-auto px-5 py-4 md:max-h-[30vh]" role="tabpanel">
        {section === 'overview' && (
          <div className="space-y-3 text-sm leading-relaxed text-white/85">
            {story.pitch.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <p className="pt-1 text-xs font-semibold text-white/55">
              ♥ <LiveCount value={countOf(live, story, 'likes')} /> likes · <LiveCount value={countOf(live, story, 'chats')} /> chats ·{' '}
              <LiveCount value={countOf(live, story, 'messages')} /> messages on IsekaiZero
            </p>
            {STORY_MUSIC[story.slug]?.ost && (
              <p className="text-xs text-white/55">
                ♪ Soundtrack:{' '}
                <a href={STORY_MUSIC[story.slug].ost!.url} target="_blank" rel="noreferrer" className="font-semibold text-white/85 hover:text-white hover:underline">
                  {STORY_MUSIC[story.slug].ost!.title}
                </a>
              </p>
            )}
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
            <CardFrame
              src={isk.introCard}
              title={`${story.title} intro card`}
              lazy
              frameClassName="h-[22vh] w-full rounded-xl border border-white/10 bg-[#0d0f14] md:h-[19vh]"
            />
            <button type="button" data-sub-item className="ps5-pill self-start" onClick={() => openModal({ kind: 'card', title: story.title, src: isk.introCard!, image: story.cover })}>
              Open full intro card ↗
            </button>
          </div>
        )}
        {section === 'cast' &&
          (isk?.cast.length ? (
            <ul className="ps5-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {isk.cast.map((c) => (
                <li key={c.id} className="w-24 shrink-0 md:w-28">
                  <button type="button" data-sub-item onClick={() => openModal({ kind: 'cast', cast: c })} className="group block w-full text-left" aria-label={`${c.name}: open character card`}>
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
                <button type="button" data-sub-item onClick={() => openModal({ kind: 'gallery', items: isk.gallery, index: i })} className="group block" aria-label={`Open image: ${tidyCaption(m.caption) || 'artwork'}`}>
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
        {section === 'ost' && OSTS[story.slug] && <OstPanel slug={story.slug} />}
        {section === 'trophies' && TROPHIES[story.slug] && <TrophiesPanel slug={story.slug} />}
        {section === 'watch' && (
          <ul className="flex gap-4">
            {series.map((t) => (
              <li key={t.slug} className="w-28 shrink-0">
                <a href={trimzSeriesUrl(t.slug)} target="_blank" rel="noreferrer" data-sub-item className="group block">
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

function SeriesDetails({ idx, onOpenStory }: { idx: number; onOpenStory: (slug: string) => void }) {
  const t = TRIMZ[idx]
  const related = STORIES.find((s) => s.trimz?.includes(t.slug))
  return (
    <>
      <Badge pill="Trimz" meta={[`${t.episodes} episode${t.episodes === 1 ? '' : 's'}`, `${t.views} views`]} />
      <TitleLogo key={t.slug} title={t.title} logo={t.logo} />
      <p className="ps5-shadow max-w-[560px] text-sm leading-relaxed text-white/85 md:text-[15px]">{t.summary}</p>
      {related && (
        <a
          href={`/stories/${related.slug}`}
          data-sub-item
          onClick={(e) => {
            e.preventDefault()
            onOpenStory(related.slug)
          }}
          className="ps5-glass group flex items-center gap-4 px-4 py-3 transition-colors hover:!bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
          aria-label={`Open the storyline ${related.title}`}
        >
          <img src={related.tile ?? related.cover} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
          <p className="min-w-0 flex-1 text-sm text-white/80">
            Based on the storyline <span className="font-bold text-white">{related.title}</span>. Open it in Storylines.
          </p>
          <span className="shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:text-white" aria-hidden>
            →
          </span>
        </a>
      )}
      {SERIES_MUSIC[t.slug] && (
        <p className="ps5-shadow text-xs text-white/60">
          ♪ Now playing:{' '}
          <a href={SERIES_MUSIC[t.slug].trackUrl} target="_blank" rel="noreferrer" className="font-semibold text-white/85 hover:text-white hover:underline">
            {SERIES_MUSIC[t.slug].title}
          </a>
        </p>
      )}
    </>
  )
}

const fmtLen = (secs: number) => {
  const m = Math.floor(secs / 60)
  const sec = Math.round(secs % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function OstPanel({ slug }: { slug: string }) {
  const album = OSTS[slug]
  const state = useOstState()
  const total = album.tracks.reduce((n, t) => n + t.duration, 0)
  const playAt = (i: number) => {
    const t = album.tracks[i]
    playOst(t.src, () => playAt((i + 1) % album.tracks.length)) // continue through the album
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {album.image && <img src={album.image} alt="" className="size-12 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0">
          <a href={album.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-bold text-white hover:underline">
            {album.title}
          </a>
          <p className="text-xs text-white/55">
            {album.tracks.length} track{album.tracks.length === 1 ? '' : 's'} · {Math.round(total / 60)} min · streams from IsekaiZero
          </p>
        </div>
      </div>
      <ol className="-mx-2" aria-label={`${album.title} tracks`}>
        {album.tracks.map((t, i) => {
          const current = state.src === t.src
          const playing = current && state.playing
          return (
            <li key={t.id} className="flex items-center gap-1">
              <button
                type="button"
                data-sub-item
                onClick={() => playAt(i)}
                aria-label={`${playing ? 'Pause' : 'Play'} ${t.title}`}
                aria-current={current ? 'true' : undefined}
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 ${current ? 'bg-white/10' : ''}`}
              >
                <span className="grid w-5 shrink-0 place-items-center text-xs tabular-nums text-white/50">
                  {playing ? <EqBars /> : current ? '❚❚' : i + 1}
                </span>
                {t.image && <img src={t.image} alt="" loading="lazy" className="size-8 shrink-0 rounded object-cover" />}
                <span className={`min-w-0 flex-1 truncate text-sm ${current ? 'font-bold text-white' : 'text-white/85'}`}>{t.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-white/50">{fmtLen(t.duration)}</span>
              </button>
              <a
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className="grid size-8 shrink-0 place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
                aria-label={`Open ${t.title} on IsekaiZero`}
                title="Open on IsekaiZero"
              >
                ↗
              </a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const GRADE_COLOR = { platinum: '#9cc8f0', gold: '#f2c14e', silver: '#c9ced6', bronze: '#d08a5c' } as const

function TrophiesPanel({ slug }: { slug: string }) {
  const set = TROPHIES[slug]
  const count = (g: keyof typeof GRADE_COLOR) => set.trophies.filter((t) => t.grade === g).length
  const preview = set.trophies.filter((t) => !t.hidden).slice(0, 3)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span className="font-bold text-white">{set.trophies.length} trophies</span>
        {(['platinum', 'gold', 'silver', 'bronze'] as const).map((g) => (
          <span key={g} className="flex items-center gap-1.5 text-white/75">
            <span className="size-2.5 rounded-full" style={{ background: GRADE_COLOR[g] }} aria-hidden />
            {count(g)} {g[0].toUpperCase() + g.slice(1)}
          </span>
        ))}
      </div>
      <ul className="space-y-1.5">
        {preview.map((t) => (
          <li key={t.id} className="flex items-baseline gap-2 text-sm">
            <span className="size-2 shrink-0 translate-y-[-1px] rounded-full" style={{ background: GRADE_COLOR[t.grade] }} aria-hidden />
            <span className="shrink-0 font-semibold whitespace-nowrap text-white">{t.title}</span>
            <span className="truncate text-white/55">{t.description}</span>
          </li>
        ))}
      </ul>
      <Link to="/stories/$slug/trophies" params={{ slug }} data-sub-item onClick={() => sfx('enter')} className="ps5-pill self-start !px-4 !py-1.5 !text-[13px]">
        View all {set.trophies.length} trophies →
      </Link>
    </div>
  )
}

function EqBars() {
  return (
    <span className="kx-eq" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return y && m && d ? `${MONTHS[m - 1]} ${d}, ${y}` : iso
}

function VideoDetails({ video }: { video?: YtVideo }) {
  const [playing, setPlaying] = useState<string | null>(null)
  useEffect(() => setPlaying(null), [video?.id])
  if (!video) {
    return (
      <>
        <Badge pill="YouTube" meta={['@kuletxai']} />
        <h1 className="ps5-title">No videos yet</h1>
        <p className="ps5-shadow text-sm text-white/85">New uploads on the channel show up here automatically.</p>
      </>
    )
  }
  const related = STORIES.find((s) => video.title.toLowerCase().startsWith(s.title.split(':')[0].toLowerCase()))
  return (
    <>
      <Badge pill="YouTube" meta={[video.short ? 'Short' : 'Episode', fmtDate(video.published), `${video.views.toLocaleString('en-US')} views`]} />
      <h1 key={video.id} className="ps5-title">
        {video.title}
      </h1>
      <p className="ps5-shadow max-w-[560px] text-sm leading-relaxed text-white/85 md:text-[15px]">
        From @kuletxai: outslopping the competition.
        {related && (
          <>
            {' '}
            Part of{' '}
            <Link to="/stories/$slug" params={{ slug: related.slug }} className="font-bold text-white underline-offset-2 hover:underline">
              {related.title}
            </Link>
            .
          </>
        )}
      </p>
      <div className="ps5-glass flex items-center justify-center p-3">
        <div className={`relative overflow-hidden rounded-xl bg-black ${video.short ? 'aspect-[9/16] h-[26vh]' : 'aspect-video h-[26vh] max-w-full'}`}>
          {playing === video.id ? (
            <iframe
              src={ytEmbedUrl(video.id)}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                sfx('enter')
                setPlaying(video.id)
              }}
              className="group absolute inset-0"
              aria-label={`Play ${video.title} here`}
            >
              <img src={ytThumb(video.id)} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover:bg-black/10">
                <span className="grid size-14 place-items-center rounded-full bg-white text-black shadow-lg transition-transform group-hover:scale-110">
                  <PlayIcon />
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function Badge({ pill, meta, extra }: { pill: string; meta: string[]; extra?: ReactNode }) {
  return (
    <div className="ps5-shadow flex flex-wrap items-center gap-2 text-[13px] text-white/75">
      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">{pill}</span>
      {meta.map((m, i) => (
        <span key={m} className="flex items-center gap-2">
          {i > 0 && <span className="text-white/40">•</span>}
          {m}
        </span>
      ))}
      {extra && (
        <>
          <span className="text-white/40">•</span>
          {extra}
        </>
      )}
    </div>
  )
}

type Modal =
  | { kind: 'card'; title: string; src: string; image?: string }
  | { kind: 'cast'; cast: IskCast }
  | { kind: 'gallery'; items: IskMedia[]; index: number }
  | { kind: 'video'; video: YtVideo }

function tidyCaption(c: string) {
  const t = c.replace(/\.\s*use for[\s\S]*$/i, '').trim()
  return t ? t[0].toUpperCase() + t.slice(1) : ''
}

const REDACT_CSS = `[data-kx-redacted]{transition:color .45s ease,background-color .45s ease,box-shadow .45s ease}
html.kx-unredacted [data-kx-redacted]{color:#f8fafc!important;background-color:rgba(248,113,113,.22)!important;box-shadow:inset 0 -1px 0 rgba(248,113,113,.75)}`

/**
 * One of the story's HTML cards (same-origin, sandboxed: no scripts). Cards
 * "redact" words by matching text colour to its background; when any are found,
 * an Unredact button appears. X on a controller toggles it in the card viewer.
 */
function CardFrame({ src, title, frameClassName, lazy, listenForToggle }: { src: string; title: string; frameClassName: string; lazy?: boolean; listenForToggle?: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const media = useRef<HTMLMediaElement[]>([])

  // Release any music hold if the card goes away mid-video
  useEffect(
    () => () => {
      media.current.forEach((m) => holdForMedia(m, false))
      media.current = []
    },
    [src],
  )

  const scan = () => {
    const doc = ref.current?.contentDocument
    const win = doc?.defaultView
    if (!doc || !win) return
    // A video/audio inside the card pauses the site's music while it plays with sound
    media.current.forEach((m) => holdForMedia(m, false))
    media.current = Array.from(doc.querySelectorAll<HTMLMediaElement>('video, audio'))
    for (const m of media.current) {
      const sync = () => holdForMedia(m, !m.paused && !m.ended && !m.muted && m.volume > 0)
      for (const ev of ['play', 'playing', 'pause', 'ended', 'volumechange', 'emptied']) m.addEventListener(ev, sync)
    }
    let n = 0
    doc.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      const cs = win.getComputedStyle(el)
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.color === cs.backgroundColor && el.textContent?.trim()) {
        el.setAttribute('data-kx-redacted', '')
        n++
      }
    })
    if (n && !doc.getElementById('kx-redact-style')) {
      const style = doc.createElement('style')
      style.id = 'kx-redact-style'
      style.textContent = REDACT_CSS
      doc.head.appendChild(style)
    }
    setCount(n)
    setOpen(false)
  }
  const toggle = () => {
    if (!count) return
    sfx(open ? 'back' : 'enter')
    setOpen((o) => !o)
  }

  useEffect(() => {
    ref.current?.contentDocument?.documentElement.classList.toggle('kx-unredacted', open)
  }, [open, count])
  useEffect(() => {
    if (!listenForToggle) return
    const onToggle = () => toggle()
    window.addEventListener('kx-toggle-redaction', onToggle)
    return () => window.removeEventListener('kx-toggle-redaction', onToggle)
  })

  return (
    <div className="relative">
      <iframe
        ref={ref}
        src={src}
        title={title}
        loading={lazy ? 'lazy' : undefined}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        onLoad={scan}
        className={frameClassName}
      />
      {count > 0 && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={open}
          className="absolute top-2 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-black/85"
        >
          <LockIcon open={open} />
          {open ? 'Redact' : 'Unredact'} <span className="text-white/55">({count})</span>
        </button>
      )}
    </div>
  )
}

const LockIcon = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d={open ? 'M8 11V7a4 4 0 017.5-2' : 'M8 11V7a4 4 0 018 0v4'} />
  </svg>
)

function ModalView({ modal, setModal }: { modal: Modal; setModal: (m: Modal | null) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const close = () => {
    sfx('back')
    setModal(null)
  }
  const isGallery = modal.kind === 'gallery'
  const go = (d: number) => {
    if (modal.kind !== 'gallery') return
    sfx('nav')
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

  const title =
    modal.kind === 'cast'
      ? modal.cast.name
      : modal.kind === 'card'
        ? modal.title
        : modal.kind === 'video'
          ? modal.video.title
          : tidyCaption(modal.items[modal.index].caption) || 'Gallery'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md md:p-8" role="dialog" aria-modal="true" aria-label={title} onClick={close}>
      <div className="ps5-glass relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden !bg-[#0b0d12]/90" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
          <p className="truncate text-sm font-bold md:text-base">{title}</p>
          <button ref={closeRef} type="button" onClick={close} className="ps5-round !size-9 text-lg" aria-label="Close">
            ✕
          </button>
        </div>

        {modal.kind === 'video' ? (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-2 md:p-4">
            <div className={modal.video.short ? 'aspect-[9/16] h-[78vh] max-w-full' : 'aspect-video w-full max-h-[78vh]'}>
              <iframe
                src={ytEmbedUrl(modal.video.id)}
                title={modal.video.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full rounded-lg"
              />
            </div>
          </div>
        ) : modal.kind === 'gallery' ? (
          <div className="relative flex min-h-0 flex-1 flex-col items-center gap-3 p-4">
            {(() => {
              const m = modal.items[modal.index]
              return m.type === 'video' ? (
                <video
                  key={m.src}
                  src={m.src}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="max-h-[70vh] w-auto max-w-full rounded-xl"
                  onPlay={(e) => holdForMedia(e.currentTarget, !e.currentTarget.muted)}
                  onVolumeChange={(e) => holdForMedia(e.currentTarget, !e.currentTarget.paused && !e.currentTarget.muted)}
                  onPause={(e) => holdForMedia(e.currentTarget, false)}
                  onEmptied={(e) => holdForMedia(e.currentTarget, false)}
                  ref={(el) => {
                    if (!el) return
                    return () => holdForMedia(el, false) // closing the lightbox releases the music
                  }}
                />
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
            {(modal.kind === 'cast' ? modal.cast.portrait : modal.kind === 'card' ? modal.image : undefined) && (
              <div className="hidden shrink-0 md:block md:w-[34%]">
                <img src={modal.kind === 'cast' ? modal.cast.portrait : modal.kind === 'card' ? modal.image : undefined} alt="" className="h-full max-h-[78vh] w-full object-cover" />
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col">
              {modal.kind === 'cast' && (
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
                  {modal.cast.portrait && <img src={modal.cast.portrait} alt="" className="size-12 rounded-lg object-cover md:hidden" />}
                  <p className="text-sm leading-relaxed text-white/80">{modal.cast.summary}</p>
                </div>
              )}
              {(modal.kind === 'card' ? modal.src : modal.kind === 'cast' ? modal.cast.card : undefined) ? (
                <CardFrame
                  src={(modal.kind === 'card' ? modal.src : modal.kind === 'cast' ? modal.cast.card : undefined)!}
                  title={`${title} card`}
                  listenForToggle
                  frameClassName="h-[68vh] w-full bg-[#0d0f14] md:h-[72vh]"
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

function Hint({ keys, label, className = 'md:inline-flex' }: { keys: string[]; label: string; className?: string }) {
  return (
    <span className={`hidden items-center gap-1.5 ${className}`}>
      {keys.map((k, i) => (
        <span key={k} className="flex items-center gap-1.5">
          {i > 0 && '/'}
          <span className="ps5-key">{k}</span>
        </span>
      ))}{' '}
      {label}
    </span>
  )
}

function BottomBar({
  onPrev,
  onNext,
  onPrimary,
  toggleTab,
  pad,
  tab,
  canEnter,
  inSub,
  section,
}: {
  onPrev: () => void
  onNext: () => void
  onPrimary: () => void
  toggleTab: () => void
  pad: { connected: boolean; kind: PadKind }
  tab: HubTab
  canEnter: boolean
  inSub: boolean
  section: Section
}) {
  const l = PAD_LABEL[pad.kind]
  return (
    <footer className="ps5-bottom flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[13px] text-white/75 md:justify-start md:gap-6">
      <Link to="/" onClick={() => sfx('back')} className="hidden items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 font-semibold text-white hover:bg-white/10 md:inline-flex">
        <ChevronLeft /> Back
      </Link>
      {pad.connected && inSub ? (
        <>
          <Hint keys={['◀', '▶']} label="Select" />
          <Hint keys={[l.a]} label={section === 'ost' ? 'Play' : 'Open'} />
          <Hint keys={[l.b]} label="Back to sections" />
        </>
      ) : pad.connected ? (
        <>
          {canEnter && <Hint keys={[l.x]} label={tab === 'series' ? 'Select storyline' : section === 'intro' ? 'Expand card' : `Enter ${SECTION_LABEL[section]}`} />}
          <Hint keys={['◀', '▶']} label="Navigate" />
          {tab === 'stories' && <Hint keys={['▲', '▼']} label="Section" className="lg:inline-flex" />}
          <Hint keys={[pad.kind === 'playstation' ? 'L' : 'LS']} label="Scroll" className="xl:inline-flex" />
          <Hint keys={[l.a]} label={tab === 'youtube' ? 'Play' : 'Open'} />
          <Hint keys={[l.b]} label="Back" />
          <Hint keys={[l.lb, l.rb]} label="Tabs" />
          <Hint keys={[l.y]} label="Sound" className="lg:inline-flex" />
        </>
      ) : (
        <>
          <Hint keys={['←', '→']} label="Navigate" />
          {tab === 'stories' && <Hint keys={['↑', '↓']} label="Section" className="lg:inline-flex" />}
          <Hint keys={['Enter']} label="Play" />
          <Hint keys={['Q', 'E']} label="Tabs" />
        </>
      )}
      {/* Touch: real buttons */}
      <div className="flex gap-2 md:hidden">
        <button type="button" onClick={onPrev} className="ps5-round !size-11 !rounded-xl" aria-label="Previous">
          ←
        </button>
        <button type="button" onClick={onNext} className="ps5-round !size-11 !rounded-xl" aria-label="Next">
          →
        </button>
      </div>
      <button type="button" onClick={onPrimary} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-semibold text-white md:hidden">
        Enter
      </button>
      <button type="button" onClick={toggleTab} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-semibold text-white md:hidden">
        Switch Tab
      </button>
    </footer>
  )
}

function SoundMenu({ nowPlaying }: { nowPlaying: Track | null }) {
  const muted = useMuted()
  const volume = useMusicVolume()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Sound and graphics settings"
        aria-expanded={open}
        title={muted ? 'Sound: off' : 'Sound: on'}
      >
        {muted ? (
          <svg {...iconProps}>
            <path d="M11 5L6 9H2v6h4l5 4z" />
            <path d="M23 9l-6 6M17 9l6 6" />
          </svg>
        ) : (
          <svg {...iconProps}>
            <path d="M11 5L6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14" />
          </svg>
        )}
      </button>
      {open && (
        <div className="ps5-glass fixed inset-x-4 top-16 z-50 !bg-[#0b0d12]/90 p-4 text-sm md:absolute md:inset-x-auto md:top-11 md:right-0 md:w-72" role="dialog" aria-label="Sound and graphics settings">
          <label className="flex items-center justify-between gap-3">
            <span className="font-semibold">Sound</span>
            <button
              type="button"
              role="switch"
              aria-checked={!muted}
              onClick={() => {
                setMuted(!muted)
                if (muted) window.setTimeout(() => sfx('nav'), 30)
              }}
              className={`relative h-6 w-11 rounded-full transition-colors ${muted ? 'bg-white/20' : 'bg-white'}`}
            >
              <span className={`absolute top-0.5 size-5 rounded-full transition-all ${muted ? 'left-0.5 bg-white/70' : 'left-[22px] bg-black'}`} />
            </button>
          </label>
          <div className={`mt-4 ${muted ? 'opacity-40' : ''}`}>
            <div className="flex items-center justify-between">
              <label htmlFor="kx-music-volume" className="font-semibold">
                Music volume
              </label>
              <span className="text-xs tabular-nums text-white/60">{Math.round(volume * 100)}%</span>
            </div>
            <input
              id="kx-music-volume"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(volume * 100)}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              disabled={muted}
              className="ps5-range mt-2 w-full"
            />
          </div>
          <GraphicsSwitch />
          <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60">
            {nowPlaying ? (
              <>
                <p>
                  Now playing:{' '}
                  <a href={nowPlaying.trackUrl} target="_blank" rel="noreferrer" className="font-semibold text-white hover:underline">
                    {nowPlaying.title}
                  </a>
                </p>
                {nowPlaying.ost && (
                  <p className="mt-1">
                    From{' '}
                    <a href={nowPlaying.ost.url} target="_blank" rel="noreferrer" className="font-semibold text-white hover:underline">
                      {nowPlaying.ost.title}
                    </a>
                  </p>
                )}
              </>
            ) : (
              <p>No background music here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function GraphicsSwitch() {
  const lite = useLite()
  const { mode, autoLite } = usePerfMode()
  const note =
    mode === 'auto' && autoLite
      ? 'Turned on automatically for this PC.'
      : lite
        ? 'Still backgrounds, no blur or motion effects.'
        : 'For older PCs: still backgrounds, no blur or motion effects.'
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <label className="flex items-center justify-between gap-3">
        <span className="font-semibold">Lite graphics</span>
        <button
          type="button"
          role="switch"
          aria-checked={lite}
          onClick={() => {
            sfx('nav')
            setPerfMode(lite ? 'full' : 'lite')
          }}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${lite ? 'bg-white' : 'bg-white/20'}`}
        >
          <span className={`absolute top-0.5 size-5 rounded-full transition-all ${lite ? 'left-[22px] bg-black' : 'left-0.5 bg-white/70'}`} />
        </button>
      </label>
      <p className="mt-1.5 text-xs text-white/55">
        {note}
        {mode !== 'auto' && (
          <>
            {' '}
            <button type="button" className="underline underline-offset-2 hover:text-white" onClick={() => setPerfMode('auto')}>
              Use automatic
            </button>
          </>
        )}
      </p>
    </div>
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
const YtIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <path d="M10 9l5 3-5 3z" fill="currentColor" />
  </svg>
)
const PadIcon = () => (
  <svg {...iconProps}>
    <path d="M6 9h4M8 7v4M15 10h.01M18 8h.01" />
    <path d="M17.3 5H6.7a4 4 0 00-3.95 3.4l-.9 6.1A3 3 0 004.8 18c.9 0 1.7-.5 2.2-1.2L8 15h8l1 1.8c.5.7 1.3 1.2 2.2 1.2a3 3 0 002.95-3.5l-.9-6.1A4 4 0 0017.3 5z" />
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
