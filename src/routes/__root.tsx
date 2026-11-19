import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { siteOrigin } from '#/lib/origin'
import { PERF_HEAD_SCRIPT } from '#/lib/perf'
import { DARK_HEAD_SCRIPT } from '#/lib/dark'
import { STILL_HEAD_SCRIPT } from '#/lib/still'
import { StoryFinder } from '#/components/story-finder'

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
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <StoryFinder />
        <Scripts />
      </body>
    </html>
  )
}
