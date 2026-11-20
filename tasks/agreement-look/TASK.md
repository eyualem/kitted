# agreement-look (normal)

**Why:** the founder, Nov 19: testers "don't think that it's an agreement. It blends in. It looks like a tutorial." Spec: `specs/setup-and-you.md` SY5 (rewritten with his yes), F1.3 unchanged.

**Decision:** option B of three drawn options (retitle only / document / document plus checkbox); no `See an example first` button (DECISIONS-LOG 521).

## What was built
- `app/src/features/onboarding/ConsentScreen.tsx`: a `Privacy agreement` title bar with the X; the lead; one bordered panel `Kitted privacy agreement` with four numbered clauses (no icons, clause words unchanged); the footer path; `Read the full Privacy Policy` (only when `PRIVACY_URL` exists; today null, so hidden); the line `By tapping Agree and continue, you agree to this privacy agreement.` above `Agree and continue` and `Not now` (same size). The save, decline, hold-a-photo and nothing-sent-before-Agree logic is untouched.
- `app/src/i18n/en.ts`: new `onb.consent.title/lead/panelHeader/agreeLine/policy`; `agreeLater` is now `Agree and continue`; `footerPath` now says `You → Privacy & data` (Settings' page went in T34).
- Tests retargeted, not weakened: `T39-offerCard`, `T39-setupScreens` (new words; OS5.2 also pins the panel header, the numbered clauses and the agree line); Maestro flows `T39-setup-fresh` and `T39-setup-not-now` (not run: they need a built app on the Simulator).

## Where it differs from the drawn frame
`Read the full Privacy Policy` sits in the scrolling part under the footer path, not in the dock, so large text can't squeeze the buttons off screen. Hidden today anyway.

## Proof
Screenshots in `shots/` (web preview, layout only, the icon-font X draws blank on web): `before-light`, `before-dark`, `after-light-top`, `after-light-bottom`, `after-dark-top`. Not verified on the iOS Simulator (the dev build was on its launcher screen) or at the largest text size.

## Review

### Round 1 (normal)
- SY5.1, SY5.2: done. `finish`, `save`, `decline`, `close` and the held-photo drop are unchanged in the diff (only the layout and strings moved); nothing is sent before Agree.
- SY5.3: done. Title, lead, panel header, four numbered clauses (clause words unchanged), footer path, agree line match the spec word for word; no icons, no emoji, no all-caps; privacy wording unchanged.
- SY5.4: done in code (two `KButton`s, same size, none pre-selected, no example button). 44 pt height not measured on a device.
- SY5.5: done. `Read the full Privacy Policy` only when `PRIVACY_URL` exists.
- SY5.6: can't tell. Light and dark (web) show nothing clipped and the dock on screen. The largest text size and the iOS Simulator were not checked; the dock now holds three items, so check that the panel still scrolls and the buttons stay on screen. Would tell: Simulator at the largest Dynamic Type, light and dark.
- Tests and flows: only the words changed (and OS5.2 gained checks); no assertion was dropped, no `.only` or `.skip`. Maestro regexes are full-match, so `Agree and continue` and `Privacy agreement` do not collide with the agree line or the panel header. Flows not run.
- Accessibility: header roles on the title and panel header; each clause is one element labelled `1. <title> <body> <bullets>`; the X keeps its Close label in a 44 pt box.

Defects: none open. Verdict: **ready**.

Small things, never blocking:
- `onb.consent.header` ("Before your first fit check") is now unused (still in the generated strings).
- OS5.2's numbered-clause check uses `getAllByText('1')`, so it could match other text; a clause-label check would be tighter.
- A real-device look at the X and the title bar balance is still worth doing.
