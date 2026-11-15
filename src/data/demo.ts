/**
 * Scripted teasers for THE TEASER — the home-page demo of the AI storyteller.
 * These are fixed scripts, written to show the shape of a live session:
 * you decide, the world answers, nobody says the same thing twice.
 * The CTA at the end deep-links into the real storyline.
 *
 * ACOLYTES runs the full two-register arc: the warm café register, the
 * transition seam, then the tactical register — because the duality IS
 * the product. I AM THE TABLE is the short, self-contained comedy taste.
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
    speaker: 'HOUSE LOG',
    start: 'start',
    nodes: {
      start: {
        say: [
          'ACOLYTES MAID CAFE — 6:52 AM. The kettle has just started to complain.',
          'The chalkboard: a latte-art heart in sunglasses. SIT. STAY. SIP. Hana will claim she didn’t. Yui absolutely did.',
          'Hana hip-bumps through the back door, hair half-pinned, tray stacked higher than her elbows. “Morning, Leader! Petre says if his usual is late again he’s filing a formal complaint with the management — which I believe means us, which I believe means you.”',
          'Sasha, rolling silverware in the corner without looking up: “Tables three and six need wiping. And someone signed out my good grinder again. Medium dice. Taped dial.”',
          'Yui spins upside down off the steam wand. “Three things. One, the pun is art. Two, Hana drank the syrup, I have testimony. Three—” she flips a business card out of the tip jar, “this was in OUR tip jar. Real stock. ‘Acolyte Consultancy — solutions for the unpredictable.’ No number. Our card.”',
        ],
        choices: [
          { label: 'Keep your pour steady. “Card goes to Sasha. Back room. Quiet.”', next: 'card' },
          { label: '“Who prints these? Who knows we have them?”', next: 'who' },
        ],
      },
      who: {
        say: [
          'Yui folds her arms. “Nobody, allegedly. We don’t hand these out. That’s the whole point of a card with no number on it.”',
          'Sasha aligns a napkin roll to the millimeter. “Someone placed it. On brand: expensive, deliberate, and gone before the day knows.”',
        ],
        choices: [
          { label: 'Pocket it like an ordinary thank-you. Officially.', next: 'day' },
          { label: 'Back room. Log it. Ask after the rush.', next: 'card' },
        ],
      },
      card: {
        say: [
          'You slide the card to Sasha with two fingers, like it might bite. “Back room. Evidence box. Nobody photographs it until I say.”',
          'Hana’s smile doesn’t move, and her voice drops half a register under the espresso hiss. “Right. Will do.” A beat. “That’s our paper, Leader. I’ve handled our paper.”',
          'The 7:15 regulars come in like weather — Mr. Petre, two students, the courier who pays in exact change. The floor runs its loop. Breakfast becomes lunch. The block stays ours.',
        ],
        choices: [{ label: 'Let the day run its usual laps.', next: 'ping' }],
      },
      day: {
        say: [
          'You palm it like an ordinary customer’s thank-you. The floor runs — Petre gets his usual at 7:15 on the dot, the students split the window seat, the courier pays in exact change.',
          'No one reaches for the back room. The morning holds its shape, because that is what the morning is for.',
        ],
        choices: [{ label: 'Let the day run its usual laps.', next: 'ping' }],
      },
      ping: {
        say: [
          '1:40 PM. The stockroom. Mira appears with flour on her sleeve — except it isn’t flour when she’s done. “District chatter. A pager, of all things — deliberate. They want us looking at the warehouse district. Forty-somethingth and the frontage road. Thermal’s been flagging heat inside a dead building since Sunday.”',
          'She smooths the napkin flat on the steel table. “They didn’t say go. They said ‘when you’re ready, Agent Zero.’ Somebody knows the designation. Somebody knows there IS one.”',
          '“And they knew before the card,” Mira adds, quiet as a steam valve. “The card was confirmation.”',
        ],
        choices: [{ label: 'Wipe the same circle of counter twice. “We open tomorrow. Same as always.”', next: 'close' }],
      },
      close: {
        say: [
          'The day closes on schedule — chairs tipped, machine wiped, till counted, lamps dimmed one row at a time. Out on the block the flower shop is shuttered; the bakery’s cat sleeps in the warm grill grate.',
          'The seam runs quiet: aprons off, hung in order. Boots instead of sneakers. Radio. Ceramic plates for plates that aren’t ceramic. Four people down the back stairs like a dozen times a year, and the espresso machine behind you goes from ordinary to gone.',
          '23:40. The briefing room, down to the good kind of dark. Wall screen: one dead warehouse, empty frontage road — and inside it, two heat signatures that shouldn’t be alive. No trucks. No plates. No wire breathing.',
        ],
        choices: [{ label: 'Gear check. Then the first word.', next: 'gear' }],
      },
      gear: {
        say: [
          'Hana bounces on her heels, Selector slung, good magazines taped like the dials. “Two spots, nobody home outside. That’s either nothing — or the fun kind of something.”',
          'Sasha stands at the dark end of the screen, counting angles. “North parapet’s clean. Two fields of fire, no cross-own. If it’s real, I want the second before anyone’s inside.”',
          'Mira seats a shell with a click that doesn’t carry. “Med kit’s by the door. I’d rather carry it home full. Stack order’s yours.”',
          'Yui drops her notebook flat. “Hypothetically — if it eats the squad, does the suit get a vote, or just a funeral?” The grin checks the signatures anyway. “Asking for me. Peace-peace.”',
        ],
        choices: [
          { label: '“Stack order on me: breach, sweep, clear. Sasha, north parapet. Hana, point. Go loud on my word.”', next: 'loud' },
          { label: '“Quiet way in. We look before we touch. If it breathes wrong, we walk and call it in dirty.”', next: 'quiet' },
        ],
      },
      loud: {
        say: [
          'Gear settles into muscle memory. Earpieces click live, one by one. Somewhere above you the city sleeps; somewhere below it, an unmarked business card sits in an evidence bag, and somebody out there knows what you are.',
          'The warehouse door gives on the second try. Cold air. Machine oil. Dust that never settles.',
        ],
        end: 'Field log, Agent 00: executed as ordered. What was inside — and who mails an officer her own card — the live story never stops asking.',
      },
      quiet: {
        say: [
          'Nobody argues; nobody ever has. Boots on the parapet-side approach, comms a whisper. The door reads as untouched — and patient.',
          'Inside: cold air, machine oil, and a single chair facing the wall, like somebody sat there waiting for exactly this hour.',
        ],
        end: 'Field log, Agent 00: observed, not committed — tonight. What the warehouse was waiting for is the live story’s question to keep.',
      },
    },
  },
]
