import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

/** This site's own address (the test site has another host): link-preview tags only work with absolute URLs. */
export const siteOrigin = createIsomorphicFn()
  .server(() => {
    const url = new URL(getRequest().url)
    return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(url.host) ? url.origin : url.origin.replace(/^http:/, 'https:')
  })
  .client(() => window.location.origin)

/**
 * The address to build machine-facing links with. Local development keeps plain http; anything else is promoted
 * to https, because Cloudflare terminates TLS in front of the worker and getRequest() sees http there.
 */
export const publicOrigin = createIsomorphicFn()
  .server(() => {
    const url = new URL(getRequest().url)
    const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(url.host)
    return local ? url.origin : url.origin.replace(/^http:/, 'https:')
  })
  .client(() => window.location.origin)
