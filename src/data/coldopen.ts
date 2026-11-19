/**
 * The cold open: the first beat of each world, written to be read in about ten seconds and played in one tap.
 *
 * This is not the Teaser (src/data/demo.ts). The Teaser is two worlds, full arcs, minutes long, for someone who has
 * already decided they are curious. A cold open is the opposite: one decision, immediately, for someone who has just
 * landed. It is scripted and the card says so. The live session is the improvised part, and it happens on the platform.
 *
 * Ordered by traffic. The busiest world gets the first screen, and "another world" walks down from there.
 * The 18+ world is not in this deck, the same rule the World Dealer follows; it opens from the grid.
 */
export type ColdChoice = {
  /** What you do. Second person, one short line, no stage directions. */
  label: string
  /** What the world does back. The last line is the hook that makes leaving the page the obvious next move. */
  reply: string
}

export type ColdOpen = {
  /** Matches a slug in src/data/content.ts */
  slug: string
  /** Short name for the hero's play button */
  short: string
  /** Who is speaking: the world, not a shop sign */
  speaker: string
  /** Two lines. The situation, then the thing that has just gone wrong. */
  open: [string, string]
  choices: [ColdChoice, ColdChoice]
}

export const COLD_OPENS: ColdOpen[] = [
  {
    slug: 'acolytes',
    short: 'Acolytes',
    speaker: 'ACOLYTE CONSULTANCY',
    open: [
      'The bell over the door rings at 19:58, two minutes after last order, and the man who walks in is not here for the matcha.',
      'Hana sets a cup down unasked. Under it, a folded card with your designation on it. Agent 00, the only double-zero the Agency ever issued.',
    ],
    choices: [
      {
        label: 'Pour him a cup and wait.',
        reply:
          'He drinks, watching you over the rim. “So you are the double-zero.” Outside, a car door closes. Twice.',
      },
      {
        label: 'Ask him to leave. Politely.',
        reply:
           '“I am leaving,” he says, and sets a phone on the counter. It is live footage of the café’s back door, open, from outside.',
      },
    ],
  },
  {
    slug: 'problem-spawner',
    short: 'Problem Spawner',
    speaker: 'MERIDIAN',
    open: [
      'The voice behind your thoughts clears its throat and says one word. Rolling.',
      'The air folds. Something arrives in the middle of the quad that has no business existing. Four hundred students stop moving at once.',
    ],
    choices: [
      {
        label: 'Get everyone away from it.',
        reply:
          'Nobody knows what it does. It turns its head and watches you the way a dog watches a door that has just closed.',
      },
      {
        label: 'Touch it.',
        reply:
          'Warm, and made of something that remembers being a story. When you let go, the quad is empty except for one person who did not run.',
      },
    ],
  },
  {
    slug: 'colossus-protocol',
    short: 'Colossus',
    speaker: 'RIFT RESPONSE',
    open: [
      'The alert lands at 04:12. Tier three: two signatures coming ashore off the point. Everyone in the room turns to look at you.',
      'You are 170cm of Coast Guard rescue swimmer. You can be 300 metres of something else in under a minute.',
    ],
    choices: [
      {
        label: 'Shift now. Meet them in the water.',
        reply:
          'Sixty seconds is a long time to be nothing. At nineteen metres you are a target. At ninety they stop swimming for the city and start swimming for you.',
      },
      {
        label: 'Hold. Let the beach clear first.',
        reply:
          'Reyes counts the evacuation boats out loud so you can hear a human voice. The second signature reaches the shallows with 600 people still on the sand.',
      },
    ],
  },
  {
    slug: 'queen-bee',
    short: 'Queen Bee',
    speaker: 'KINGSMERE',
    open: [
      'First day. The corridor goes quiet in a wave, from the far doors to where you are standing, as if someone turned a dial.',
      'The Queen Bee’s seat has been empty since June. Two girls claimed it in September. Both are still here. Neither sits in it.',
    ],
    choices: [
      {
        label: 'Walk straight down the middle.',
        reply:
          'A bag slides into your path. You step over it without breaking stride. Behind you, a chair creaks as somebody stands.',
      },
      {
        label: 'Stop at the noticeboard and read.',
        reply:
          'Your name is on the transfer list. Under it, in fresh ink, in a hand that is not the registrar’s, one word. LATER.',
      },
    ],
  },
  {
    slug: 'i-am-the-table',
    short: 'The Table',
    speaker: 'ALDERFALL',
    open: [
      'You died on a Tuesday. You remember a goddess with a clipboard, a line marked SIGN HERE, and a lot of fine print you did not read.',
      'You wake up in a carpenters’ yard. Four legs. No joints. An extraordinary amount of grain.',
    ],
    choices: [
      {
        label: 'Wobble. Just try it.',
        reply:
          'One inch, with feelings. Barnaby Oakhollow drops his chisel, puts his ear against you, and says, very quietly, “I knew it.”',
      },
      {
        label: 'Hold perfectly still.',
        reply:
          'You are a table. You are the finest table this shop has ever produced. By noon three people have stood on you and one of them was a duke.',
      },
    ],
  },
  {
    slug: 'godsmarked',
    short: 'Godsmarked',
    speaker: 'KESTREL CITY',
    open: [
      'The box under the floorboard holds the costume from a comic cancelled after eleven issues.',
      'You put it on for thirty seconds, alone, in a house full of other people’s boxes. It bonds at the seams. Your eyes flood violet.',
    ],
    choices: [
      {
        label: 'Get it off. Now.',
        reply:
          'The seams do not give, and the room tilts. You are floating four centimetres off the boards without meaning to. Your phone is buzzing with Ren’s name.',
      },
      {
        label: 'Look at yourself.',
        reply:
          'Astralita looks back: six feet of borrowed divinity in a dusty attic. Downstairs, a key turns in the front door.',
      },
    ],
  },
]

export const coldOpenAt = (i: number) => COLD_OPENS[i % COLD_OPENS.length]

/** The world on the first screen. Busiest first, so the front door shows the story people actually play. */
export const FEATURED_COLD_OPEN = COLD_OPENS[0]
