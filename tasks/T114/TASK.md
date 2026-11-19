# T114 · About you nudges for the name, with a small Skip

**Size:** normal (CLAUDE.md: the session builds it with tests, then one separate reviewer). **Spec:** `specs/onboarding-screens.md` OS4 (items 3 and 6, OS4.1, OS4.2), `specs/setup-and-you.md` SY4 / SY4.1, `specs.md` F1 step 3 and F1.4, all changed on the founder's Nov 18 instruction ("let us make adding a name mandatory", then "Nudge, small Skip"; log #497). Built in the T113 branch (PR #146) because he asked for it before that merge.

## Plan
- The name stays optional (Apple App Review 5.1.1(x)); setup makes skipping it deliberate.
- `BasicsScreen.tsx`: the field has `autoFocus` and asks for focus again `FOCUS_AFTER_PUSH_MS` (450 ms) after the screen is focused (iOS drops a focus asked for mid-push); Continue needs a name (trimmed, not blank) and an age; one hint, the name's first; `Skip` (ghost, regular) under Continue while the name is blank, off with no age, doing what Continue does. Restore unchanged (age only, no Skip).
- `en.ts`: `First name`; `onb.about.nameHint` `Add your first name to go on.`; `onb.about.skip` `Skip`; `onb.about.skipHint` `Goes on without a name.` (VoiceOver). Drafts for the founder.

## Tests (retargeted to the new rule, none loosened)
- `T39-setupScreens`: OS4.1 on open (placeholder, autoFocus, the name hint, Continue off with it, Skip off with the age hint); one tap picks (an age without a name: Continue off, Skip on; a name: no hint, no Skip; spaces only: no name); new: the focus after the push (and none on Restore); new: a name without an age gives the age hint; OS4.2 (blank and spaces-only go on only by Skip, saving no name); OS4.4 and F1.2 reach the Under 18 check by Skip, and by Continue with a name; SY4.1 (Skip under Continue, drawn once, goes on with no name; Restore has no Skip); OS3.2, OS4.3, F1.1's walks type a name.
- `T39-styleProfile`: the shared placeholder `First name`.
- `T113-styleGameScreens` F1.1: the walk types a name (not a tap); still 16 presses.
- Flows: `T39-setup-fresh` types the name (18 taps), `T39-setup-later` and `T39-setup-not-now` use Skip, `T39-screens` checks Skip on screens 3 and 4. The hint is hidden from VoiceOver, so Maestro can't see it; the render tests check it.

## What was built and checked (Nov 18)
- jest `--runInBand`, 14 suites (every T39 file, T113, looksOwnWords, scenarios, copyChecks, syncSchema, privacyWipe, toast): 212/212. `tsc` and eslint clean.
- Planted: the delayed focus removed → the focus test goes red. Removing the Restore guard is equivalent (Restore has no field to focus).
- iOS (a Release bundle of this code on 111D0A09): `T39-setup-fresh` (a typed name, 18 taps), `T39-setup-later`, `T39-setup-not-now` pass; `T39-screens` passes every About you check, then stops at screen 282's "Turn on fit checks" (inherited, fails on a bundle from before T113). The field shows the caret on open and the typed letters go straight in.
- Shots: `shots/about-open-light.png`, `about-age-no-name-light.png`, `about-typed-light.png`, `about-open-dark.png`, `about-open-ax5.png`.

## Not verified
- That the software keyboard rises on its own: the Simulator showed the caret (the field has focus) but kept the on-screen keyboard down until typing, as it does with a hardware keyboard connected. A phone check (Y48).
- With the keyboard up, 26–30 and 31 or older sit under it until he taps the keyboard's ✓ or scrolls (one extra tap for those two bands).
