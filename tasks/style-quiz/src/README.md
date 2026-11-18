# The style-game mockup's source

`../design.html` is built from these parts. Never edit `design.html` by hand: edit a part, then run

```bash
node tasks/style-quiz/src/build.js
```

To publish, pass a second path (for example in your scratchpad), and publish that file with the Artifact tool:
`node tasks/style-quiz/src/build.js <scratchpad>/style-picker.html`. The founder's shared link
(https://claude.ai/artifact/2L9asQuz69pg45ohUatmZm) is updated only from main, after a merge; a branch publishes its own
private preview link.

| Part | What's in it | Owner |
|---|---|---|
| `logic.js` | the 8 looks' names and lines, the order the cards come in, how each game (A bracket, B threes, D Me / Not me + rank) turns taps into a top 3 | the fairness work (`style-game-fair` in plan.md) |
| `drawings.ts` → `drawings.json` | each look's two outfits, drawn by the app's own code (`app/src/features/onboarding/looks.ts` and `closet/flats.ts`), plus Tailored's two suits | the fairness work |
| `../quiz_sim.py` | the $0 simulation of each game | the fairness work |
| `page.html` | the page's CSS (the app's colors as tokens, light and dark) and the words around the phones | the design work (`style-game-design`) |
| `views.js` | every screen inside the phones, the gestures (swipe, drag), the page's tabs and theme switch | the design work |

`design.html` is generated: if two branches both change it, take either side and re-run `build.js`.

**Regenerating the drawings** (only after changing `drawings.ts`); the worktree has no `node_modules`, so use the main
checkout's esbuild:

```bash
/Users/eyu/Desktop/files/Kitted/app/node_modules/.bin/esbuild tasks/style-quiz/src/drawings.ts --bundle --platform=node --format=cjs --alias:@=./app/src --alias:@kitted/core=./app/packages/kitted-core/src/index.ts --outfile=/tmp/drawings.js --log-level=error && node /tmp/drawings.js > tasks/style-quiz/src/drawings.json
```

**Viewing it:** the Browser pane's `preview_start` with `name: "mockups"` serves the repo on port 8095; open
`http://localhost:8095/tasks/style-quiz/design.html#d`. Add `?v=<anything new>` after a rebuild: reopening the same address
doesn't reload the page.
