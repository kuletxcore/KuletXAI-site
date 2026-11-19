import { STORIES } from '#/data/content'
import { llmsFullTxt, llmsJson, llmsTxt, storyMarkdown } from '#/lib/machine'

// Serves /llms.txt, /llms-full.txt, /llms.json and /stories/<slug>.md from the Worker entry, before the router.
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
