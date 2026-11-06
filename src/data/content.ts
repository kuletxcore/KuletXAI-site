export const ISEKAI_REF = '?referralCode=95OBGFQX'

export const LINKS = {
  isekai: `https://www.isekaizero.ai/${ISEKAI_REF}`,
  trimz: 'https://trimz.tv/u/kuletxcore',
  youtube: 'https://youtube.com/@kuletxai',
}

export const isekaiStoryUrl = (id: string) => `https://www.isekaizero.ai/storylines/${id}${ISEKAI_REF}`
export const trimzSeriesUrl = (slug: string) => `https://trimz.tv/${slug}`

export type TrimzSeries = {
  slug: string
  title: string
  summary: string
  poster: string
  episodes: number
  views: number
}

// Public series on trimz.tv/u/kuletxcore (Nov 2026)
export const TRIMZ: TrimzSeries[] = [
  {
    slug: 'acolytes-maid-for-your-protection',
    title: 'Acolytes: Maid for your Protection',
    summary:
      'Maid café waitresses by day, unkillable black-ops agents by night, and nobody on the block knows.',
    poster: '/trimz/acolytes.webp',
    episodes: 4,
    views: 157,
  },
  {
    slug: 'acolytes-maid-for-your-protection-side-b',
    title: 'Acolytes: Maid for your Protection (Side B)',
    summary: 'Beneath a maid café, a new squad leader runs secret tactical missions.',
    poster: '/trimz/acolytes-side-b.webp',
    episodes: 1,
    views: 90,
  },
]

export type Story = {
  slug: string
  id: string
  title: string
  logline: string
  cover: string
  rating: 'SFW' | '17+'
  tags: string[]
  likes: number
  chats: number
  /** Accent color for this story's mini-site */
  accent: string
  kicker: string
  pitch: string[]
  world: { label: string; text: string }[]
  cast: { name: string; role: string }[]
  castTitle?: string
  hook: string
  trimz?: string[]
}

// Public storylines from the kuletxcore account on IsekaiZero (Nov 2026)
export const STORIES: Story[] = [
  {
    slug: 'acolytes',
    id: '6aa78f6bd17fe984ab332064',
    title: 'Acolytes: Maid for your Protection',
    logline:
      'By day, you serve tea and cake. By night, you lead an elite black-ops unit no government will admit exists.',
    cover: '/covers/1.webp',
    rating: '17+',
    tags: ['Spy', 'Thriller', 'Undercover'],
    likes: 156,
    chats: 129,
    accent: '#ff3b5c',
    kicker: 'Acolyte Consultancy · Agent 00 file',
    pitch: [
      'Acolytes Maid Café: handcrafted drinks, homemade sweets, and a staff that pays attention to the things you ask for, and a few you don’t have to.',
      'Regulars swear the block is quieter than the rest of the city. They’re right. After hours, the café is a licensed private security outfit, and you are Agent 00: the only double-zero designation the Agency has ever issued.',
    ],
    world: [
      { label: 'Front', text: 'A cozy maid café. Matcha Cloud, ¥520. Open 07:00 to 21:00.' },
      { label: 'After hours', text: 'By appointment only. Disruptions are resolved before they reach your table.' },
      { label: 'Standard', text: 'No problem, once committed to, is left unfinished.' },
    ],
    cast: [
      { name: 'Hana Morishita', role: 'Agent 01. The squad’s luckiest operator and quiet tactician.' },
      { name: 'Sasha Quinn', role: 'Agent 02. Long-range specialist. Calls you “Boss” and means it.' },
      { name: 'Mira Solis', role: 'Agent 03. Breacher and combat medic. Makes sure everyone gets home.' },
      { name: 'Yui Takamoto', role: 'Agent 04. The wildcard: three prototypes and an exo-suit.' },
    ],
    hook: 'We don’t just serve customers. We keep the peace.',
    trimz: ['acolytes-maid-for-your-protection', 'acolytes-maid-for-your-protection-side-b'],
  },
  {
    slug: 'colossus-protocol',
    id: '6aa4a2ce523ccdd47ab9b80d',
    title: 'Colossus Protocol',
    logline:
      'You can grow from human height to 300 meters. When kaiju rise from the coastal rifts, you are the only one who can meet them at their own scale.',
    cover: '/covers/3.webp',
    rating: '17+',
    tags: ['Kaiju', 'Giantess', 'Apocalypse'],
    likes: 32,
    chats: 38,
    accent: '#38bdf8',
    kicker: 'Rift Response Division · Eyes only',
    pitch: [
      '214 people were caught in the discharge pulse. 213 of them died. The last one was a Coast Guard rescue swimmer holding a drowning woman at the surface.',
      'Forty-one nights in a sealed ward later, the city had learned the word “kaiju”, and you had a new callsign: Colossus Actual.',
    ],
    world: [
      { label: 'The Shift', text: '1.7 m to 300 m in about sixty seconds. Every size in between fights differently.' },
      { label: 'The cost', text: 'Ten minutes at full size before resonance burn. Afterward, hours of being fragile.' },
      { label: 'Doctrine', text: 'Tier Three needs a flag officer, and a form with one blank line: ACCEPTABLE LOSSES.' },
    ],
    cast: [
      { name: 'Reyes', role: 'Your ground-station handler. The one voice you trust above 20 meters.' },
    ],
    hook: 'They are going somewhere. You are the only thing in the way.',
  },
  {
    slug: 'queen-bee',
    id: '6a9ae1c5a66365ba9f1523f1',
    title: 'Acknowledge Me: Become the Queen Bee',
    logline:
      'You arrived as a nobody. Climb the social hierarchy until the entire school has to acknowledge you.',
    cover: '/covers/5.webp',
    rating: 'SFW',
    tags: ['High School', 'Rivals', 'Slow Burn'],
    likes: 14,
    chats: 20,
    accent: '#f5b301',
    kicker: 'Kingsmere Academy · The vacant seat',
    pitch: [
      'Kingsmere doesn’t run on grades. It runs on bloodlines, and on the currency every bloodline defends: status.',
      'The Queen Bee’s seat has been empty since June. Two girls declared themselves heir. Kingsmere ate them both. You walk in this morning: unranked, unprotected, unknown.',
    ],
    world: [
      { label: 'The Vanguard', text: 'Old money and legacy. The crown isn’t won, it’s inherited.' },
      { label: 'The Wreckage', text: 'Chaos and fear. They want to flip the table the seat sits on.' },
      { label: 'The Circuit', text: 'Rumors and receipts. They decide who gets to keep the seat.' },
      { label: 'The Line', text: 'Athletes and territory. They already hold the halls.' },
      { label: 'The Aux', text: 'Outsiders. Too many to ignore, too divided to crown. So far.' },
    ],
    castTitle: 'The ladder',
    cast: [
      { name: 'Unranked', role: 'Nobody. Where you start.' },
      { name: 'Affiliate → Made', role: 'Useful to a faction, then a seat at its table.' },
      { name: 'Lieutenant → Head', role: 'The right hand, then one of five.' },
      { name: 'Queen Bee', role: 'Undisputed. One at a time. Nowhere left to climb.' },
    ],
    hook: 'First they laugh at the new girl. Then the halls go quiet when she passes.',
  },
  {
    slug: 'problem-spawner',
    id: '6a9504a149fd840d6d383b33',
    title: 'The Problem Spawner',
    logline:
      "Cursed with a power you can't control, you spawn random fragments of other worlds into reality. Survive the chaos.",
    cover: '/covers/4.webp',
    rating: 'SFW',
    tags: ['Academy', 'Superpower', 'Comedy'],
    likes: 11,
    chats: 10,
    accent: '#a78bfa',
    kicker: 'Meridian · Rolling…',
    pitch: [
      'No mark. No wound. Just a voice behind your thoughts that whispers “Rolling.” Then the air folds, and something that has no business existing is standing there.',
      'A weapon. A stranger. A creature out of a story. A whole building, once. Every roll is permanent, and Meridian is starting to notice.',
    ],
    world: [
      { label: 'Meridian', text: 'A city carved into academy territories, each run by its own student council.' },
      { label: 'Every roll is forever', text: 'Weak, strong or catastrophic: whatever spawns in, stays.' },
      { label: 'No undo', text: 'Decide what to do with it before Meridian decides for you.' },
    ],
    cast: [
      { name: 'Seraphine Halloway', role: 'The federation’s youngest council president. Sure the chaos is hers to manage.' },
      { name: 'Sera', role: 'A digital construct with Seraphine’s face, visible only to you.' },
      { name: 'Jo', role: 'Blunt, justice-driven, one well-kept marksman rifle. Hard to put down.' },
    ],
    hook: 'The next roll is already loading.',
  },
  {
    slug: 'i-am-the-table',
    id: '6a9d1ba30b414546e54a59aa',
    title: 'I AM THE TABLE!!!',
    logline:
      'You become The Table™, an unbreakable, sentient table in a fantasy world. Chaos, comedy and furniture-based destiny follow.',
    cover: '/covers/2.webp',
    rating: 'SFW',
    tags: ['Fantasy', 'Comedy', 'Transmigration'],
    likes: 5,
    chats: 9,
    accent: '#f59e0b',
    kicker: 'Alderfall · One soul, four legs, zero joints',
    pitch: [
      'You died an extremely ordinary death. A goddess with a clipboard offered you a whole new life in a world of magic and destiny. You said yes before reading the fine print.',
      'You cannot walk. You cannot talk. On a good day, you can wobble. And yet dark lords monologue on your surface, and a very bitter chair is watching your legend grow.',
    ],
    world: [
      { label: 'Unbreakability', text: '∞. The infinity is load-bearing.' },
      { label: 'Movement', text: 'One (1) inch, with feelings.' },
      { label: 'Audible speech', text: 'Hearable by one (1) carpenter.' },
    ],
    cast: [
      { name: 'Barnaby “Barn” Oakhollow', role: 'Failed carpenter, accidental prophet, the only man alive who hears furniture.' },
      { name: 'Sir Reginald Twobble III', role: 'A sentient armchair. The prophecy forgot him. He’s taking it personally.' },
      { name: 'Priscilla Vane', role: 'Guild registrar, armed with forms, determined to file you under SOMETHING.' },
      { name: 'Beryl', role: 'Goddess of Reincarnation Compliance. Caused everything. Uses you as a desk.' },
    ],
    hook: 'The tables are turning. You are the tables.',
  },
]

export const totalLikes = STORIES.reduce((n, s) => n + s.likes, 0)
export const totalChats = STORIES.reduce((n, s) => n + s.chats, 0)
