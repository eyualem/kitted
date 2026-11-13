# kit-arrives: Kit's messages fade and rise in

Normal task, from the founder's words in chat (Nov 12). No spec file; the log entry is #458.

## Plan
Kit's new messages in the Stylist thread fade in while rising 8 pt (250 ms, 100 ms apart), a plain fade with Reduce Motion. Only messages he hasn't seen move; his own, and Past chats, never do.

## What was built
- `app/src/features/stylist/arrival.ts`: which rows move (pure, 15 tests in `kitArrives.test.ts`).
- `app/src/features/stylist/arrivalMotion.ts`: the look (a cached `entering` per delay).
- `StylistScreen.tsx`: the row wrapper is an `Animated.View` with `entering`; rows wait for the thread to be on screen; `stylist.seenUntil` read once and written on blur and when the app leaves the front.
- `state/session.ts`: `LAUNCHED_AT`. `sync/schema.ts`: the new kv key is this phone's only.

## Review
One separate reviewer read the diff. Fixed: a row moved again on every remount (now marked drawn), Reduce Motion gave no fade at all (Reanimated skips it by default; now forced on). Taken on as a design point: a message landing while he's on another tab now waits until he's back. Left alone: a hung kv read would blank the thread (kv reads don't hang here); demo builds' clock starts at 7:30 am each launch (use `-demoNow real`).

## Proof (Release build on the Simulator, bundle from this branch, `-demoNow real`)
`shots/`: `light-` and `dark-entrance-frames.png` (Kit's first message, then the card, from a fresh setup), `*-reopen-frames.png` and `*-reopened.png` (the same thread after a relaunch: nothing moves), and short recordings. Not shown: a new Kit reply, the morning card, the live answer's hand-over to its stored row, Reduce Motion on the device, VoiceOver. The first two are covered only by the pure tests.
