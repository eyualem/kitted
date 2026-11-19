# T116 · Kit types before it speaks

Size: normal. Spec: `specs/setup-and-you.md` SY2.12–SY2.18 (added with the founder's yes in chat, Nov 18, quoting the brief). Log #514.

## What he sees
- After setup: Setup slides away, Kit's three dots show about 0.9 s, `I'm Kit, your stylist.` lands, about 0.6 s later the "Want to check a fit now?" card arrives with one soft tap.
- After his first scored check: the same dots, then "Want outfit ideas from your own clothes? This part is optional.", then its card a beat later (no tap). The paywall now opens 4 s after the post (it was 2.5 s) so it still follows the card.
- Never on normal answers or the morning card. Reduce Motion: a still "…" then fades. VoiceOver: "Kit is writing", then the line.
- No word changed. `Quick note: I'm an AI…` is not in the app today (SY2.1), so there is one hello beat, not two.

## What was built
- `stylist/arrival.ts`: `BEAT`, `beatKindOf`, `arrivals.findBeat` / `beatBegan` (pure).
- `stylist/useTypingBeat.ts` (new): holds rows, runs the timers, one Soft haptic, VoiceOver announcements.
- `stylist/KitTypingRow.tsx` (new): the dots row ("Kit is writing").
- `stylist/StylistScreen.tsx`: wires them in. `finish/service.ts` tags the moves line; `finish/sequence.ts` `PAYWALL_AFTER_MS` 4000.
- Demo screens 287 (hello after setup) and 288 (after first score), `fresh` flag in `demo/`.
- Tests: `T116-typingBeat.test.tsx` (10), one line in `onboardingFinish.test.ts`.

## Proof (iOS Simulator, iPhone 17 Pro, frames about 0.3 s apart)
`strip-hello-dark.png`, `strip-hello-light.png`, `strip-hello-reduce-motion.png`, `strip-moves-dark.png`.
Not verified: the haptic itself (the Simulator has none; the test checks the call), VoiceOver speech (the test checks the announcements), a real phone, largest text.
