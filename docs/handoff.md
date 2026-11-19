# Handoff: the command layer (Nov 2026)

Ten changes on `arena/3766e60b-kuletxai-site`, one commit each. They share one idea: the site should be commandable, should answer with what it remembers, and should never be two taps from a world it already knows you want.

| # | Change | Where | What to check |
|---|---|---|---|
| 1 | Story Finder | `src/lib/finder.ts`, `src/components/story-finder.tsx`, mounted in `__root` | `Cmd/Ctrl + K` and `/` open it on every page; a query like `kaiju`, `rin`, `episode 3` or `mute` finds rows; `Enter` opens, `Shift + Enter` plays, `Esc` closes |
| 2 | Command bar header | `src/components/site.tsx` | The neon PLAY goes to the loudest world's platform page; the finder sits beside it; 320px still fits |
| 3 | ON AIR strip | `OnAir` in `src/routes/index.tsx` | Three world links under the header, live message counts, no 18+ surprise |
| 4 | Card PLAY + quick look | `Stories` in `src/routes/index.tsx`, `src/components/quick-look.tsx` | Every card has `PLAY` (platform, new tab) and `World file`, and the cover has `+ INFO` |
| 5 | For You | `src/lib/taste.ts`, `src/components/for-you.tsx` | Open a hub, come back: a pick with a reason; ✕ forgets it; first-time visitors see nothing |
| 6 | Trimz cinema | `Trimz` in `src/routes/index.tsx` | Reel runs in view, stops in lite or paused motion; the slate switches the screen |
| 7 | Story Radio | `src/components/story-radio.tsx` | Silent until pressed; tracks switch without reloading the element; works in lite |
| 8 | Poster maker | `src/lib/share-card.ts`, `src/components/share-card.tsx` | Hub action row, camera-ish icon: preview, Save PNG, Share |
| 9 | Thumb dock | `src/components/thumb-dock.tsx` | Phones only, five slots, active section tracked on scroll, footer not covered |
| 10 | Controls sheet | `src/components/controls-sheet.tsx`, footer and finder command | `?` opens it; pad rows follow the connected controller |

## Notes for the next pass

- No browser was available in the session that wrote this, so every change was checked by `npm run typecheck`, `npm run build` and server-rendered HTML, not by eye. The two worth looking at first are the Trimz cinema's phone crop and the poster maker's type, which are the only places the layout is computed rather than declared.
- The finder's index is static except for the commands. Videos come from `YT_SNAPSHOT`; if `loadYoutubeVideos()` has fresher titles at runtime, feeding them in would be a small win.
- Taste is local only: `kx_taste`, 180 days, cleared by the ✕. It never leaves the browser, so it cannot be used for a server-side recommendation.
- `content-visibility: auto` is on the radio and channels sections (`.kx-lazy`). If a future section is anchor-targeted and jumps short, raise `contain-intrinsic-size` there.
- The dealt card's spring is now CSS (`.kx-dealt`); `motion` stays for the hub and the boot screen.
