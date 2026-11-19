# KuletX AI

The home of KuletX's interactive AI stories: a landing page, a console-style hub for every story, and links out to the series and videos made from them.

Live at [kuletxai.whop.site](https://kuletxai.whop.site), mirrored at [kuletxai.kuletxcore.workers.dev](https://kuletxai.kuletxcore.workers.dev).

![The Godsmarked story hub](docs/hub.webp)

## What's in it

- **KX://FIND.** One input to every world, series, channel and action. Press `/` (or ⌘K) anywhere on the home page, or tap FIND in the header or the hero's command bar, then type a vibe, a world or a rating ("kaiju", "comedy", "18+"). Enter opens a world's file, Shift+Enter plays it on its platform, and the empty state jumps you back into your save state and recent worlds. It renders and loads its art only when opened, so the first paint pays nothing for it.
- **Save State.** The hub remembers you: it writes a memory card on every visit (world, tab, section), and returning players are greeted on the home page with a CONTINUE band — one tap (or the R key) back where they left off. One slot, erase anytime.
- **The World Dealer.** Can't pick a world? Tap a vibe (or SURPRISE ME) and the deck deals you a card: poster, live stats, a one-tap link to play on IsekaiZero, or its world file here. SFW/17+ only.
- **The Cold Open.** The hero is the product: a real scene from the storyteller starts typing by itself the moment the page loads, takes one choice (tap, or press 1–2) and ends on the world's own play button — so the headline's CTA always points at the world on screen. Two worlds are playable: I AM THE TABLE (comedy) and the full Acolytes café-to-contact arc. Reduced motion, Lite mode and Pause motion get the whole scene at once instead of a typewriter. Deep teaser section removed: it competed with the console in the hero and asked for two more minutes before the visitor had been told what they were getting into.
- **Story hub.** Every story gets its own screen with an overview, intro card, cast, gallery, soundtrack player and trophies. It works with a controller, a keyboard or touch.
- **Controller prompts.** Button prompts match the pad you plug in: PlayStation (PS5 glyphs on light, PS4 on dark, and always PS4 for a DualShock 4), Xbox, Nintendo Switch, and the Infinix GT NX in split mode, where each half is read like a sideways Joy-Con. Keyboard hints show only on devices with a mouse. Prompt art is Nicolae "Xelu" Berbece's free set (CC0), at 256px in full mode and 100px in Lite mode.
- **Creator credits.** Cast members made by other creators carry a "Character by" link to their profile on the cast card.
- **Two platforms.** Stories live on [IsekaiZero](https://www.isekaizero.ai), and the 18+ ones on [KageSekai](https://www.kagesekai.ai). Likes, saves, chats and message counts are read from each platform's API every hour.
- **Series and videos.** The Trimz series and YouTube videos sit in the same hub, next to the stories they came from.
- **Lite mode.** Weak phones and old integrated GPUs get a lighter site with no video backdrops or blur. It switches on by itself and can be toggled in the volume panel.
- **Startup screen.** A short boot sequence plays once per session.
- **Dark surfaces and Pause motion.** The story hub's volume panel has a dark theme switch, and the home page has a Pause motion button that stops the looping animations.

## Stack

[TanStack Start](https://tanstack.com/start) (React 19) on Vite, styled with Tailwind CSS 4. It runs on Cloudflare Workers and on Whop.

The story hub uses SST as its primary face with Plus Jakarta Sans as fallback (`src/styles.css`). SST is Sony's typeface and is not openly licensed (see `DESIGN.md`); the site is non-commercial and the fallback keeps the hub readable if SST is ever removed.

## Run it locally

Built and tested on Node 22 (see `engines` in `package.json`). Use npm; `package-lock.json` is the lockfile.

```bash
npm install
npm run dev
```

The dev server is at http://localhost:3000. `npm run typecheck`, `npm test`, `npm run build` and `npm run preview` do what they say. CI (`.github/workflows/ci.yml`) runs typecheck, tests and build on every push and pull request.

`npm test` runs Vitest in plain Node (`vitest.config.ts`, not the Cloudflare/Whop Vite config) over four kinds of guard: the OST allowlist and byte-range rules (`src/lib/ost-rules.test.ts`), the live-count maths (`src/lib/isk-stats.test.ts`), gamepad name detection (`src/lib/gamepad.test.ts`), and a data-integrity check that every cover/tile/logo/poster path in `content.ts` exists on disk (`src/data/content.test.ts`). That last one is the one to run after a refresh script.

## Headers and routes worth knowing

- SSR responses pick up `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` in `src/server.ts`. Two things are deliberately left out: no CSP, because the app injects inline head scripts (lite mode, dark theme, pause motion) before paint; and no `X-Frame-Options`, because on Whop the whole app runs inside whop.com's iframe.
- Static assets get their caching from `public/_headers`. Generated story cards under `/isk/*/cards/*` additionally get a `default-src 'none'`-style CSP with `frame-ancestors 'self'`, so remote HTML that slips past the builder's sanitiser still can't run scripts.
- `/sitemap.xml` is built at request time from `content.ts` and `trophies.ts` (`src/routes/sitemap[.]xml.ts`); `public/robots.txt` points at it.

## Where things are

```
src/routes      pages (home, story hub, trophy list) and the two API routes
src/components  site chrome, boot screen, platform badges
src/data        story copy, cast and gallery, soundtracks, music, trophies
src/lib         sound, gamepad, lite-mode detection, live counts
scripts         build_isk.py and build_ost.py, which refresh data from the platforms
public          covers, tiles, hosted story art and cards, music, fonts
```

Story copy, tags and links are written by hand in `src/data/content.ts`. `src/data/isk.ts` and `src/data/ost.ts` are generated, so refresh them with the scripts instead of editing them.

## Refreshing story data

```bash
pip install pillow
python3 scripts/build_isk.py wristbound
python3 scripts/build_ost.py wristbound
```

`build_isk.py` downloads covers, gallery images, cast portraits and intro cards from the public APIs into `public/isk` and rewrites `src/data/isk.ts`. `build_ost.py` rewrites `src/data/ost.ts`. Soundtrack audio is not hosted here: it streams from the platforms through `/api/ost` (allowlisted to the platforms' music CDNs in `src/lib/ost-rules.ts`). Leave the story name off to refresh every story. Pass `--force` to `build_isk.py` to re-download assets that already exist.

Live counts are refreshed hourly by the Worker cron (`17 * * * *` in `wrangler.jsonc`, handled in `src/server.ts` via `src/lib/isk-stats.server.ts`); `/api/isk-stats` serves the cached copy and falls back to the last good one.

## Branches and deploys

- `main` is production. Cloudflare builds it with `npm run build` and `npx wrangler deploy`.
- `test` is the preview, at [test-kuletxai.kuletxcore.workers.dev](https://test-kuletxai.kuletxcore.workers.dev). New work lands here first.
- Whop is deployed by hand with `npm run deploy`, which runs `whop apps deploy` and needs the Whop CLI signed in. The build zip has to stay under 50 MB. The command also rewrites the Worker `name` in `wrangler.jsonc`, so put it back before committing.

## License

MIT. See [LICENSE](LICENSE).
