import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

/** This site's own address (the test site has another host): link-preview tags only work with absolute URLs. */
export const siteOrigin = createIsomorphicFn()
  .server(() => new URL(getRequest().url).origin.replace(/^http:/, 'https:'))
  .client(() => window.location.origin)
