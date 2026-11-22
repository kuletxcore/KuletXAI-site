import { createFileRoute } from '@tanstack/react-router'
import { isAllowedOstUrl, safeByteRange } from '#/lib/ost-rules'

/**
 * Same-origin pass-through for OST audio: the IsekaiZero and KageSekai CDNs send no CORS headers, so Web Audio can't use their files directly.
 * Only their music files are allowed; this is not an open proxy.
 */
const PASS_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']

export const Route = createFileRoute('/api/ost')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get('u') ?? ''
        if (!isAllowedOstUrl(target)) return new Response('Not allowed', { status: 400 })

        const safeRange = safeByteRange(request.headers.get('range'))
        // Time out waiting for the CDN's headers so a hung upstream can't tie up the Worker. The timer is cleared
        // once headers arrive, so the audio body can keep streaming past 10s.
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 10_000)
        let upstream: Response
        try {
          upstream = await fetch(target, { headers: safeRange ? { range: safeRange } : {}, signal: controller.signal })
        } catch {
          return new Response('Upstream error', { status: 502 })
        } finally {
          clearTimeout(timer)
        }
        if (!upstream.ok && upstream.status !== 206) return new Response('Upstream error', { status: 502 })
        if (!upstream.body) return new Response('Upstream error', { status: 502 })

        const headers = new Headers()
        for (const h of PASS_HEADERS) {
          const v = upstream.headers.get(h)
          if (v) headers.set(h, v)
        }
        headers.set('cache-control', 'public, max-age=86400')
        headers.set('x-content-type-options', 'nosniff')
        return new Response(upstream.body, { status: upstream.status, headers })
      },
    },
  },
})
