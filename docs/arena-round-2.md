# Arena round 2: what was kept

Ten `arena/*` branches and the Google AI Studio repo (`kuletxcore/KXAI-Gemini`, Gemini 4 Hydrogen) were reviewed on 19 Nov 2026 against `test` at `78d98bc`. Most ran a "make it better" prompt: look at the whole repo, then ship one bold change for conversions, intuitiveness, speed and feel.

Each candidate was built in its own worktree, served locally and screenshotted at 1440×900 and on a Pixel 7. The merged result was then checked in full and Lite mode on desktop and phone. Phone numbers use the OPPO F11 profile: 360×780 at 3×, CPU 4× slower, full graphics, first visit, median of three runs.

## Results

| | Phone: page height · blocked main thread · first-load transfer |
|---|---|
| baseline (`test`) | 7,642 px · 211 ms · 2,140 KB |
| **merged** | 6,673 px · 168 ms · 1,714 KB |

All candidates built cleanly, with no runtime errors on the home page or the hub.

## Branch by branch

| Branch | What it does | Verdict |
|---|---|---|
| `fbc5d3da` Hero is the product | The hero becomes a console that types a real scene, takes one choice and ends on that world's play button. THE LOOP explains the rest further down; the separate Teaser section goes. | **Kept** |
| `0dee4dce` Hardening, tests, CI | Safe SSR headers, a script-free CSP on story cards, a stricter `/api/ost`, an error page and 404, Vitest (27 tests), CI, sitemap and robots.txt | **Kept** |
| `36fb533a` Hub polish | A focal point per cover, dark browser chrome on hub pages, larger console type, a base style for `.ps5-panel` | **Kept** |
| `6794a07a` KX://FIND | `/` or Cmd-K search across worlds, series and channels, loaded as a lazy chunk | **Kept**, without the hero command bar |
| `69214571` Ten conversion ships | Playable first turn, finder, Matchmaker, ranked and filtered shelf, Session Dock, Challenge Mode, Quick Peek, saved worlds, Speed Run, a closing screen | **Lazy Dealer, content-visibility and live badges kept**, rest dropped |
| `fbd584c0` Five conversion ships | The first five of the ten above | Dropped (covered by `69214571`) |
| `5f701eb9` Readable by any model | `llms.txt`, `llms-full.txt`, `llms.json`, a Markdown mirror per story, JSON-LD; plus a "first beat" panel on every story's overview | **Machine layer kept**, first beat dropped |
| `3766e60b` The command layer | Its own finder, a header command bar with an on-air ticker, quick look, For You, a Trimz cinema, story radio, a poster maker, a phone thumb dock, a controls sheet | **Controls sheet, poster maker and Trimz cinema kept**, rest dropped |
| `1b2e6163` Cold open | A playable hero with six new hand-written scenes | Dropped (superseded by `fbc5d3da`) |
| `1f8d9f89` The Arcade | A mini-game per world, launched from the hub | Dropped |
| `KXAI-Gemini` | A hero "cartridge" carousel, an Audition modal, a PS5 story trial in the hub, shelf filters, and teaser scripts for all seven worlds | Dropped |

## What was added, and why

- **The playable hero (`fbc5d3da`).** The site's best argument, a scene you play, was the fifth section down. Now it's the first thing you see, and the hero's main button opens the world that's on screen. It reuses the canon scripts already in `src/data/demo.ts`, so no new story text came in. Moving the Teaser up also ends the two-demos problem: one scripted surface per page.
- **Hardening and tests (`0dee4dce`).** Low risk and high value: the story cards come from remote HTML, so a CSP that blocks scripts is cheap insurance; `/api/ost` now times out and only forwards valid byte ranges; a thrown loader shows an error page instead of a blank screen. The tests guard the parts most likely to break quietly: the OST allowlist, the live-count maths, gamepad detection and asset paths in `content.ts`.
- **Hub polish (`36fb533a`).** Each cover is cropped on its own subject instead of one shared `center 20%`, and the browser chrome no longer breaks the console look (light scrollbar, white overscroll, neon selection).
- **The finder (`6794a07a`).** Seven worlds fit on one screen, but a cold visitor doesn't know which one they want. Typing "kaiju" or "comedy" gets them there. The hero command bar was dropped because the hero now holds the console; the header FIND button and `/` remain.
- **Speed (`69214571`).** The Dealer pulls in the motion library, so it now loads once you're within 900px of it, and the sections below the fold skip layout until they're near. Together with the Teaser leaving, that's most of the 426 KB saved.
- **Live badges (`69214571`).** "Most played" and "Most saved" come from the live counts, so they can't drift from the truth.
- **Readable by models (`5f701eb9`).** Answer engines are a real discovery channel for AI stories. Everything is generated from the same data as the pages, so it can't drift. Its own `robots.txt` and sitemap were dropped for the `0dee4dce` ones, which already covered them.
- **Controls sheet (`3766e60b`).** The site works with a keyboard and four kinds of controller, and until now that was invisible. `?` (or Controls in the footer) shows every shortcut with the prompts of the pad you have plugged in.
- **Poster maker (`3766e60b`).** A share card drawn on the device, with live counts, is the cheapest way to turn a player into an advert. The hub's share row gains a card button.
- **Trimz cinema (`3766e60b`).** The series section was two plain cards. It now runs the cover reel beside the slate, off in Lite mode and with Pause motion, and the slate reads live episode and view counts.

## Fixed on the way in

- `machine.ts` named a host that doesn't exist (`kuletx-core.workers.dev`) and built its own play links without the IsekaiZero referral; both now come from `storyUrl`, and the IsekaiZero creator link carries the referral. Its `/creator/kuletxcore` links and its note that storyline ids match on both platforms were right all along and are kept.
- The Trimz cinema's slate printed the baked-in counts, not the live ones.
- The cold open's glow is off in Lite mode, which has no blur effects.
- The controls sheet's close buttons were 36px; they're 44px now. Its finder row said "from anywhere on the site", but the finder is on the home page only.
- `36fb533a` recorded the SST font as kept because "the site is non-commercial". DESIGN.md now says it stays by the owner's decision, with Plus Jakarta Sans as the fallback.
- Long header comments and decorative banners in the arena files were cut to one or two lines; em dashes came out of DESIGN.md and the README.

## What was left out, and why

- **The Arcade (`1f8d9f89`).** Eight mini-games and 2,100 lines. It's inventive, but it's a second product inside the hub, and every game is new canon nobody has checked against the storylines. Worth its own round if you want it.
- **The other playable heroes (`1b2e6163`, `69214571`'s First Turn, Gemini's cartridge and Audition modal).** One hero console is the rule. `fbc5d3da` won because it reuses the canon scripts; `1b2e6163` wrote six new scenes, and Gemini added teaser scripts for every world, including the 18+ one, none of them checked against the stories.
- **The Matchmaker, Session Dock, Challenge Mode, Quick Peek, saved worlds and closing screen (`69214571`), and For You, quick look, the on-air ticker and the thumb dock (`3766e60b`).** Each is reasonable alone; together they would give a seven-world site a dock, a ticker, a matchmaker, a dealer and a continue band all asking for the same tap. The World Dealer stays as the "I can't decide" answer and the CONTINUE band as the returning-player one. The thumb dock also linked to the Teaser section, which no longer exists.
- **Shelf filters and sorting (`69214571`, Gemini).** Two rows of ten buttons for seven worlds; the finder already filters by rating and vibe.
- **The poster wall diet (`69214571`).** Cutting each row to two copies leaves a visible gap at the end of the loop on wide screens (seven tiles are about 1,200px against a 2,160px band), and the images are cached anyway, so it saved DOM nodes, not bytes.
- **The first beat (`5f701eb9`).** A second "take a turn" panel on every story page, one tap from the platform button that does the real thing.
- **Story radio (`3766e60b`).** The hub already plays each world's OST.
- **Gemini repo extras.** It also dropped the font preloads in `__root.tsx` and set `allowedHosts: true` on the dev server; neither came across.

## After the merge

Changes made on `test` after the picks landed, from your testing and a repo review.

**Controls and controllers**
- The controls sheet lists actions, not devices. Each row shows the keys and the connected pad's buttons that do it, using Xelu keyboard sprites (`?`, Esc, Ctrl, ⌘, K, 1, 8, Tab). ⌘ shows on a Mac and Ctrl elsewhere. The pack's "Slash" key is a backslash, so `/` stays a text key.
- On a touch screen the sheet says "touch", hides the keyboard rows and shows a touch note.
- `KeyLabel` gained a keyboard-only mode, so a keyboard R never draws a Switch R shoulder.
- The sheet crashed with a pad connected: the D-pad arrows went through the button lookup. Fixed.
- The sheet dropped two home-page rows that described shortcuts the page never had (arrow keys along the shelf, Space to scroll).
- **The home page takes a controller** (`src/components/home-pad.tsx`, `src/lib/spatial.ts`):
  - The D-pad moves focus to the nearest control, and the left stick scrolls.
  - A selects, B backs out, X opens Find, Y toggles sound, LB/RB jump between sections, and Start opens the controls sheet.
  - Inside the finder and the sheet, the pad drives the dialog.
  - A legend shows the buttons while a pad is connected.

**Share cards**
- The Trimz tab draws a card for that series (poster, summary, episodes, views), with its own world's accent and rating. Before, it drew whichever story the hub had last shown.
- The cover was drawn unclipped and ran on under the title; it now stays in its box.
- The stats sit in equal columns that shrink to fit, so "messages" is no longer cut off.
- The tags use the mono face.
- The footer prints the host the card was made on instead of a hardcoded `kuletxai.whop.site`.

**Depth on the hub ribbon** (asked for on PR #10)
- Tiles turn away from the selected one and step back with distance; the selected one comes forward and leans toward a mouse.
- It's off in Lite mode and under reduced motion, and the lean stops under Pause motion.
- Frame-budget check on the OPPO F11 profile: median 16.7 ms and p95 33 ms per frame, the same as the flat row.

**Copy that went stale with the new layout**
- The Dealer now says the 18+ world is in the grid "above".
- The finder's teaser entry opens the hero scene; it linked to a `#try` section that no longer exists.

**From the repo review**
- Story cards had no CSP: Cloudflare's `_headers` allows one `*` per rule, so `/isk/*/cards/*` never matched. Now `/isk/:story/cards/*`, verified on test.
- The card sanitiser in `scripts/build_isk.py` also strips:
  - HTML comments, `srcdoc` and `formaction`
  - script schemes in any URL attribute, whether quoted, unquoted or entity-encoded
  - script-capable CSS inside `style` attributes and `<style>` blocks

  `scripts/test_build_isk.py` holds 25 hostile fixtures. Re-syncing every story changed no card beyond dropping HTML comments.
- The review guessed that the edge cache fails on workers.dev. It works there; it's Whop that misses, serving most stats requests straight from the platform APIs. Upstream fetches are now cached by Cloudflare for ten minutes, and `/api/isk-stats` reports `x-kx-cache` so this can be confirmed on Whop after its next deploy.
- New unit tests cover spatial focus, prompt resolution, GT NX halves and the llms/Markdown layer: 43 in all, up from 27.
- `scripts/smoke.mjs` loads home and hub in a browser, in full and Lite mode on desktop and phone. It checks that:
  - the finder and the controls sheet open
  - the D-pad moves focus
  - in-page links resolve
  - the Markdown mirror answers

  CI runs it along with the Python tests. It passes against the live test site.
- `npm run deploy` goes through `scripts/deploy-whop.sh`, which refuses a dirty `wrangler.jsonc` and restores it after `whop apps deploy`.
- The origin helpers are now one, `publicOriginOf`.
- The hub's chrome (sound menu, switches, clock, share button, icons) moved to `src/components/hub-chrome.tsx`, taking the route from 2,355 to 2,105 lines.

## Housekeeping

- The arena branches can be deleted on GitHub once this is on `test`.
- `KXAI-Gemini` can be deleted: nothing in it is needed.
