import type { MiniGame } from '#/lib/minigame'
import { AcolytesGame } from './acolytes'
import { ColossusGame } from './colossus'
import { QueenBeeGame } from './queenbee'
import { SpawnerGame } from './spawner'
import { TableGame } from './table'
import { GodsmarkedGame } from './godsmarked'
import { WristboundGame } from './wristbound'
import { TrimzGame } from './trimz'

/**
 * Every launchable mini-app, in the order they appear on the shelf. `storySlug` ties a game to a world so the hub can
 * offer the one that belongs to the page you are on; `TrimzGame` is the odd one out (series flavour, no world file).
 */
export const GAMES: MiniGame[] = [
  {
    slug: 'i-am-the-table',
    name: 'LOAD-BEARING',
    tagline: 'You are the table. Keep it level.',
    premise:
      'You died on a Tuesday and came back as furniture. People put things on you without asking, and the Rotting King is monologuing on your surface.',
    how: ['Something new lands on you every second', 'Lean left / right to stay level', 'Topple and the whole room notices'],
    Component: TableGame,
  },
  {
    slug: 'acolytes',
    name: 'THE FRONT',
    tagline: 'Serve the coffee. Clear the floor. Never both at once.',
    premise:
      'By day this is a maid café. After hours it is a licensed private security outfit. One button flips between the two faces of the job.',
    how: ['Orders want Service. Threats want Force', 'Flip faces with Space', 'Anything that times out is a scene'],
    Component: AcolytesGame,
  },
  {
    slug: 'colossus-protocol',
    name: 'THE SHIFT',
    tagline: 'Big enough. Not bigger.',
    premise:
      'You can grow to three hundred metres. Growth is a resource and the cost is resonance burn, so the win is discipline, not size.',
    how: ['Grow or shrink to match the target', 'Commit inside the band — too big burns you out', 'Hold the line without overheating'],
    Component: ColossusGame,
  },
  {
    slug: 'queen-bee',
    name: 'STATUS',
    tagline: 'Everyone wants something. Read it.',
    premise:
      'Kingsmere runs on status, and the Queen Bee’s seat is empty. Every person you meet wants one of three things; give them the wrong one.',
    how: ['Three moves per encounter, one right answer', 'Standing carries between halls', 'Four encounters, then the verdict'],
    Component: QueenBeeGame,
  },
  {
    slug: 'problem-spawner',
    name: 'CONTAIN IT',
    tagline: 'The roll never asks first.',
    premise:
      'Something appears every few seconds and it is permanent. You cannot choose what rolls — only what you spend containing it.',
    how: ['Containment is a budget, not a health bar', 'Every roll costs more than you have', 'Anything left loose stays loose'],
    Component: SpawnerGame,
  },
  {
    slug: 'godsmarked',
    name: 'BORROWED',
    tagline: 'Save people. Do not be seen doing it.',
    premise:
      'A cancelled comic’s costume bonded to you and it will not come off. Every power is borrowed, and the city remembers a bright light.',
    how: ['Power drains on its own', 'Quiet hands are cheap and unreliable', 'Full divinity always works and always gets seen'],
    Component: GodsmarkedGame,
  },
  {
    slug: 'wristbound',
    name: 'ONE HOUR',
    tagline: 'The right body, before the hour runs out.',
    premise:
      'The artifact gives you a form for an hour and takes it back. Every job needs a different body, and a wrong one costs the same as a right one.',
    how: ['Read the job, pick the form', 'The hour does not pause', 'Wrong bodies still cost you the hour'],
    Component: WristboundGame,
  },
  {
    slug: 'trimz',
    name: 'THE CUT',
    tagline: 'Pick the beat the episode ends on.',
    premise:
      'The Trimz series exist because somebody chose which four seconds matter. Three clips, four beats each: find the moment.',
    how: ['Each clip has one beat worth ending on', 'Establishing shots are never the answer', 'Three clips, then the render queue'],
    Component: TrimzGame,
  },
]

export const gameFor = (slug: string) => GAMES.find((g) => g.slug === slug)
