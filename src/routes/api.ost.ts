import { createFileRoute } from '@tanstack/react-router'

/**
 * Same-origin pass-through for OST audio: IsekaiZero's CDN sends no CORS headers, so Web Audio can't use its files directly.
 * Only IsekaiZero music files are allowed; this is not an open proxy.
 */
const ALLOWED = /^https:\/\/s3\.(alterworld|isk0)\.ai\/uploads\/(music|audios)\/[A-Za-z0-9_.-]+\.mp3$/

const PASS_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']

export const Route = createFileRoute('/api/ost')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get('u') ?? ''
        if (!ALLOWED.test(target)) return new Response('Not allowed', { status: 400 })

        const range = request.headers.get('range')
        const upstream = await fetch(target, { headers: range ? { range } : {} })
        if (!upstream.ok && upstream.status !== 206) return new Response('Upstream error', { status: 502 })

        const headers = new Headers()
        for (const h of PASS_HEADERS) {
          const v = upstream.headers.get(h)
          if (v) headers.set(h, v)
        }
        headers.set('cache-control', 'public, max-age=86400')
        return new Response(upstream.body, { status: upstream.status, headers })
      },
    },
  },
})
