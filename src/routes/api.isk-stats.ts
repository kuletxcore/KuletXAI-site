import { createFileRoute } from '@tanstack/react-router'
import { getIskStats } from '#/lib/isk-stats.server'

/** Live IsekaiZero counts for the hub (see src/lib/isk-stats.server.ts). */
export const Route = createFileRoute('/api/isk-stats')({
  server: {
    handlers: {
      GET: async () => {
        const got = await getIskStats()
        if (!got) {
          return new Response('{"error":"IsekaiZero unavailable"}', {
            status: 503,
            headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
          })
        }
        return new Response(JSON.stringify(got.stats), {
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=300',
            'x-kx-stats': got.source,
          },
        })
      },
    },
  },
})
