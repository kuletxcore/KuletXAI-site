export const ISEKAI_REF = '?referralCode=95OBGFQX'

export const LINKS = {
  isekai: `https://www.isekaizero.ai/${ISEKAI_REF}`,
  isekaiProfile:
    'https://www.isekaizero.ai/creator/6a9457a462f8f09c667828f7?utm_campaign=share&utm_medium=creator&utm_content=kuletxcore&referralCode=95OBGFQX',
  kageProfile: 'https://www.kagesekai.ai/creator/6a9457a462f8f09c667828f7',
  trimz: 'https://trimz.tv/u/kuletxcore',
  youtube: 'https://youtube.com/@kuletxai',
}

export const isekaiStoryUrl = (id: string) => `https://www.isekaizero.ai/storylines/${id}${ISEKAI_REF}`
/** 18+ storylines live on KageSekai, IsekaiZero's adult sister site (same accounts and storyline ids). */
export const storyPlatform = (s: { rating: Story['rating'] }): 'kage' | 'isk' => (s.rating === '18+' ? 'kage' : 'isk')
export const storyPlatformName = (s: { rating: Story['rating'] }) => (s.rating === '18+' ? 'KageSekai' : 'IsekaiZero')
export const storyUrl = (s: { id: string; rating: Story['rating'] }) =>
  s.rating === '18+' ? `https://www.kagesekai.ai/storylines/${s.id}` : isekaiStoryUrl(s.id)
export const trimzSeriesUrl = (slug: string) => `https://trimz.tv/${slug}`

export type TrimzSeries = {
  slug: string
  /** Short name used in shareable links (?tab=trimz&series=…) */
  key: string
  title: string
  summary: string
  poster: string
  /** Looping cover video for the hub backdrop (optional) */
  video?: string
  /** Title logotype and square tile art from the IsekaiZero "logotypes" folder */
  logo?: Logo
  tile?: string
  episodes: number
  views: number
}

// Public series on trimz.tv/u/kuletxcore (Nov 2026)
export const TRIMZ: TrimzSeries[] = [
  {
    slug: 'acolytes-maid-for-your-protection',
    key: 'acolytes',
    logo: { src: '/titles/acolytes.webp', w: 1100, h: 330 },
    tile: '/tiles/acolytes.webp',
    title: 'Acolytes: Maid for your Protection',
    summary:
      'Maid café waitresses by day, unkillable black-ops agents by night, and nobody on the block knows.',
    poster: '/trimz/acolytes.webp',
    video: '/trimz/acolytes.mp4',
    episodes: 4,
    views: 163,
  },
  {
    slug: 'acolytes-maid-for-your-protection-side-b',
    key: 'side-b',
    logo: { src: '/titles/acolytes-side-b.webp', w: 1100, h: 409 },
    tile: '/tiles/acolytes-side-b.webp',
    title: 'Acolytes: Maid for your Protection (Side B)',
    summary: 'Beneath a maid café, a new squad leader runs secret tactical missions.',
    poster: '/trimz/acolytes-side-b.webp',
    video: '/trimz/acolytes-side-b.mp4',
    episodes: 1,
    views: 90,
  },
]

/**
 * Cast members who lead a Trimz series, by IsekaiZero character id
 * (src/data/isk.ts). Rin fronts the original Acolytes series, Jo Side B.
 */
const CAST_TRIMZ: Record<string, string> = {
  '6aa9130cbda2b3fef5ba8e8d': 'acolytes-maid-for-your-protection', // Rin Aoyama
  '6aede2da070968d7a79850ec': 'acolytes-maid-for-your-protection-side-b', // Josefina "Jo" Jones
}

export const castTrimz = (castId: string) => TRIMZ.find((t) => t.slug === CAST_TRIMZ[castId])

export type Logo = { src: string; w: number; h: number }

export type Story = {
  slug: string
  id: string
  title: string
  logline: string
  cover: string
  rating: 'SFW' | '17+' | '18+'
  tags: string[]
  /** IsekaiZero counts baked in at build time; useIskStats() swaps in live numbers */
  likes: number
  chats: number
  messages: number
  /** Accent color for this story's mini-site */
  accent: string
  kicker: string
  pitch: string[]
  world: { label: string; text: string }[]
  cast: { name: string; role: string }[]
  castTitle?: string
  hook: string
  trimz?: string[]
  logo?: Logo
  tile?: string
}

// Storylines from the kuletxcore account on IsekaiZero and KageSekai (Nov 2026)
export const STORIES: Story[] = [
  {
    slug: 'acolytes',
    logo: { src: '/titles/acolytes.webp', w: 1100, h: 330 },
    tile: '/tiles/acolytes.webp',
    id: '6aa78f6bd17fe984ab332064',
    title: 'Acolytes: Maid for your Protection',
    logline:
      'By day, you serve tea and cake. By night, you lead an elite black-ops unit no government will admit exists.',
    cover: '/covers/1.webp',
    rating: '17+',
    tags: ['Spy', 'Thriller', 'Undercover'],
    likes: 170,
    chats: 139,
    messages: 3400,
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
    logo: { src: '/titles/colossus-protocol.webp', w: 1100, h: 278 },
    tile: '/tiles/colossus-protocol.webp',
    id: '6aa4a2ce523ccdd47ab9b80d',
    title: 'Colossus Protocol',
    logline:
      'You can grow from human height to 300 meters. When kaiju rise from the coastal rifts, you are the only one who can meet them at their own scale.',
    cover: '/covers/3.webp',
    rating: '17+',
    tags: ['Kaiju', 'Giantess', 'Apocalypse'],
    likes: 36,
    chats: 40,
    messages: 752,
    accent: '#38bdf8',
    kicker: 'Rift Response Division · Eyes only',
    pitch: [
      '214 people were caught in the discharge pulse. 213 of them died. The last one was a Coast Guard rescue swimmer holding a drowning woman at the surface.',
      'Forty-one nights in a sealed ward later, the city had learned the word “kaiju”, and she had a new callsign: Colossus Actual.',
    ],
    world: [
      { label: 'The Shift', text: '1.7 m to 300 m in about sixty seconds. Every size in between fights differently.' },
      { label: 'The cost', text: 'Ten minutes at full size before resonance burn. Afterward, hours of being fragile.' },
      { label: 'Doctrine', text: 'Tier Three needs a flag officer, and a form with one blank line: ACCEPTABLE LOSSES.' },
    ],
    cast: [
      { name: 'Reyes', role: 'Colossus Actual’s ground-station handler. The one voice she trusts above 20 meters.' },
    ],
    hook: 'They are going somewhere. She is the only thing in the way.',
  },
  {
    slug: 'queen-bee',
    logo: { src: '/titles/queen-bee.webp', w: 1100, h: 332 },
    tile: '/tiles/queen-bee.webp',
    id: '6a9ae1c5a66365ba9f1523f1',
    title: 'Acknowledge Me: Become the Queen Bee',
    logline:
      'You arrived as a nobody. Climb the social hierarchy until the entire school has to acknowledge you.',
    cover: '/covers/5.webp',
    rating: 'SFW',
    tags: ['High School', 'Rivals', 'Slow Burn'],
    likes: 14,
    chats: 20,
    messages: 398,
    accent: '#f5b301',
    kicker: 'Kingsmere Academy · The vacant seat',
    pitch: [
      'Kingsmere doesn’t run on grades. It runs on bloodlines, and on the currency every bloodline defends: status.',
      'The Queen Bee’s seat has been empty since June. Two girls declared themselves heir. Kingsmere ate them both. The new girl walks in this morning: unranked, unprotected, unknown.',
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
      { name: 'Unranked', role: 'Nobody. Where the new girl starts.' },
      { name: 'Affiliate → Made', role: 'Useful to a faction, then a seat at its table.' },
      { name: 'Lieutenant → Head', role: 'The right hand, then one of five.' },
      { name: 'Queen Bee', role: 'Undisputed. One at a time. Nowhere left to climb.' },
    ],
    hook: 'First they laugh at the new girl. Then the halls go quiet when she passes.',
  },
  {
    slug: 'problem-spawner',
    logo: { src: '/titles/problem-spawner.webp', w: 862, h: 179 },
    tile: '/tiles/problem-spawner.webp',
    id: '6a9504a149fd840d6d383b33',
    title: 'The Problem Spawner',
    logline:
      "Cursed with a power you can't control, you spawn random fragments of other worlds into reality. Survive the chaos.",
    cover: '/covers/4.webp',
    rating: 'SFW',
    tags: ['Academy', 'Superpower', 'Comedy'],
    likes: 11,
    chats: 11,
    messages: 1348,
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
    logo: { src: '/titles/i-am-the-table.webp', w: 1100, h: 296 },
    tile: '/tiles/i-am-the-table.webp',
    id: '6a9d1ba30b414546e54a59aa',
    title: 'I AM THE TABLE!!!',
    logline:
      'You become The Table™, an unbreakable, sentient table in a fantasy world. Chaos, comedy and furniture-based destiny follow.',
    cover: '/covers/2.webp',
    rating: 'SFW',
    tags: ['Fantasy', 'Comedy', 'Transmigration'],
    likes: 5,
    chats: 9,
    messages: 110,
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
  {
    slug: 'godsmarked',
    logo: { src: '/titles/godsmarked.webp', w: 1100, h: 218 },
    tile: '/tiles/godsmarked.webp',
    id: '6ab416c09949716a1b4e333b',
    title: 'Godsmarked: Borrowed Divinity',
    logline:
      'A cancelled comic’s costume bonds to you, a fan, granting goddess powers you never earned, in a world with no heroes.',
    cover: '/covers/6.webp',
    rating: '17+',
    tags: ['Superpower', 'Transformation', 'Mystery'],
    likes: 6,
    chats: 2,
    messages: 22,
    accent: '#c77dff',
    kicker: 'Kestrel City · The box under the floorboard',
    pitch: [
      'You found Astralita’s real costume folded in a cardboard box under a loose attic floorboard. You put it on for thirty seconds of pretending, alone in a house full of boxes.',
      'It bonded. Your eyes flooded violet. The seams sealed under your fingers. Downstairs, your phone is already buzzing with Ren’s name.',
    ],
    world: [
      { label: 'The costume', text: 'The only object from GodSmarked’s reality on Earth. It bonds to whoever puts it on.' },
      { label: 'Power, no skill', text: 'Flight, strength, elite magic, divine arms. Every use leaves a mark: injury, noise, witnesses, damage.' },
      { label: 'Kestrel City', text: 'No hero has ever been recorded. The unexplained reads as a stunt or a hoax until someone produces proof.' },
    ],
    cast: [
      { name: 'Ren Webb', role: 'Your best friend. Knocks three times, pauses, knocks twice, lets herself in.' },
      { name: 'Asuka Tomo', role: 'Wrote and drew GodSmarked as K. Komi. Believes she made it all up.' },
      { name: 'Evelyn Hollis', role: 'Kestrel Ledger reporter. Asks the same question three ways and waits out the silence.' },
      { name: 'Sadie Porter', role: 'Next door on Cinder Row. Jam on the doorstep at six, questions at the fence by seven.' },
      { name: 'Wanda Una', role: 'Hiring manager downtown. Has reread your application four times.' },
      { name: 'Dexter Radley', role: 'Runs the last GodSmarked forum. Names the issue off one blurred frame.' },
    ],
    hook: 'You put it on as a joke. It did not come off.',
  },
  {
    slug: 'wristbound',
    logo: { src: '/titles/wristbound.webp', w: 1100, h: 310 },
    tile: '/tiles/wristbound.webp?v=645d4484',
    id: '6af2da17a519bbd9cf367837',
    title: 'Wristbound: Zero to Hero',
    logline: 'You find a device that turns you into different women. Now use that to become a hero.',
    cover: '/covers/7.webp?v=e1e00166',
    rating: '18+',
    tags: ['Sci-Fi', 'Transformation', 'Body Horror'],
    likes: 0,
    chats: 0,
    messages: 0,
    accent: '#a05cff',
    kicker: 'The Wristbound · The lab under the farmhouse',
    pitch: [
      'An ordinary afternoon goes wrong in a farmhouse nobody visits. Under the floor there is a lift, at the bottom of it a lab, and in the lab a black braided cord with a pale stone that has been waiting for you specifically. It does not ask. It ties itself.',
      'Your body becomes someone else’s, and you did not choose who. You get the hour she can spare, and when it runs out you drop back into yourself, wrung out and ordinary. Then you go home. Then it happens again, worse.',
    ],
    world: [
      { label: 'The Wristbound', text: 'A black braided cord with a pale stone that ties itself to your wrist and lends you other women’s bodies. It was made for someone else.' },
      { label: 'An hour a knot', text: 'Ten knots in one braid, each an hour of a woman’s life, given freely. Hard work burns it faster, and it refills only out of her own life, slowly.' },
      { label: 'Mitsuki’s knot', text: 'The first knot is Mitsuki’s own, and it decides what you are allowed to take. You do not have it opened. You earn it.' },
    ],
    cast: [
      { name: 'Lena Hoshino', role: 'Your best friend, there when the cord tied itself. No powers, very practical hands, and a ledger of what the cord costs.' },
      { name: 'Mitsuki', role: 'Wove the cord by hand in a shop between worlds. Her knot is first in the braid, and she keeps it closed until she is satisfied.' },
    ],
    hook: 'An hour in a form. A body you did not choose. A world that has started to notice.',
  },
]

export const totalLikes = STORIES.reduce((n, s) => n + s.likes, 0)
export const totalChats = STORIES.reduce((n, s) => n + s.chats, 0)
export const totalMessages = STORIES.reduce((n, s) => n + s.messages, 0)
