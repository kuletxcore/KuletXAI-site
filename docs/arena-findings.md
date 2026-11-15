# Arena branches: what was kept

Five `arena/*` branches were reviewed on 15 Nov 2026 against `test` at `698ea1f` (main plus the Grok merge: SST font, Wristbound twelve-knots copy and cards, dark surfaces behind a switch). Each was built in its own worktree, served locally and checked at phone and desktop width. Phone numbers use the OPPO F11 profile: 360×780 at 3×, CPU 4× slower, full graphics, first visit.

`claude-merged` is `test` plus the picks below.

## Results

| Branch | What it does | Phone: page height · blocked main thread · first-load transfer | Verdict |
|---|---|---|---|
| baseline (`test`) | current site | 5,126 px · 91 ms · 2,171 KB | |
| `5992c893` World Dealer | Pick a vibe or SURPRISE ME, get one world dealt with poster, live stats and a play link | 6,280 px · 169 ms · 2,188 KB | **Kept** |
| `a0895a00` The Teaser | Scripted, playable storyteller demo (I AM THE TABLE, the Acolytes café-to-contact arc) ending in a link to the real story | 6,482 px · 150 ms · 2,190 KB | **Kept** |
| `9188cbec` Console home | Rebuilt landing as a console home screen, plus SAVE STATE / CONTINUE and a BYOC "passport" | 6,342 px · 221 ms · 2,356 KB, LCP 640 ms (2× baseline) | **CONTINUE kept**, rest dropped |
| `1f6271c5` Spotlight + mobile pass | Spotlight hero, pinned full-bleed shelf, 44px tap targets, tablet states, plus MCP config, CLAUDE.md, skills and an older Wristbound copy | 4,408 px · 263 ms · 2,561 KB | **Header/footer tap targets kept**, rest dropped |
| `e29ea42a` Immersive home | Full PS5-style homepage on top of the Grok branch | 4,531 px · 320 ms · **6,950 KB** | Dropped |
| **`claude-merged`** | baseline + the picks | 7,668 px · 165 ms · 2,219 KB | |

All five built and type-checked. None had runtime errors or sideways overflow at 360, 768 or 1024 px.

## Why

**Kept**

- **SAVE STATE / CONTINUE** (`9188cbec`, commit `2f1ff3c`). Returning players get one tap, or R, back to the exact world and section they left. It writes one small localStorage entry, is not mounted for first-time visitors, and stays still in lite mode and for reduced motion. Checked: after visiting Godsmarked's gallery, CONTINUE returned to `/stories/godsmarked?section=gallery`.
- **World Dealer** (`5992c893`). It solves "which world do I play?" in one tap. The deck is SFW and 17+ only, and its copy points to the 18+ world "in the grid below", so it sits above the story grid. Cost: the Motion library on the home page, about +70 ms of main-thread time on the slowed phone.
- **The Teaser** (`a0895a00`). It is the only change that lets a cold visitor feel the storyteller before signing up. Placed after the story grid instead of above it, so phones are not scrolling past two big sections to reach the worlds.
- **44px header and footer links** (from `1f6271c5`, commit `d1442b8`, `site.tsx` only). Measured 44px tall from 320px to desktop, and the bar still fits at 320px.

**Dropped**

- **Three competing homepage rebuilds.** `9188cbec`, `1f6271c5` and `e29ea42a` each replace the hero and shelf in a different way, and only one could win. None beat the current hero (poster wall, living posters, swipe shelf) on cost:
  - `9188cbec` doubles time to largest paint (640 ms) and hides the site's pitch behind a single featured world.
  - `1f6271c5`'s spotlight hero clips the headline at 360px ("you pla…", "on Trim…") and adds about 1,400 lines of CSS.
  - `e29ea42a` downloads about 7 MB on a phone's first visit, including three full videos (a story cover and both Trimz trailers) before any tap, and on desktop it never stops loading.
- **BYOC passport** (`9188cbec`). It is stored only on the visitor's device and cannot reach IsekaiZero or KageSekai, so the character never makes it into a story.
- **Repo setup in `1f6271c5`** (`.mcp.json` rewrite, `docs/mcp.md`, `scripts/mcp-tools.mjs`, CLAUDE.md, antislop skills). These are not site changes, so they belong in their own branch if wanted. No real keys were committed: the 21st key is a `${TWENTY_FIRST_API_KEY}` placeholder.
- **The older Wristbound refresh in `1f6271c5`.** It is superseded by Grok's twelve-knots copy, which is already on `test`.

## Worth revisiting

- The spotlight hero's tablet layout and the coarse-pointer pill sizing in `1f6271c5` are good ideas, but they are tied to its own hero and shelf components.
- `e29ea42a`'s PS5 look would be viable if its videos loaded only on interaction, as the living posters do.
