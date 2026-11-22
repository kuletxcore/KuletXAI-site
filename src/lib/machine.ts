import { LINKS, STORIES, TRIMZ, storyUrl, trimzSeriesUrl } from '#/data/content'
import type { Story, TrimzSeries } from '#/data/content'
import { ISK } from '#/data/isk'
import { OSTS } from '#/data/ost'
import { STORY_MUSIC, SERIES_MUSIC } from '#/data/music'
import { TROPHIES } from '#/data/trophies'

// The site as text (llms.txt, .md mirrors, JSON-LD), built from the same data the pages render.

export type Origin = string

export const SITE = {
  name: 'KuletXAI',
  tagline: 'Interactive AI stories you play, cut into series you binge.',
  summary:
    'KuletX builds interactive worlds on IsekaiZero and KageSekai, cuts them into series on Trimz, and breaks the process down on YouTube.',
  author: 'KuletX (kuletxcore)',
  isekaiZero: 'https://www.isekaizero.ai',
  kageSekai: 'https://www.kagesekai.ai',
  trimz: 'https://trimz.tv/u/kuletxcore',
  youtube: 'https://youtube.com/@kuletxai',
} as const

/** Where a story is played. 18+ worlds live on KageSekai, IsekaiZero's adult sister site. */
export const venueOf = (s: Story) => (s.rating === '18+' ? 'KageSekai' : 'IsekaiZero')

const url = (origin: Origin, path: string) => `${origin}${path}`

/** One line per story, for indexes and for the model-facing summary. */
const storyLine = (s: Story) =>
  `${s.rating} ${s.tags.join(', ')}. ${s.logline} Played on ${venueOf(s)}.`

const seriesLine = (t: TrimzSeries) => `${t.episodes} episodes. ${t.summary}`


/** A story as Markdown: the page's own copy, in the order the page shows it. */
export function storyMarkdown(s: Story, origin: Origin): string {
  const isk = ISK[s.slug]
  const music = STORY_MUSIC[s.slug]
  const ost = OSTS[s.slug]
  const set = TROPHIES[s.slug]
  const series = TRIMZ.filter((t) => s.trimz?.includes(t.slug))
  const lines: string[] = []

  lines.push(`# ${s.title}`, '')
  lines.push(`> ${s.logline}`, '')
  lines.push(
    `- **Platform:** ${venueOf(s)} (${s.rating})`,
    `- **Tags:** ${s.tags.join(', ')}`,
    `- **Where it opens:** ${s.kicker}`,
    `- **Play it:** ${url(origin, `/stories/${s.slug}`)}`,
  )
  if (music) lines.push(`- **Theme:** ${music.title}`)
  if (ost) lines.push(`- **Soundtrack:** ${ost.title} (${ost.tracks.length} tracks)`)
  lines.push('')

  lines.push('## Pitch', '', ...s.pitch, '')

  lines.push('## World', '')
  for (const w of s.world) lines.push(`- **${w.label}.** ${w.text}`)
  lines.push('')

  if (isk?.cast.length) {
    lines.push(`## ${s.castTitle ?? 'Cast'}`, '')
    for (const c of isk.cast) {
      const who = c.role === 'persona' ? ' (you play)' : ''
      const by = c.creator ? ` Character by ${c.creator.name}.` : ''
      lines.push(`- **${c.name}**${who}. ${c.summary}${by}`)
    }
    lines.push('')
  } else if (s.cast.length) {
    lines.push(`## ${s.castTitle ?? 'Cast'}`, '')
    for (const c of s.cast) lines.push(`- **${c.name}.** ${c.role}`)
    lines.push('')
  }

  if (series.length) {
    lines.push('## Series on Trimz', '')
    for (const t of series) lines.push(`- [${t.title}](${trimzSeriesUrl(t.slug)}): ${seriesLine(t)}`)
    lines.push('')
  }

  if (set) {
    lines.push(`## Trophies (${set.trophies.length})`, '')
    for (const t of set.trophies) {
      lines.push(`- **${t.title}** (${t.grade}${t.hidden ? ', hidden' : ''}). ${t.description}`)
    }
    lines.push('')
  }

  lines.push(`---`, '')
  lines.push(`Hook: ${s.hook}`, '')
  lines.push(`Read on the site: ${url(origin, `/stories/${s.slug}`)}`)
  lines.push(`Trophy list: ${url(origin, `/stories/${s.slug}/trophies`)}`)
  lines.push('')
  return lines.join('\n')
}

/** The llms.txt index: short, link-heavy, enough to decide what to read next. */
export function llmsTxt(origin: Origin): string {
  const out: string[] = []
  out.push(`# ${SITE.name}`, '')
  out.push(`> ${SITE.summary}`, '')
  out.push(
    `${SITE.tagline} ${STORIES.length} storylines and ${TRIMZ.length} series, by ${SITE.author}. Every storyline is played on ${'IsekaiZero'} (SFW and 17+) or KageSekai (18+); every number on the site is live from those platforms.`,
    '',
  )

  out.push('## Start here', '')
  out.push(`- [Home](${url(origin, '/')}): the front page, a playable first beat, the world grid and the series.`)
  out.push(`- [Everything in one file](${url(origin, '/llms-full.txt')}): all seven worlds with pitch, world rules, cast, soundtracks and trophies.`)
  out.push(`- [JSON index](${url(origin, '/llms.json')}): the same links as structured data.`)
  out.push(`- [Live counts](${url(origin, '/api/isk-stats')}): likes, saves, chats, messages and Trimz views, refreshed hourly.`)
  out.push('')

  out.push('## Storylines', '')
  for (const s of STORIES) {
    out.push(`- [${s.title}](${url(origin, `/stories/${s.slug}`)}) ([md](${url(origin, `/stories/${s.slug}.md`)})): ${storyLine(s)}`)
  }
  out.push('')

  out.push('## Series', '')
  for (const t of TRIMZ) out.push(`- [${t.title}](${SITE.trimz}): ${seriesLine(t)}`)
  out.push('')

  out.push('## Elsewhere', '')
  out.push(`- [IsekaiZero creator page](${LINKS.isekaiProfile}): where the worlds are played and remixed.`)
  out.push(`- [KageSekai creator page](${SITE.kageSekai}/creator/kuletxcore): the 18+ worlds. Same account, same storyline ids.`)
  out.push(`- [Trimz](${SITE.trimz}): the series cut from the stories.`)
  out.push(`- [YouTube](${SITE.youtube}): trailers and the making-of.`)
  out.push('')

  out.push(
    '## Reading this site',
    '',
    '- Every story page is also available as Markdown: append `.md` to its URL, as in `/stories/acolytes.md`.',
    '- Ratings: SFW and 17+ are on IsekaiZero; 18+ is on KageSekai, its adult sister site. Storyline ids match on both.',
    '- Numbers are live or not shown. The baked-in figures in the HTML are the last known values; `/api/isk-stats` is the current source.',
    '- The canonical site is `kuletxai.whop.site`; it is mirrored at `kuletxai.kuletxcore.workers.dev`.',
    '- Cast members made by other creators are credited with a "Character by" line, and their profiles are linked from the hub.',
    '- The site is MIT licensed; the pixel and mono typefaces are under the SIL Open Font License.',
    '',
  )
  return out.join('\n')
}

/** Everything, in one file: the whole site's writing, for a model that wants it in a single fetch. */
export function llmsFullTxt(origin: Origin): string {
  const out: string[] = []
  out.push(`# ${SITE.name}: full text`, '')
  out.push(`> ${SITE.summary}`, '')
  out.push(`Generated from the same data the pages render. Canonical index: ${url(origin, '/llms.txt')}`, '')
  out.push('## Contents', '')
  for (const s of STORIES) out.push(`- [${s.title}](#${s.slug})`)
  for (const t of TRIMZ) out.push(`- [${t.title}](#series-${t.key})`)
  out.push('')

  for (const s of STORIES) {
    out.push(`<a id="${s.slug}"></a>`, '', storyMarkdown(s, origin), '')
  }

  out.push('## Series on Trimz', '')
  for (const t of TRIMZ) {
    out.push(`<a id="series-${t.key}"></a>`, '', `### ${t.title}`, '')
    out.push(
      `- **Episodes:** ${t.episodes}`,
      `- **Where:** ${SITE.trimz}`,
      `- **Series page:** ${trimzSeriesUrl(t.slug)}`,
    )
    const music = SERIES_MUSIC[t.slug]
    if (music) out.push(`- **Theme:** ${music.title}`)
    out.push('', t.summary, '')
  }

  out.push('## Site', '')
  out.push(
    `- Home: ${url(origin, '/')}`,
    `- Live counts: ${url(origin, '/api/isk-stats')}`,
    `- Machine index: ${url(origin, '/llms.json')}`,
    `- IsekaiZero: ${SITE.isekaiZero}`,
    `- KageSekai: ${SITE.kageSekai}`,
    `- Trimz: ${SITE.trimz}`,
    `- YouTube: ${SITE.youtube}`,
    '',
  )
  return out.join('\n')
}

/** Page list as data, for tools that would rather parse than scrape. */
export function llmsJson(origin: Origin) {
  return {
    name: SITE.name,
    url: origin,
    description: SITE.tagline,
    generated: 'from src/data (content.ts, isk.ts, ost.ts, music.ts, trophies.ts)',
    stories: STORIES.map((s) => ({
      title: s.title,
      slug: s.slug,
      url: url(origin, `/stories/${s.slug}`),
      markdown: url(origin, `/stories/${s.slug}.md`),
      trophies: url(origin, `/stories/${s.slug}/trophies`),
      rating: s.rating,
      platform: venueOf(s),
      tags: s.tags,
      logline: s.logline,
      play: storyUrl(s),
    })),
    series: TRIMZ.map((t) => ({
      title: t.title,
      url: `${trimzSeriesUrl(t.slug)}`,
      episodes: t.episodes,
      summary: t.summary,
    })),
    elsewhere: { isekaiZero: SITE.isekaiZero, kageSekai: SITE.kageSekai, trimz: SITE.trimz, youtube: SITE.youtube },
  }
}



export function siteJsonLd(origin: Origin) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#org`,
        name: SITE.name,
        alternateName: 'KuletX',
        url: origin,
        logo: `${origin}/brand/kuletx-ai-1200.webp`,
        sameAs: [SITE.isekaiZero, SITE.kageSekai, SITE.trimz, SITE.youtube],
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#site`,
        name: SITE.name,
        url: origin,
        description: SITE.summary,
        publisher: { '@id': `${origin}/#org` },
        inLanguage: 'en',
      },
    ],
  }
}

/** A storyline as a CreativeWork, plus the questions people actually ask, answered from the data. */
export function storyJsonLd(s: Story, origin: Origin) {
  const page = url(origin, `/stories/${s.slug}`)
  const series = TRIMZ.filter((t) => s.trimz?.includes(t.slug))
  const faq = [
    {
      q: `Where can I play ${s.title}?`,
      a: `${s.title} is played on ${venueOf(s)}. It is free to start, runs in the browser, and needs no install.`,
    },
    {
      q: `How long is ${s.title}?`,
      a: `It is an ongoing interactive storyline rather than a fixed-length story. You talk to the storyteller and it keeps going, and the plot persists between sessions.`,
    },
    { q: `What is ${s.title} about?`, a: `${s.logline} ${s.pitch[0]}` },
    {
      q: `Is ${s.title} suitable for work?`,
      a:
        s.rating === 'SFW'
          ? `Yes. ${s.title} is rated SFW.`
          : s.rating === '17+'
            ? `No. ${s.title} is rated 17+ and sits behind an age check on IsekaiZero.`
            : `No. ${s.title} is rated 18+ and lives on KageSekai, the adult sister site of IsekaiZero.`,
    },
  ]
  if (series.length) {
    faq.push({
      q: `Is there a series of ${s.title}?`,
      a: `Yes. ${series.map((t) => t.title).join(' and ')} ${series.length > 1 ? 'are' : 'is'} on Trimz, cut from the same storyline.`,
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${page}#work`,
        name: s.title,
        headline: s.title,
        description: s.logline,
        abstract: s.pitch.join(' '),
        url: page,
        image: url(origin, s.cover),
        genre: s.tags,
        contentRating: s.rating,
        inLanguage: 'en',
        isFamilyFriendly: s.rating === 'SFW',
        creator: { '@id': `${origin}/#org` },
        author: { '@type': 'Organization', name: SITE.author },
        publisher: { '@id': `${origin}/#org` },
        keywords: [...s.tags, s.rating, venueOf(s), 'interactive fiction', 'AI storytelling'],
        interactionStatistic: [
          { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: s.likes },
          { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: s.messages },
        ],
        ...(series.length
          ? {
              isPartOf: series.map((t) => ({
                '@type': 'CreativeWorkSeries',
                name: t.title,
                url: `${trimzSeriesUrl(t.slug)}`,
                numberOfEpisodes: t.episodes,
              })),
            }
          : {}),
      },
      {
        '@type': 'FAQPage',
        '@id': `${page}#faq`,
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'KuletXAI', item: url(origin, '/') },
          { '@type': 'ListItem', position: 2, name: s.title, item: page },
        ],
      },
    ],
  }
}

/** Escaped for a <script type="application/ld+json"> block. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')


/**
 * A story page's cold open, built from the story itself: its own scene header, its own first pitch line, the
 * player's persona as the way in, and its own world rules as the answer. Two moves, then the author's own hook
 * as the closing line, which is exactly how a trailer would cut it.
 *
 * Derived rather than hand-written per story, so a new storyline gets a playable beat the moment it lands in
 * content.ts, and no copy here can drift away from the page it sits on. The exit is the story's own platform.
 */
export type BeatChoice = { label: string; reply: string }

/** "Acolytes: Maid for your Protection" → "Acolytes" for a button; "I AM THE TABLE!!!" → "I AM THE TABLE" */
export const shortTitle = (t: string) => t.split(':')[0].split('!')[0].trim()

export function firstBeat(s: Story) {
  const cast = ISK[s.slug]?.cast ?? []
  const you = cast.find((c) => c.role === 'persona') ?? null
  const first = s.world[0]
  const second = s.world[1] ?? s.world[0]
  const rule = (w: { label: string; text: string }) => (w.label.length > 28 ? w.text : `${w.label}. ${w.text}`)

  return {
    slug: s.slug,
    /** The scene heading: the story's own file header, e.g. "Acolyte Consultancy · Agent 00 file" */
    scene: s.kicker,
    /** The world speaks once, in its own words */
    line: s.pitch[0],
    you: you?.name ?? null,
    choices: [
      { label: you ? `Step in as ${you.name}` : 'Step inside', reply: rule(first) },
      { label: 'Look around first', reply: rule(second) },
    ] as [BeatChoice, BeatChoice],
    /** The author's hook, shown after the world answers */
    hook: s.hook,
    cast: cast.slice(0, 4).map((c) => ({ name: c.name, portrait: c.portrait, role: c.role })),
  }
}
