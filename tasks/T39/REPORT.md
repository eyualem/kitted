# T39 · Report

The implementer and the verifier write the rest of this file. The test writer adds only to Disputes.

## Disputes

**Re-lock 1 (test writer, 2026-11-10, at the coordinator's request): retiring the old birth-year tests.** The implementer may not edit tests, and the approved spec (`specs/onboarding-screens.md` OS3–OS4; DECISIONS-LOG #412–#413) removes the behaviour these tests pinned, so after the build they would fail or pin removed code. Each was retargeted, or retired only where a named T39 test holds the same promise under the new spec:
- `birthYearStep.test.ts` BY1 (source text of the birth-year card): retired. Its promise (only the age is asked, no height, build or fit; one layout for setup and Restore) is held by `T39-setupScreens` › `OS4.1 · on open: …` and `SY4.1 · the name comes first and is optional`, both strengthened to assert no "Height", "Build", "Fit you like", "Fitted", "Regular" or "Relaxed" (and Restore's same five radio rows).
- BY2 (source text: Continue waits for a year, hint while none): retired → `OS4.1 · on open: …` and `OS4.1 · one tap picks, another moves the pick`.
- BY3 (source text: under 18 asks once, then the Keychain lock): retired → `OS4.4 · Under 18 asks once with the new title`, `OS4.4 · That's right locks the app`, and `F1.2 · nothing picked, then the stop`. The under-18 stop stays asserted.
- `onboardingAccount.test.ts` "fills on Consent (step 4)": retargeted to "fills on About you (step 3)" (`ONBOARDING_STEPS` 3, "Step 3 of 3"); red now (4 ≠ 3).
- `youTonight.test.ts` YT6 "the birth-year row reads …": retired (YT6's "Score my fits" hint check kept) → `T39-styleProfile` › `OS4.6 · Name, Fit you like, Age, and the footnote` and `OS4.6 · an older profile shows the band from its birth year`.
- `heightBuildRemoved.test.ts` HB3's last line (`profile.tsx` matching `onb.basics.birthYear`): retired; the rest of HB3 kept → `OS4.6 · Name, Fit you like, Age, and the footnote`.

No test was loosened: three source-text checks of removed code were replaced by rendered tests that already existed in the lock, and two of those were strengthened.

**OS4.7's synced-kv clause, narrowed (accepted by the coordinator).** "For every key in `KV_SYNCED`, its outgoing value for a stored value containing the name and band contains neither" can't hold for keys with no `outgoing` (they send whatever is stored). The test checks every synced key's outgoing value for the values the app actually holds mid-setup and after `finishSetup`. The wording in TESTING.md now says so.
