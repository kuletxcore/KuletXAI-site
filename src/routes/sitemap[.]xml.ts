import { createFileRoute } from '@tanstack/react-router'
import { STORIES } from '#/data/content'
import { TROPHIES } from '#/data/trophies'
import { siteOrigin } from '#/lib/origin'

/** /sitemap.xml, built from the same data the pages render so it can't drift. */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const origin = siteOrigin()
        const urls = [
          `${origin}/`,
          ...STORIES.map((s) => `${origin}/stories/${s.slug}`),
          ...Object.keys(TROPHIES).map((slug) => `${origin}/stories/${slug}/trophies`),
        ]
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`
        return new Response(body, {
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
