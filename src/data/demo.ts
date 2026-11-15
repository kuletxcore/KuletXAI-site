/**
 * Scripted teasers for THE TEASER — the home-page demo of the AI storyteller.
 * These are fixed scripts, written to show the shape of a live session:
 * you decide, the world answers, nobody says the same thing twice.
 * The CTA at the end deep-links into the real storyline.
 */

export type DemoChoice = { label: string; next: string }

export type DemoNode = {
  say: string[]
  choices?: DemoChoice[]
  /** Closing line shown on the end card (instead of choices) */
  end?: string
}

export type DemoWorld = {
  /** Matches a slug in src/data/content.ts */
  slug: 'acolytes' | 'i-am-the-table'
  /** Short name for the terminal tab and title bar */
  short: string
  /** Line-prefix label, e.g. who is "speaking" the narrated beats */
  speaker: string
  start: string
  nodes: Record<string, DemoNode>
}

export const DEMO_WORLDS: DemoWorld[] = [
  {
    slug: 'i-am-the-table',
    short: 'I AM THE TABLE',
    speaker: 'ALDERFALL',
    start: 'start',
    nodes: {
      start: {
        say: [
          'ALDERFALL, GUILD HALL — 3:12 PM.',
          'You have been a table for eleven days. You cannot walk. You cannot speak. Your front left leg squeaks on the fourth wobble.',
        ],
        choices: [
          { label: 'Barn sets a teacup on you. He always comes before the storm.', next: 'barn' },
          { label: 'The guild doors BANG open. Smoke. A cape. A monologue.', next: 'morvane' },
        ],
      },
      barn: {
        say: [
          'Barn Oakhollow bows to you the way you bow to weather.',
          '“Grandma’s prophecy,” he whispers, “only one line unread. ‘The last thing created shall be the last thing standing.’ You were last.”',
          'He laces his boots. Your surface rattles. Somewhere in the corner, a chair takes it personally.',
        ],
        choices: [
          { label: 'Wobble once. You meant to do that.', next: 'wobble' },
          { label: 'Tables do not flinch at prophecies.', next: 'vane' },
        ],
      },
      wobble: {
        say: [
          'You wobble. One inch, with feelings.',
          'Barn gasps like the second coming clocked in. On the guild wall he chalks: IT UNDERSTANDS.',
        ],
        choices: [
          { label: 'The doors explode again. Priscilla Vane grabs her clipboard.', next: 'vane' },
          { label: 'Barn slides you across the hall. Something enormous just landed on the roof.', next: 'morvane' },
        ],
      },
      vane: {
        say: [
          'Priscilla Vane circles you, Form 22-B in hand: REGISTRATION OF ANOMALOUS WOODEN PERSON.',
          '“Occupation?” she demands. “Because I am prepared to file you as STORAGE.”',
        ],
        choices: [
          { label: 'Wobble at her shoes, hard. Bureaucracy hates rhythm.', next: 'wobble' },
          { label: 'The chandelier swings. Something large just landed on the roof.', next: 'morvane' },
        ],
      },
      morvane: {
        say: [
          'DEMON KING MORVANE inhales like a collapsing theater. “IN THIS HALL, YOU SHALL WITNESS—”',
          'He is monologuing TO you. On you. His epic pause stretches exactly as long as your patience.',
        ],
        choices: [
          { label: 'Load-bearing. Let the silence do the work.', next: 'silence' },
          { label: 'Barn. NOW. Slide me.', next: 'slide' },
        ],
      },
      silence: {
        say: [
          'The silence grows legs. Morvane checks his notes. The notes say only: TABLE. FINAL BOSS?',
          'He whispers, “…you built all this without moving. Inspiring, frankly.” Around him, axes set themselves down.',
        ],
        end: 'The tables turn. You are the tables. Alderfall sleeps beneath an immovable, load-bearing piece of destiny.',
      },
      slide: {
        say: [
          'Barn shoves you like a lifeboat launch. You cross the hall at terminal furniture velocity and meet Morvane at the knees.',
          'The infinity holds. The cape regrets it. The chair in the corner sheds one bitter tear of pure joy.',
        ],
        end: 'One soul, four legs, zero joints — total victory. The guild frames your coaster.',
      },
    },
  },
  {
    slug: 'acolytes',
    short: 'ACOLYTES',
    speaker: 'FIELD LOG',
    start: 'start',
    nodes: {
      start: {
        say: [
          'ACOLYTES MAID CAFE — 7:58 PM. Two minutes after close.',
          'Hana slides four matcha clouds across the counter without being asked. Her sleeves are down. The mirror behind the shelves catches everything.',
        ],
        choices: [
          { label: '“Table four. Voices down, smiles up.”', next: 'approach' },
          { label: '“Mira — kitchen. Now. Check the exits and the flour.”', next: 'mira' },
        ],
      },
      mira: {
        say: [
          'Forty seconds later, Mira Solis breathes into comms: “Boss. Two hostiles, sidearm in the flour bin. Also the backstock of matcha is suspiciously full.”',
          'Hana wipes an already-clean counter. On the café speakers, crime-scene jazz clicks over — house rules after dark.',
        ],
        choices: [{ label: '“Clear them before the second cloud hits the table.”', next: 'approach' }],
      },
      approach: {
        say: [
          'You cross the floor, tray level, towel over one shoulder. Table four goes quiet the way rooms sometimes do.',
          '“Evening, gentlemen. The usual terms: drink quietly, or The Acolytes resolves the disruption before it reaches your table.”',
        ],
        choices: [
          { label: 'Lay a single receipt on the table. It prints everything they forgot to hide.', next: 'receipt' },
          { label: 'Say nothing. Let the café hum.', next: 'hum' },
        ],
      },
      receipt: {
        say: [
          'Hana sight-reads upside down while shelving tea. The receipt lists aliases, a badge number, a poker debt, and one very specific milk allergy.',
          'The taller man unbuttons his jacket two inches. The shorter one carefully unwraps matcha cloud number three. “We thank the house,” he says, at a funeral’s volume.',
        ],
        end: 'Extracted, paid in full, resolution pending. The Acolytes keeps the peace — one matcha at a time.',
      },
      hum: {
        say: [
          'Refrigerator hum. Crime-scene jazz. Four beats of weaponized café calm.',
          'The taller man folds first — exact change, chair scraped back, “just passing through.” The shorter one leaves a five-star review neither of them believes.',
        ],
        end: 'Quiet night — exactly like every night nobody notices. Field log for Agent 00: cleared.',
      },
    },
  },
]
