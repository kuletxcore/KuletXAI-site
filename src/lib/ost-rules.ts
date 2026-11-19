/**
 * Rules for the OST pass-through (src/routes/api.ost.ts), kept apart from the route so they can be tested.
 * The IsekaiZero and KageSekai CDNs send no CORS headers, so Web Audio can't use their files directly; the route
 * only relays their music files, and only well-formed byte ranges get forwarded.
 */
const ALLOWED = /^https:\/\/(s3\.(alterworld|isk0)\.ai|media\.kagesekai\.ai)\/uploads\/(music|audios)\/[A-Za-z0-9_.-]+\.mp3$/
const RANGE = /^bytes=\d*-\d*(,\d*-\d*)*$/

/** True only for mp3s on the two platform music CDNs. */
export const isAllowedOstUrl = (target: string) => ALLOWED.test(target)

/** The request's Range header when it is a plain byte range, otherwise null (ask for the whole file). */
export function safeByteRange(range: string | null) {
  return range && RANGE.test(range) ? range : null
}
