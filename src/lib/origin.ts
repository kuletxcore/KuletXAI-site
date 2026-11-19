import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

/** A request URL's origin as the public sees it: Cloudflare terminates TLS, so http becomes https except on localhost. */
export function publicOriginOf(url: URL) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(url.host) ? url.origin : url.origin.replace(/^http:/, 'https:')
}

/** This site's own address (the test site has another host): link-preview tags only work with absolute URLs. */
export const siteOrigin = createIsomorphicFn()
  .server(() => publicOriginOf(new URL(getRequest().url)))
  .client(() => window.location.origin)
