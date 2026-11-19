# KuletX AI

The home of KuletX's interactive AI stories: a landing page, a console-style hub for every story, and links out to the series and videos made from them.

Live at [kuletxai.whop.site](https://kuletxai.whop.site), mirrored at [kuletxai.kuletxcore.workers.dev](https://kuletxai.kuletxcore.workers.dev).

![The Godsmarked story hub](docs/hub.webp)

## What's in it

- **Save State.** The hub remembers you: it writes a memory card on every visit (world, tab, section), and returning players are greeted on the home page with a CONTINUE band — one tap (or the R key) back where they left off. One slot, erase anytime.
- **The World Dealer.** Can't pick a world? Tap a vibe (or SURPRISE ME) and the deck deals you a card: poster, live stats, a one-tap link to play on IsekaiZero, or its world file here. SFW/17+ only.
- **The Teaser.** A scripted, playable teaser of the AI storyteller embedded on the landing page — I AM THE TABLE (comedy) and the full Acolytes café-to-contact arc (warm café register into the tactical brief) — branching choices, keyboard picks, and a deep link into the real storyline at the end. No account needed.
- **The Arcade.** Every world page carries a launchable mini-app in the console idiom: a title card, then a twenty-second game whose mechanic *is* the premise — Acolytes makes you juggle café service and violence with one button, Colossus is a size-and-burn discipline test, I AM THE TABLE is a load-bearing balance game, Queen Bee is reading what each faction wants, The Problem Spawner is containing permanent chaos on a budget, Godsmarked is spending borrowed divinity without being seen, Wristbound is wearing the right form before the hour runs out, and The Cut is choosing which beat a Trimz episode ends on. Each run ends on a rank (S–D), keeps your best score per world, and hands you straight to the real storyline. Launch from the tile under the logline, or link straight in with `?play=<slug>`; Escape backs out.
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

## Run it locally

Built and tested on Node 22.

```bash
npm install
npm run dev
```

The dev server is at http://localhost:3000. `npm run typecheck`, `npm run build` and `npm run preview` do what they say.

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

`build_isk.py` downloads covers, gallery images, cast portraits and intro cards from the public APIs into `public/isk` and rewrites `src/data/isk.ts`. `build_ost.py` rewrites `src/data/ost.ts`. Soundtrack audio is not hosted here: it streams from the platforms through `/api/ost`. Leave the story name off to refresh every story.

## Branches and deploys

- `main` is production. Cloudflare builds it with `npm run build` and `npx wrangler deploy`.
- `test` is the preview, at [test-kuletxai.kuletxcore.workers.dev](https://test-kuletxai.kuletxcore.workers.dev). New work lands here first.
- Whop is deployed by hand with `npm run deploy`, which runs `whop apps deploy` and needs the Whop CLI signed in. The build zip has to stay under 50 MB. The command also rewrites the Worker `name` in `wrangler.jsonc`, so put it back before committing.

## License

MIT. See [LICENSE](LICENSE).
