import { STORIES } from '#/data/content'
import { llmsFullTxt, llmsJson, llmsTxt, robotsTxt, sitemapXml, storyMarkdown } from '#/lib/machine'

/**
 * The machine-facing layer, served from the Worker entry (src/server.ts) rather than the router: these are files
 * with dots and extensions in their names, and they should answer at exactly the documented URL on every host,
 * in dev and in production, without a page render.
 *
 *   /llms.txt, /llms-full.txt, /llms.json   the reading layer for any model or crawler
 *   /robots.txt, /sitemap.xml               the ordinary crawler files, which also point at the above
 *   /stories/<slug>.md                      one story page as Markdown, same data as the page
 */
export function machineResponse(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null
  const url = new URL(request.url)
  const path = url.pathname
  const host = url.host
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)
  const origin = local ? url.origin : url.origin.replace(/^http:/, 'https:')

  const text = (body: string, type: string) =>
    new Response(body, {
      headers: {
        'content-type': `${type}; charset=utf-8`,
        'cache-control': 'public, max-age=3600',
        'x-kx-machine': '1',
      },
    })

  switch (path) {
    case '/llms.txt':
      return text(llmsTxt(origin), 'text/plain')
    case '/llms-full.txt':
      return text(llmsFullTxt(origin), 'text/plain')
    case '/llms.json':
      return new Response(JSON.stringify(llmsJson(origin), null, 2), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, max-age=3600',
          'x-kx-machine': '1',
        },
      })
    case '/robots.txt':
      return text(robotsTxt(origin), 'text/plain')
    case '/sitemap.xml':
      return text(sitemapXml(origin), 'application/xml')
    default:
      break
  }

  const md = /^\/stories\/([a-z0-9-]+)\.md$/.exec(path)
  if (md) {
    const story = STORIES.find((s) => s.slug === md[1])
    if (!story) return new Response('Not found\n', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
    return new Response(storyMarkdown(story, origin), {
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'cache-control': 'public, max-age=3600',
        link: `<${origin}/stories/${story.slug}>; rel="canonical"; type="text/html"`,
        'x-kx-machine': '1',
      },
    })
  }

  return null
}
