import { ISEKAI_REF } from '#/data/content'

/** Background music per hub item. Files are re-encoded copies of public IsekaiZero tracks, hosted in /public/music. */
export type Track = {
  title: string
  src: string
  /** Track page on IsekaiZero */
  trackUrl: string
  /** Soundtrack (playlist) it belongs to */
  ost?: { title: string; url: string }
}

const track = (id: string) => `https://www.isekaizero.ai/music/track/${id}${ISEKAI_REF}`
const playlist = (id: string) => `https://www.isekaizero.ai/music/playlist/${id}${ISEKAI_REF}`

const OST = {
  acolytes: { title: 'Service Intensity — Acolytes OST', url: playlist('6aabeb8f95bcb6ce01b95f15') },
  colossus: { title: 'Colossus Protocol: The Original Soundtrack', url: playlist('6ac29251d57e12638cd45b18') },
  table: { title: 'I AM THE TABLE — OST', url: playlist('6aa21d2ceb8350fd122c2706') },
  queenBee: { title: 'Acknowledge Me — OST', url: playlist('6a9f0a6252e021ab1dc94311') },
  godsmarked: { title: 'Godsmarked — Unaired Anime Soundtrack', url: playlist('6af3348e2ba120b7482cfc44') },
}

// Keyed by story slug. The Problem Spawner has no soundtrack.
export const STORY_MUSIC: Record<string, Track> = {
  acolytes: { title: 'The Kettle is Warm', src: '/music/acolytes.mp3', trackUrl: track('6aabf64795bcb6ce01d3b08b'), ost: OST.acolytes },
  'colossus-protocol': { title: 'The Water Breaks', src: '/music/colossus-protocol.mp3', trackUrl: track('6ac20b6e84529233e1497717'), ost: OST.colossus },
  'queen-bee': { title: 'Head of The Table', src: '/music/queen-bee.mp3', trackUrl: track('6a9e1d1372ebb84c7ab632cd'), ost: OST.queenBee },
  'i-am-the-table': { title: 'I AM THE TABLE!!!!', src: '/music/i-am-the-table.mp3', trackUrl: track('6aa21c468b7d8de8b5d193f2'), ost: OST.table },
  godsmarked: { title: 'Cinder Row', src: '/music/godsmarked.mp3', trackUrl: track('6af2d71588e9d39f9a533a16'), ost: OST.godsmarked },
}

// Keyed by Trimz series slug
export const SERIES_MUSIC: Record<string, Track> = {
  'acolytes-maid-for-your-protection': { title: 'Protection', src: '/music/trimz-protection.mp3', trackUrl: track('6aaa762f101f7cbf90b0964f'), ost: OST.acolytes },
  'acolytes-maid-for-your-protection-side-b': { title: 'Terminus Surge', src: '/music/trimz-terminus-surge.mp3', trackUrl: track('6aeaf701f82f999841e5eb92'), ost: OST.acolytes },
}
