// Acolytes achievements from the IsekaiZero codex (category "achievement").
// Titles and descriptions are the story's own; grades are site picks (the codex has none),
// and the Platinum is a site addition for collecting the full set.
export type TrophyGrade = 'platinum' | 'gold' | 'silver' | 'bronze'
export type Trophy = { id: string; title: string; description: string; grade: TrophyGrade; hidden: boolean }
export type TrophySet = { slug: string; title: string; trophies: Trophy[] }

const ACOLYTES: Trophy[] = [
  {
    "id": "house-legend",
    "title": "House Legend",
    "description": "Earn every other Acolytes trophy. The café, the Back, the whole ledger: all yours.",
    "grade": "platinum",
    "hidden": false
  },
  {
    "id": "house-standards",
    "title": "House Standards",
    "description": "Five clean shifts and nothing hit the Back. Honestly? Kind of impressive. Keep it going.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "hands-are-last-resort",
    "title": "Hands Are Last Resort",
    "description": "Talked it all the way down. No hands. That's how it should go.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "the-best-there-is",
    "title": "The Best There Is...",
    "description": "You carried the decisive beat yourself. Or you ran the floor alone through the worst rush we've had. Either way — that tracks.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "closing-time",
    "title": "Closing Time",
    "description": "Everyone walked out Operational. File's closed. That's the only score that counts.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "looking-good-leader",
    "title": "Looking Good, Leader!",
    "description": "Okay but Leader looked good today and someone said it out loud. Unprompted. Logged.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "she-got-everyone-home",
    "title": "She Got Everyone Home",
    "description": "Got her back on the floor. Quiet win. The kind that actually matters.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "nothing-worked",
    "title": "Nothing Worked?!",
    "description": "First time nothing landed on us in front of them. Their faces almost made the paperwork worth it.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "one-less-loose-end",
    "title": "One Less Loose End",
    "description": "Last one who knew too much is closed. Whatever it took. Clean.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "double-o-s-got-this",
    "title": "Double O's Got This",
    "description": "Ran the whole file solo. Allowed. Noticed.",
    "grade": "gold",
    "hidden": false
  },
  {
    "id": "mom-get-the-camera",
    "title": "Mom, Get the Camera!!!",
    "description": "Try trickshotting, Leader! That's a good trick!",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "aura-farming",
    "title": "Aura-Farming",
    "description": "When the other side just… leaves, the reputation is doing the work for you. Like damn, girl... You got so much Aura!",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "absolute-zero",
    "title": "Absolute Zero ✋😌🤚",
    "description": "Live civilian zone. Zero harm. Zero uninvolved. That's not luck — that's the standard.",
    "grade": "gold",
    "hidden": false
  },
  {
    "id": "when-there-s-no-good-option-left",
    "title": "When there's no good option left...",
    "description": "Greenlit the ridiculous option. It worked. Told you.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "come-a-little-closer",
    "title": "Come a Little Closer...",
    "description": "Got the answer with charm instead of force. Still counts. Truth serums did come in handy.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "maid-problems-require",
    "title": "Maid Problems Require...",
    "description": "Finished the job in the apron. No gear. Loud choice. Respect.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "they-re-looking",
    "title": "They're Looking...!",
    "description": "They're packing special loads because of us. Meter's moved. Tier 2.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "the-price-of-knowing",
    "title": "The Price of Knowing",
    "description": "They know. City just got colder. Ledger marks the day.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "nobody-left-behind",
    "title": "Nobody Left Behind",
    "description": "Kept the witness instead of cleaning the board. Long game just changed.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "exception-handling",
    "title": "Exception Handling",
    "description": "Caught the gas, the poison, the height threat — before it reached anyone. That's the discipline.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "first-contact",
    "title": "First Contact",
    "description": "First real professionals who didn't fight like gangsters. Left a mark on the record.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "full-house",
    "title": "Full House",
    "description": "The Gang's all here!",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "potential-woman",
    "title": "Potential Woman",
    "description": "Trusted the civilian who saw too much. Welp, this girl either becomes our greatest asset or Agent 05. Your call, Boss.",
    "grade": "silver",
    "hidden": true
  },
  {
    "id": "the-eighth-cup",
    "title": "The Eighth Cup",
    "description": "Reached the network's heart. Learned the truth. The seat is offered — taking it is optional.",
    "grade": "gold",
    "hidden": false
  },
  {
    "id": "the-river-learns-a-shape",
    "title": "The River Learns a Shape",
    "description": "Found the hidden ladder. Climbed all the way. Optional. Permanent.",
    "grade": "gold",
    "hidden": false
  },
  {
    "id": "ghost",
    "title": "Ghost",
    "description": "No witnesses. No exposure. No trace we were ever there. Highest grade the house gives.",
    "grade": "gold",
    "hidden": false
  },
  {
    "id": "walked-in-as",
    "title": "Walked in as",
    "description": "Walked in under cover that never broke. That's its own kind of perfect.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "death-by-proxy",
    "title": "Death by Proxy",
    "description": "Someone else pulled the trigger and never knew why. Still counts as ours.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "you-get-five-big-booms",
    "title": "You get five big booms...",
    "description": "Five staged explosions in a row and the target still didn't see it coming. R&D is going to be insufferable.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "the-house-special",
    "title": "The House Special",
    "description": "First Special on the board. Any grade. The house just learned what the menu can do.",
    "grade": "bronze",
    "hidden": true
  },
  {
    "id": "patience-of-the-house",
    "title": "Patience of the House",
    "description": "Three or more days of watching before the move. Slowest approach is sometimes the only clean one.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "rsvp",
    "title": "RSVP",
    "description": "Took the target inside their own event. Rude. Also a statement.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "i-didn-t-do-it",
    "title": "I didn't do it.",
    "description": "Environment did the work. No weapons drawn. Official report writes itself.",
    "grade": "bronze",
    "hidden": false
  },
  {
    "id": "three-way-ledger",
    "title": "Three-Way Ledger",
    "description": "Two hostile groups blaming each other. Neither looking at us. Perfect arithmetic.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "the-long-con",
    "title": "The Long Con",
    "description": "Cover identity built across multiple sessions. Slowest weapon in the inventory.",
    "grade": "silver",
    "hidden": false
  },
  {
    "id": "no-second-draft",
    "title": "No Second Draft",
    "description": "Plan A the whole way. Insertion to exfil. Every contingency unused. The plan that never needed a friend.",
    "grade": "gold",
    "hidden": false
  },
  {
    "id": "the-whole-menu",
    "title": "The Whole Menu",
    "description": "Ghost, Silent, and Loud — all three on the board. House serves the full set.",
    "grade": "gold",
    "hidden": false
  }
]

export const TROPHIES: Record<string, TrophySet> = {
  acolytes: { slug: 'acolytes', title: 'Acolytes: Maid for your Protection', trophies: ACOLYTES },
}
