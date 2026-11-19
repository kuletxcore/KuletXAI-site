# KuletX AI: design direction

The home of KuletX's interactive AI stories. Visitors come to pick a world and play it, then binge the series cut from it. The site should feel like switching on a machine that is already running stories: a terminal on the front page, a games console in the story hub.

Dial: ENERGY 3 / RHYTHM 2 / MOTION 2

- **ENERGY 3.** The front page opens on moving story art, a pixel headline and live numbers. It should say hello loudly.
- **RHYTHM 2.** Sections share one frame (kicker, pixel title, short body) but change what sits inside it: a poster shelf, a card table, a playable demo, a two-up series list, a four-door grid.
- **MOTION 2.** Motion shows that the worlds are alive (drifting posters, cover videos, a typing storyteller). It never runs without an off switch.

## Two surfaces, one family

| | Front page | Story hub (`/stories/*`) |
|---|---|---|
| Feel | Terminal booting a storyteller | Console home screen for one world |
| Ground | `void` near-black green with a faint grid | `#030508` near-black blue, the story's art full-bleed |
| Type | Pixel display, mono body | SST (Sony's console typeface) on Plus Jakarta Sans fallback |
| Accent | Neon green | Each story's own `accent` colour |

They share the logo, the rating colours, the sounds and the rule that every control works by touch, mouse, keyboard and gamepad.

## Colour

Front-page tokens live in `src/styles.css` under `@theme`. Ratios are WCAG contrast against the ground they sit on.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `void` | `#050806` | Page ground | |
| `panel` | `#0b120d` | Cards and raised bands | |
| `line` | `#1d3324` | Borders, dividers, the grid | Decorative only |
| `ink` | `#d7f5df` | Body text and titles | 17.3:1 on void |
| `mute` | `#8fb399` | Secondary text | 8.7:1 on void |
| `neon` | `#00ff66` | The accent: primary buttons, kickers, live numbers, the cursor | 14.8:1 on void |
| `warn` | `#ffb800` | 17+ badge, the save-state band | Void text on it 11.6:1 |
| `danger` | `#e5162b` | 18+ badge background, with white text (4.7:1) | Not for text on dark |
| `danger-ink` | `#ff4f5e` | Red text on dark, like the KageSekai link | 5.9:1 on panel |
| `signal` | `#5a6faa` | Highlight: text selection, white on blue | White on it 4.9:1. Only 4.1:1 on void, so never small text |

Rules:

- **Neon is the one accent.** It marks the thing to do next: the primary button, the active choice, the live count. If two neon things compete on one screen, one of them should step down to `ink` or `mute`.
- **Ratings are a traffic light.** SFW is neon, 17+ is amber (`warn`), 18+ is red (`danger`). This applies everywhere a rating appears, and nothing else uses that trio together.
- **Signal blue is a highlight, not a second accent.** It echoes the blue of the logo's "AI". Use it where something is being pointed at or picked out (selection today; a future search-match or note highlight would fit). Keep it as a background behind white text or as a large non-text mark.
- **Glow is rationed.** Only neon accent words inside pixel display titles glow (a soft text-shadow, the `glow` class). Cards, badges and buttons stay matte.

## Type

| Face | Use | Why |
|---|---|---|
| HeadUpDaisy (`font-pixel`) | Display titles, big numbers | Pixel type is the "boot screen" voice. Large sizes only. |
| StrongGamer (`font-gamer`) | Kickers, buttons, labels, badges, small uppercase UI | A tight bitmap face that stays readable small. Keep tracking normal, no extra letter-spacing. |
| Obel Mono (`font-mono`) | Body copy | Monospace body reads as the storyteller's log, which is the site's motif. |
| SST, Plus Jakarta Sans | Story hub | The console surface uses a console face. |

The three pixel and mono faces are under the SIL Open Font License (credited in the footer). **SST is Sony's typeface and is not openly licensed.** It stays by decision: the site is non-commercial and Plus Jakarta Sans is already the declared fallback in `@font-face`, so removing SST would leave the hub readable. Revisit if the site is ever monetised; swapping in an open lookalike then only means changing the `src` list in `src/styles.css`.

## The console, all the way down

The hub's job is to feel like a console, and a console never shows you the browser. Where the illusion breaks, it breaks
all at once — a white overscroll bounce, the OS scrollbar, a neon text selection over black glass. So:

- **The hub owns the browser chrome.** `[data-hub]` (set before first paint by `HUB_HEAD_SCRIPT`) gives the page
  `color-scheme: dark`, a themed thin scrollbar, `overscroll-behavior-y: none` and a neutral selection. It applies to
  the hub and its trophy list, and is removed the moment you leave. The homepage keeps its own look.
- **Covers get art direction, not a shared crop.** Every cover is composed differently, so `Story.crop` carries a focal
  point (`{ x, y }`, percentages) that drives `object-position` on the still and both video layers. The old single
  `center 20%` stays the default, so any art without a focal point does not move.
- **Type is set for a TV.** The story title runs to 84px with `-0.035em` tracking; the selected tile's name runs to 21px
  on desktop. At 1080p the title is the largest thing on screen, which is what makes the screen read as a console.
- **The information card arrives as one object.** The console lifts the whole card on a selection change, so the title
  and pill row hold still while `.ps5-details` moves — otherwise it reads as a website loading in pieces.
- **Every surface has a definition.** `.ps5-panel` is the main reading surface and had no base style at all (it existed
  only inside the short-landscape query). It now has its own radius, padding and the hairline top highlight that makes
  glass read as a raised card.
- **No raw rectangles.** The touch bottom bar was the one place the idiom was abandoned; it now uses `ps5-cta` and
  `ps5-round` like everything else.
- **Loading is designed too.** The hub's `pendingComponent` shows the console's own black with a quiet line, instead of
  the homepage background while the loader waits.

What is deliberately *not* here: depth, 3D transforms and parallax on the ribbon. The backdrop already does the
console's signature 1:1 pan; adding perspective to the tiles is a bigger change than this pass and would need a
frame-budget check on low-end phones before it earns its keep.

## The fold

The first screen has one job: prove the product. So the hero is not a poster and a promise, it is a working console —
a real scene from a real world that types itself in, offers one choice and ends on that world's play button. The rule
that follows from it:

- **The primary button always does the thing.** No "Play" that scrolls to a section that deals a card that has another
  button. The hero's call to action opens the world currently on screen, and names it.
- **Proof before explanation.** The console runs above the fold; what happens after you press play is explained
  further down (`THE LOOP`), once the visitor has already felt it. Never the other way round.
- **No two competing demos.** One scripted surface per page. A second, deeper teaser splits attention and delays the
  hand-off; depth belongs in the world file and the hub, not in a second script.
- **Motion rules apply here too.** Reduced motion, Lite mode and Pause motion all get the scene instantly, with no
  typewriter, and the console never types while the tab is hidden or scrolled away.

## Layout


- One centered column, `max-w-6xl`, 16px side padding on phones and 24px from `sm`.
- Section padding is 64px on phones and 80px from `md`. The hero gets more room on desktop.
- Every section opens with the same frame: a numbered neon kicker (`01 // ...`), a pixel title, one or two lines of body. What follows changes per section, so the page has a frame without being uniform.
- Phones get their own layouts, not shrunk desktop ones: the world grid becomes a swipe shelf with the next card peeking in, and two-column grids stack.
- Posters are 3:4 and never cropped differently from their art.

## Motion

- Motion is there to show that worlds are alive, guide the eye to the next step, or give feedback on a tap.
- **Lite mode** (weak GPUs, low memory, slow devices, Data Saver) drops video, blur and the drifting poster wall. **prefers-reduced-motion** goes further and stops every loop, the cursor blink included. The page must look finished in both states.
- **Anything that loops for more than five seconds has an off switch.** The hero's "Pause motion" button stops the poster wall, the Dealer's scan line, the cursor blink, the live dot and shelf autoplay, and is remembered.
- One-off flourishes (the save band's scan, the Dealer's pulse) run twice, then rest.
- Video loads only when it is about to play: on hover or focus, or when it is the card in view.

## Components

- **Story card.** Poster, rating badge in its traffic-light colour, title, logline, three tags, live counts, an `ENTER` cue. The whole card is the link.
- **Rating badge.** Square, uppercase StrongGamer, colour from the traffic light. No pills, no glow, no dot.
- **Buttons.** Square corners. Primary is neon on void, secondary is a `line` border with `ink` text. An arrow (`→`) only when the action leaves the page or opens a world, never as decoration.
- **CONTINUE band.** Amber, for returning players only, one tap or `R` to resume.
- **Settings switches** (hub panel). Sound, Lite graphics, Dark surfaces. Each switch row is a 44px tap target with a one-line note under it.

## Accessibility floor

- Every control is at least 44 by 44 CSS px from 320px wide up, with space between neighbours.
- Text meets WCAG AA: 4.5:1 normal, 3:1 large. Check against the darkest and lightest part of any art the text sits over.
- Visible focus on everything (2px neon outline on the front page, white in the hub).
- Real elements: actions are `<button>`, navigation is `<a href>`. No clickable `div`s.
- Pointer cursor on every enabled control, not-allowed on disabled ones.

## Voice

- Second person. Stories are played as **you**, the player's own character (BYOC: bring your own character).
- Colossus Protocol and Acknowledge Me are written about **her**.
- Short sentences, concrete nouns, no hype words, no em dashes.
- Numbers on the site are live from IsekaiZero, KageSekai and Trimz, or not shown at all.

## Not this site

Blue-to-purple gradients, glass on every surface, pill-shaped everything, decorative status dots, emoji in UI text, fake testimonials or stats, macOS window dots on the terminal, motion that cannot be stopped.
