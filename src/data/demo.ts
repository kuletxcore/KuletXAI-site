// Fixed scripts for the home-page Teaser, condensed from each storyline's own openings, cast and codex.
// Every path reaches an end card; no two choices loop back on each other.

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
    speaker: 'SPLINTERFORD',
    start: 'start',
    nodes: {
      start: {
        say: [
          'OAKHOLLOW CARPENTRY, SPLINTERFORD. DAWN.',
          'The first thing you notice: no hands. The second: someone is carrying a hot mug toward your face, which is also your entire body.',
          '“And THIS,” Barnaby Oakhollow says, setting it dead center like he’s christening a ship, “is the finest piece I ever made. Four legs! I count them every morning.”',
          'You died on a Tuesday. You remember a goddess, a clipboard, a line that said SIGN HERE. You do not remember ticking a box marked OAK.',
          'The shop bell jingles. A stranger in city clothes raps you twice with a knuckle. “I’ll take this one. My employer collects… unusual pieces.” He raises the knuckle for a third knock.',
        ],
        choices: [
          { label: 'Hum. Low and steady, straight into Barnaby’s bones.', next: 'hum' },
          { label: 'Slide the mug one inch. Into the stranger’s sleeve.', next: 'mug' },
        ],
      },
      hum: {
        say: [
          'Barnaby goes white, then pink, then horizontal. He weeps with joy and falls over a stool, which does not survive.',
          '“NOT FOR SALE,” he announces from the floor. “It talks. Well. It hums. I’m the only one who can hear it, which is either a miracle or a medical matter.”',
          'The stranger tucks a card under your mug. “My employer will be in touch.” The card is embossed with a crown made of mulch.',
        ],
        choices: [
          { label: 'Let Barnaby haul you to the Split Barrel to celebrate.', next: 'tavern' },
          { label: 'Stay in the shop. Something is kneeling outside the door.', next: 'mabel' },
        ],
      },
      mug: {
        say: [
          'The tea travels exactly one inch, with feelings. The stranger’s cuff absorbs all of it.',
          '“Did that table just…”',
          '“It does that,” Barnaby says, with the calm of a man who has never once seen it do that. The stranger leaves faster than he came in.',
          'Barnaby presses his ear to your grain and whispers, “I heard that. I heard you DECIDE.”',
        ],
        choices: [
          { label: 'Wobble once, slow and ominous. Yes, he did.', next: 'vane' },
          { label: 'Hold perfectly still. Let him take you somewhere with more drinks.', next: 'tavern' },
        ],
      },
      tavern: {
        say: [
          'The Split Barrel. Ten minutes in, you have collected three drink rings, one marriage proposal and a lieutenant of the Rotwood who has clearly rehearsed this.',
          '“When the Rotting King’s hammer falls on Splinterford, she’ll finally SEE.” He drops his voice. “The vault under the mill. Midnight. Password’s ‘mulch.’”',
          'Nobody guards their tongue around furniture. His ale is sweating onto your finish without asking, naturally.',
        ],
        choices: [
          { label: 'Ease the ale toward the edge. Toward his lap.', next: 'spill' },
          { label: 'Keep it steady. Barnaby needs to hear the rest.', next: 'splinterfang' },
        ],
      },
      mabel: {
        say: [
          'A gaunt woman in a robe of patched felt kneels on the wet floor in front of you. Nobody has ever knelt to you before.',
          '“O Unmoving One,” breathes Sister Mabel. “The Order of the Load-Bearing Heart begins tonight. With me. And you. And these candles I did not pay for.” She sets down three.',
          'In the corner, an armchair in crimson velvet creaks, loudly and with intent. Sir Reginald Twobble III has read the prophecy many times. It still says table.',
        ],
        choices: [
          { label: 'Hold the candles perfectly level. A sign.', next: 'splinterfang' },
          { label: 'Let one candle roll toward the chair. Purely by accident.', next: 'vane' },
        ],
      },
      vane: {
        say: [
          'Guildmarm Priscilla Vane arrives with Form 12-C and the posture of a woman who has faced dragons and found them insufficiently documented.',
          'RELIC ☐  BEAST ☐  STRUCTURE ☐. She stares at you for a long time, then draws a fourth box by hand. FURNITURE (AMBIGUOUS) ☑.',
          '“Inventing boxes,” she says quietly, “is the only thing I have ever loved.” She reaches for her stamp.',
        ],
        choices: [{ label: 'Slide the form one inch out of reach. Then the doors blow open.', next: 'splinterfang' }],
      },
      splinterfang: {
        say: [
          'The doors come off their hinges. Lord Splinterfang, the Rotting King, ender of dynasties, killer of the concept of Tuesday, strides in on a carpet of termites.',
          'He chooses your surface for his monologue. They always do. “BEHOLD the hammer that has never once failed…”',
          'He raises it high over your grain. Barnaby, very bravely, hides behind you.',
        ],
        choices: [
          { label: 'Take the hit. You are load-bearing.', next: 'bounce' },
          { label: 'Wobble. Slowly. Ominously. Let the room decide what it means.', next: 'kneel' },
        ],
      },
      spill: {
        say: [
          'The ale reaches the edge at the exact speed of inevitability, and goes over.',
          'The lieutenant leaps up, soaked, shrieking the password at full volume. Thirty patrons now know about the vault under the mill. The bard writes it into a song.',
        ],
        end: 'Renown +3. Secrets overheard: one, then everyone’s. The Split Barrel retires your drink rings as a monument.',
      },
      bounce: {
        say: [
          'The hammer lands. The hammer bounces. The hammer leaves through the window and takes the Rotting King’s banner with it.',
          'Not a scratch. The infinity, as the fine print promised, is load-bearing. Sister Mabel lights a fourth candle she also did not pay for.',
        ],
        end: 'Lord Splinterfang’s hammer bounced off you once. Nobody in Alderfall will ever let him forget it.',
      },
      kneel: {
        say: [
          'You wobble. One inch, with feelings.',
          'Lord Splinterfang lowers the hammer. The termites lower themselves. Priscilla Vane, who would deny this under oath, lowers one knee. Sir Reginald creaks in fury.',
        ],
        end: 'Somebody knelt. The Prophecy of the Fifth Leg advances one drink ring at a time.',
      },
    },
  },
  {
    slug: 'acolytes',
    short: 'ACOLYTES',
    speaker: 'MORNING LOG',
    start: 'start',
    nodes: {
      start: {
        say: [
          'ACOLYTES MAID CAFÉ, BEFORE OPENING. Somewhere in the back, a kettle has just started to complain.',
          'The chalkboard got redone overnight: a terrible pun, drawn in flourishes that took longer than the pun deserved. It stays up. House rules.',
          'Hana hip-bumps through the back door with a tray of clean cups. “Morning, Leader! The pun is Yui’s. I lost the vote, so I’m legally required to call it delightful.”',
          'Sasha, rolling silverware without looking up: “It’s a crime with chalk. Tables three and six need wiping, Boss.”',
          'Yui, upside-down notebook, pen behind her ear: “Peace-peace. First cup of the day, Leader. House rules say you pick. How do you like your coffee?”',
        ],
        choices: [
          { label: '“Medium roast. Ease us into the day.”', next: 'medium' },
          { label: '“Black coffee. No sugar, no mercy.”', next: 'black' },
        ],
      },
      medium: {
        say: [
          'Yui writes MEDIUM ROAST in the notebook and underlines it twice. “A reasonable leader. The paperwork will be thrilled.”',
          'Mira nudges the register awake for you. “Quiet night on the block. Morning set’s prepped for the 7:15 regulars.” A small smile. “Kettle’s yours. You do it better.”',
        ],
        choices: [{ label: 'Flip the sign. Let the floor run.', next: 'floor' }],
      },
      black: {
        say: [
          'Yui whistles low. “BLACK COFFEE. Somebody wants it hard mode.” She draws a tiny skull next to it.',
          'Sasha’s hands stop for half a second, then keep rolling. “Boss.” From her, that is a whole speech.',
          'Mira sets the pastry tray down a little more carefully than she needs to. Hana grins like it’s her birthday.',
        ],
        choices: [{ label: 'Flip the sign. Let the floor run.', next: 'floor' }],
      },
      floor: {
        say: [
          'The bell rings. The 7:15 regulars come in like weather: a courier who pays in exact change, two students who split the window seat, and the man at table six who never orders.',
          'He leaves before the rush peaks. Under his saucer: a folded napkin with an address in the warehouse district, and a time. 04:40.',
          'The floor is a no-violence zone. Weapons are never drawn here, and nobody on shift so much as looks at the back door. One incident would burn every cover in the city.',
        ],
        choices: [
          { label: 'Pocket the napkin like a tip. Finish the shift.', next: 'close' },
          { label: 'Pass it to Mira on the next tray. Let her run it during the lull.', next: 'mira' },
        ],
      },
      mira: {
        say: [
          'Mira reads it once between a fruit tart and a matcha cloud, and her face does not change at all. That’s how you know.',
          '“Two heat signatures in a building nobody owns,” she murmurs on the next pass. “Thermal’s been flagging it since Sunday.” She refills a stranger’s water without spilling a drop.',
        ],
        choices: [{ label: 'Finish the shift. Same as always.', next: 'close' }],
      },
      close: {
        say: [
          'Chairs tipped. Machine wiped. Till counted. Aprons off and hung in order.',
          '04:40. The briefing room lights are dimmer than the café ever gets. A satellite photo of the warehouse waits on the wall screen. Your earpiece crackles once: comms live.',
          'Hana is bouncing on her heels, Seven already slung. “Two heat spots, no trucks, no guards on the wire. That’s either nothing, or the fun kind of something.”',
          'Sasha doesn’t turn from the screen. “North block roofline has two clean angles. If it’s real, I want the taller one. If it’s nothing, I want coffee.”',
          'Mira seats the last shell in Breachwright. “Med kit’s staged by the door. I’d rather carry it home full.” Yui flips her notebook shut. “If it eats a full squad, does the suit get a vote?”',
        ],
        choices: [
          { label: '“Sasha, take the tall roof. Mira breaches, Hana on point. Loud on my word.”', next: 'loud' },
          { label: '“Quiet way in. We look before we touch. If it breathes wrong, we walk.”', next: 'quiet' },
        ],
      },
      loud: {
        say: [
          'Mira’s two shells take the door off. Two is the habit; three would be a confession. Hana goes through on burst, bright as she left the floor, until the first muzzle flash. Then the brightness drops away and she is all precision.',
          'Bullets connect and fail to do what they should. Your people go down to nothing. That is the Agency’s best-kept secret, and it stays kept.',
        ],
        end: 'Field log, Agent 00: cleared and home before the 7:15 regulars. Who left the napkin is the live story’s question.',
      },
      quiet: {
        say: [
          'Boots on the parapet side, comms at a whisper. Sasha has the taller roof. Yui’s Nullcase stays quiet and leaves nothing behind it.',
          'Inside: cold air, machine oil, and a single chair facing the wall, as if somebody sat there waiting for exactly this hour.',
        ],
        end: 'Field log, Agent 00: observed, not committed. What the warehouse was waiting for is the live story’s to keep.',
      },
    },
  },
]
