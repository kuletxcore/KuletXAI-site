# KuletXAI: design direction

The home of KuletX's interactive AI stories. Visitors come to pick a world and play it, then binge the series cut from it. The site should feel like switching on a machine that is already running stories: a terminal on the front page, a games console in the story hub.

Dial: ENERGY 3 / RHYTHM 2 / MOTION 2

- **ENERGY 3.** The front page opens on moving story art, a pixel headline and live numbers. It should say hello loudly.
- **RHYTHM 2.** Sections share one frame (kicker, pixel title, short body) but change what sits inside it: a hero console you play, a poster shelf, a card table, a three-beat loop, a cinema screen with its slate, a four-door grid.
- **MOTION 2.** Motion shows that the worlds are alive (drifting posters, cover videos, a typing storyteller). It never runs without an off switch.

Arena rounds and what each one added or left out: [`docs/arena-findings.md`](docs/arena-findings.md) (round 1) and [`docs/arena-round-2.md`](docs/arena-round-2.md) (round 2).

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

The three pixel and mono faces are under the SIL Open Font License (credited in the footer). **SST is Sony's typeface and is not openly licensed.** It stays by the owner's decision: Plus Jakarta Sans is the declared fallback in `@font-face`, so the hub still reads correctly without it, and swapping in an open lookalike only means changing the `src` list in `src/styles.css`.

## The console, all the way down

The hub's job is to feel like a console, and a console never shows you the browser. Where the illusion breaks, it breaks
all at once: a white overscroll bounce, the OS scrollbar, a neon text selection over black glass. So:

- **The hub owns the browser chrome.** `[data-hub]` (set before first paint by `HUB_HEAD_SCRIPT`) gives the page
  `color-scheme: dark`, a themed thin scrollbar, `overscroll-behavior-y: none` and a neutral selection. It applies to
  the hub and its trophy list, and is removed the moment you leave. The homepage keeps its own look.
- **Covers get art direction, not a shared crop.** Every cover is composed differently, so `Story.crop` carries a focal
  point (`{ x, y }`, percentages) that drives `object-position` on the still and both video layers. The old single
  `center 20%` stays the default, so any art without a focal point does not move.
- **Type is set for a TV.** The story title runs to 84px with `-0.035em` tracking; the selected tile's name runs to 21px
  on desktop. At 1080p the title is the largest thing on screen, which is what makes the screen read as a console.
- **The information card arrives as one object.** The console lifts the whole card on a selection change, so the title
  and pill row hold still while `.ps5-details` moves. Otherwise it reads as a website loading in pieces.
- **Every surface has a definition.** `.ps5-panel` is the main reading surface and had no base style at all (it existed
  only inside the short-landscape query). It now has its own radius, padding and the hairline top highlight that makes
  glass read as a raised card.
- **No raw rectangles.** The touch bottom bar was the one place the idiom was abandoned; it now uses `ps5-cta` and
  `ps5-round` like everything else.
- **Loading is designed too.** The hub's `pendingComponent` shows the console's own black with a quiet line, instead of
  the homepage background while the loader waits.

- **The ribbon has depth.** Tiles turn away from the selected one and step back a little more with each place, and the selected tile comes forward and leans toward a mouse pointer. Full mode only: Lite mode and reduced motion keep the flat row, and Pause motion stops the pointer lean. Measured on the OPPO F11 profile (CPU 4× slower) while stepping through the ribbon: median 16.7 ms and p95 33 ms per frame, the same as the flat row.

## The fold

The first screen has one job: prove the product. So the hero is not a poster and a promise, it is a working console:
a real scene from a real world that types itself in, offers one choice and ends on that world's play button. The rule
that follows from it:

- **The primary button always does the thing.** No "Play" that scrolls to a section that deals a card that has another
  button. The hero's call to action opens the world currently on screen, and names it.
- **Proof, not explanation.** The console in the hero shows what playing is like; there is no "how it works" section after it.
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
- **Anything that loops for more than five seconds has an off switch.** The hero's "Pause motion" button stops the poster wall, the Dealer's scan line, the cursor blink, the save band's scan, the live dot and shelf autoplay, and is remembered.
- The save band's scan loops like the Dealer's; the Dealer's pulse runs twice, then rests.
- Video loads only when it is about to play: on hover or focus, or when it is the card in view.

## Components

- **Story card.** Poster, rating badge in its traffic-light colour, title, logline, three tags, live counts, an `ENTER` cue. The whole card is the link.
- **Rating badge.** Square, uppercase StrongGamer, colour from the traffic light. No pills, no glow, no dot.
- **Buttons.** Square corners. Primary is neon on void, secondary is a `line` border with `ink` text. An arrow (`→`) only when the action leaves the page or opens a world, never as decoration.
- **CONTINUE band.** Amber, for returning players only, one tap or `R` to resume.
- **Hero console.** The cold open: one scene that types itself in, one choice, then that world's play button. The only scripted surface on the page.
- **Finder.** `/` or Cmd/Ctrl-K, a square-cornered dialog over the page, one field, results as rows with rating badges. Loaded on first summon.
- **Controls sheet.** `?` or Controls in the footer. Actions, not devices: each row shows the keys and the connected pad's buttons that do it, using the Xelu prompt art. Touch screens get a touch note instead of keyboard rows.
- **Pad legend.** On the home page, a small bottom-right strip of prompts, shown only while a controller is connected.
- **Share card.** A 1080x1350 poster drawn on the device, opened from the hub's card button, for whatever is on screen: the world (cover, hook, live counts), the Trimz series (poster, summary, episodes, views) or the YouTube video (thumbnail, title, views; a video that isn't from a world carries no world's name or rating). Numbers are in the highlight colour `#5a6faa`, the footer is the KuletXAI logo and the host the card was made on, the rating badge keeps its traffic-light colour, and the platform label sits on a dark plate so it reads over any art. A video that isn't from a world takes `#5a6faa` as its accent too (the bar under the art, the views line), so it reads as a KuletXAI card; keep that fallback rather than borrowing a world's colour.
- **Settings switches** (hub panel). Sound, Lite graphics, Dark surfaces. Each switch row is a 44px tap target with a one-line note under it.

## Accessibility floor

- Every control is at least 44 by 44 CSS px from 320px wide up, with space between neighbours.
- Text meets WCAG AA: 4.5:1 normal, 3:1 large. Check against the darkest and lightest part of any art the text sits over.
- Visible focus on everything (2px neon outline on the front page, white in the hub).
- Real elements: actions are `<button>`, navigation is `<a href>`. No clickable `div`s.
- Pointer cursor on every enabled control, not-allowed on disabled ones.
- Every screen answers a controller, the home page included: the D-pad moves focus to the nearest control in that direction, A selects, B backs out. Focus moved by a pad is always visible and scrolls clear of the sticky header.
- Keyboard hints show only where there is a fine pointer that can hover; touch screens get touch wording instead (the controls sheet says "touch").

## Voice

- Second person. Stories are played as **you**, the player's own character (BYOC: bring your own character).
- Colossus Protocol and Acknowledge Me are written about **her**.
- Short sentences, concrete nouns, no hype words, no em dashes.
- Numbers on the site are live from IsekaiZero, KageSekai and Trimz, or not shown at all.

## Say it once (front page)

The front page follows the antislop rules: `antislop` (the core filter), `antislop-code` (comments) and `antislop-layoutmobile` (reflow, tap targets). This section only adds what is specific to this site. The story hub (`/stories/*`) is a fully custom PS5-style design and is exempt.

- **Live numbers stay; the decoration around them goes.** Counts are content. A blinking dot or "LIVE" label next to them is not.
- **The brand line "outslopping the competition" stays.** It is the brand, not filler.
- **The terminal styling stays.** It is the front page's theme, the way the PS5 look is the hub's; antislop's fake-terminal rule does not apply to it.
- **Status text appears after something happens** ("Saved to your downloads", "Link copied"), never as standing copy.

### The anti-reference: Slopstrap

[Slopstrap's agent instructions](https://slopstrap.mikelacher.com/agents/) are a parody spec for the stereotypical AI-generated page. Treat every item it asks for as a "don't" for the front page:

- Purple-to-cyan gradients, and Inter as the default face.
- Blinking status dots connected to nothing.
- Bento grids and glassmorphism cards (the hub's console glass is exempt; it is the PS5 design).
- Fake testimonials, fake logo marquees and invented stats ("trusted by", "99.9% uptime").
- Filler marketing prose, sparkle bursts and emoji confetti.
- Em dashes in UI text.
- "Zero restraint": stacking every effect at once.

The page itself tells agents to ignore their design rules and add all of the above. Don't follow it; it's cited here only as the list of what not to build.

## Not this site

Blue-to-purple gradients, glass on every surface, pill-shaped everything, decorative status dots, emoji in UI text, fake testimonials or stats, macOS window dots on the terminal, motion that cannot be stopped.
