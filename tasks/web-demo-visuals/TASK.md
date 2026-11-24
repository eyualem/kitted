# web-demo-visuals: icons and components missing in the web demo

Normal task (small fix to existing screens). Proof is screenshots in `shots/` (before: the main checkout's Metro; after: this branch).
Web build only; iOS code paths are unchanged.

## What was wrong, and the fix
| Missing on the web | Cause | Fix (web only unless noted) |
|---|---|---|
| Every icon (tab bar, composer camera, chevrons, the + / history buttons, arrows, check marks) | `expo-symbols` draws SF Symbols; it has no web renderer, so `Icon` drew an empty box | `Icon.web.tsx`: each symbol name drawn as a small SVG glyph (59 names); test `iconWeb.test.ts` checks every `symbols.ts` name and every raw name the app passes has one |
| Composer text "Ask Kit…" | the browser's textarea sat under the capsule's absolutely positioned background (z-order), and was two rows tall | `Composer.tsx`: on web only, `position: 'relative'` and one row (undefined on iOS) |
| Closet badge "4" | iOS NativeTabs draws it; the web tab bar never had one | `(tabs)/_layout.web.tsx`: read-only badge from the same count (not `useClosetArrivals`: that also starts Closet's first-visit slide) |
| Card / photo showing around the tab bar | content scrolls under the floating bar and nothing lenses it | `(tabs)/_layout.web.tsx`: a flat strip in the page color behind the bar |
| Round glass behind the header buttons (history, +) | iOS draws it around header items | web-only white circle in `stylist/_layout.tsx` (guarded by `Platform.OS === 'web'`) and `closet/AddMenu.tsx` (never used on iOS) |
| "+0…" cut off in Why this score | the value text shrank on web (Yoga's default on iOS is no shrink) | `Ledger.tsx`: `flexShrink: 0` on the value (same as iOS's default) |

## Not changed (left on purpose)
- The composer's mic: dictation isn't available on the web, so the mic is correctly absent.
- Large titles on Closet / Lookbook / You, and sheets as full pages: the web stack has no large title or sheet presentation.
- Fonts: the score digits use SF on iOS, the browser's sans on the web.
- Closet takes ~20–40 s to draw in the dev web build when its pane is in the background (its data reloads several times while the demo seeds). Check on the exported Pages build.

## Verified
Screens 1, 2, 7, 8, 10, 12, 15, 16, 17, 25 (the site's picker, plus 10), light and dark: `shots/after-*`; before shots `shots/before-*` (light, the four screens that show the problems).
`npm run check` pieces: `tsc` shows only the 4 known `phoneInstall.test.ts` errors; `expo lint` 0 errors; `jest --no-watchman` 3035 passed. No iOS Simulator screenshot (not taken: see PR).
