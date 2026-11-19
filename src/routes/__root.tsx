import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { siteOrigin } from '#/lib/origin'
import { PERF_HEAD_SCRIPT } from '#/lib/perf'
import { DARK_HEAD_SCRIPT } from '#/lib/dark'
import { STILL_HEAD_SCRIPT } from '#/lib/still'

const DESCRIPTION =
  'KuletX AI: interactive AI stories on IsekaiZero and KageSekai, series on Trimz and videos on YouTube.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'KuletX AI | AI Storytelling' },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#050806' },
      { property: 'og:title', content: 'KuletX AI | AI Storytelling' },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:image', content: `${siteOrigin()}/covers/1.webp` },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'KuletX AI' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'preload', href: '/fonts/x14y24pxHeadUpDaisy.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: '/fonts/ObelMono.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    ],
    // Lite graphics, dark surfaces and paused motion, applied before first paint
    scripts: [{ children: PERF_HEAD_SCRIPT }, { children: DARK_HEAD_SCRIPT }, { children: STILL_HEAD_SCRIPT }],
  }),
  shellComponent: RootDocument,
  errorComponent: RootError,
  notFoundComponent: RootNotFound,
})

function RootError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-gamer text-sm uppercase text-mute">Something glitched</p>
        <p className="mt-3 text-ink">That screen didn’t load. Try again, or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="border border-line px-5 py-3 font-gamer text-sm uppercase text-ink hover:border-neon hover:text-neon">
            Retry
          </button>
          <a href="/" className="bg-neon px-5 py-3 font-gamer text-sm uppercase text-void hover:bg-ink">
            Home
          </a>
        </div>
        <p className="mt-4 text-xs text-mute/70">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    </div>
  )
}

function RootNotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-gamer text-sm uppercase text-mute">404 // not found</p>
        <p className="mt-3 text-ink">That page hasn’t spawned yet.</p>
        <a href="/" className="mt-6 inline-block bg-neon px-5 py-3 font-gamer text-sm uppercase text-void hover:bg-ink">
          Back to KuletX AI
        </a>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
