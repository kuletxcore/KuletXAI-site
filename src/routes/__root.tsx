import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { PERF_HEAD_SCRIPT } from '#/lib/perf'

const DESCRIPTION =
  'KuletX AI: interactive AI stories on IsekaiZero, series on Trimz and videos on YouTube.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'KuletX AI — AI Storytelling' },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#050806' },
      { property: 'og:title', content: 'KuletX AI — AI Storytelling' },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:image', content: '/covers/1.webp' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preload', href: '/fonts/x14y24pxHeadUpDaisy.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: '/fonts/ObelMono.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    ],
    // Lite graphics on a returning older PC, applied before first paint
    scripts: [{ children: PERF_HEAD_SCRIPT }],
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
        <Scripts />
      </body>
    </html>
  )
}
