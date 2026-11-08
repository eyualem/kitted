# T14 · The beta's limits: report

## Test changes (test writer)
Written by the coordinator from the test writer's hand-back, because the harness stopped the test writer from writing this file.

- **An existing test changes on purpose.** In `firebase/tests/api.test.ts`, L7 "the beta default is Pro when the config is missing" becomes "the beta default is beta when the config is missing or its tier is unknown".
  - **Why:** FP7 (the founder, Nov 8; DECISIONS-LOG 399) replaces the old rule that a missing tier gives Pro's limits.
  - **What it checks now:** with no config doc, and with `tier: 'gold'`, three checks pass with `x-kitted-tier: beta`, and a 4th new check id gets `429 {error:'limit', which:'checks'}`.
  - **Stronger, not weaker:** the old test only checked that 2 checks passed. L7's "10 checks and 52 questions" test is unchanged.
- **Stubs that throw `T14: not built`:**
  - in `app/src/services/server/tier.ts`: `parseTier`, `fallbackTier`, `appTier`, `tierNow`, `onTierChange`, `setDemoTier`, `resetTierForTests`; `ServerTier` now includes `'beta'`;
  - in `app/src/services/quota.ts`: `limitsFor`, `questionLimitText`, and the `PlanTier` type; `QuotaDeps.serverTier` returns `ServerTier | null`.
- **Disputes:** none.

## Built (implementer)
**What changed, in plain words.** The server has a third set of rules, `beta` (3 fit checks, each with its re-check, and 20 questions a day), and it is now the default when `server/config` has no tier or an unknown one. The phone reads `x-kitted-tier: beta`, remembers it, and before the server's first answer uses the build's fallback (`beta` while the paywall isn't built). On beta: a 4th photo is held under the beta limit card (`That's today's 3 fit checks.` · `I'll save this photo and score it after 4 am.` · one button, `Save for tomorrow`); the saved card drops the "free check" sentence; the 21st question gets `That's 20 questions today. More at 4 am.` with no Try Pro; the Stylist subtitle has no check line; You's Today card reads `Today` · `resets at 4 am` · `{c} of 3 fit checks left · {q} of 20 questions left`; Plan & usage and Settings read `Kitted beta` with `3 fit checks and 20 questions a day · resets at 4 am` and no Manage button; the morning card's used line is `Your fit checks reset at 4 am.`; and the paywall switch reads false, so no soft page, Try Pro, Restore or Subscription section opens. Free and Pro behave as before.

**Files.**
- Server: `firebase/functions/src/api/limits.ts` (`Tier` gains `beta`, `TIERS.beta`), `firebase/functions/src/api/store.ts` (`DEFAULT_CONFIG.tier = 'beta'`, parses `'beta'`).
- Tier: `app/src/services/server/tier.ts` (`parseTier`, `fallbackTier`, `appTier`, `tierNow`, `onTierChange`, `setDemoTier`, `resetTierForTests`; `serverTier` and `tierRecorder` keep the in-memory tier), `app/src/services/server/transport.ts` (`parseTier` on the header).
- Quota: `app/src/services/quota.ts` (`tier` on the snapshot, `LIMITS.beta*`, `limitsFor`, `questionLimitText`, no check line on beta), `app/src/features/fitcheck/session.ts` (`serverTier: () => appTier(store)`).
- Paywall gate: `app/src/features/paywall/switch.ts` (`paywallOn` false on beta; `usePaywallOn` re-renders on a tier change).
- Words: `app/src/i18n/en.ts` (7 keys in `addedInBuild`).
- Cards and screens: `app/src/features/held/content.ts`, `app/src/features/held/LimitCard.tsx` (beta card and saved card; testIDs `limit-card`, `held-card`, `limit-card-save`, `limit-card-pro`, `held-card-dont-score` on wrapping Views), `app/src/features/settings/plan.ts` (`{ kind: 'beta' }`, its status and short name; `hasPro` is Pro or trial only), `app/src/features/settings/usePlan.ts`, `app/src/app/(tabs)/you/plan.tsx` (Manage only with `hasPro`; `plan-status` wrapper), `app/src/app/(tabs)/you/index.tsx` (Today card's beta branch; Try Pro only on free; `you-today` wrapper), `app/src/features/ask/pipeline.ts`, `app/src/features/morning/MorningCard.tsx`.
- Demo: `app/src/demo/scenarios.ts`, `app/src/demo/applyDemoScreen.ts`, `app/src/demo/prepareDemoScreen.ts`.

**Deviations.** None outside the Files list. One choice inside it, for the test writer's note: on a beta screen the scenario's `freeChecksUsed` is written as today's real check count (in `prepareDemoScreen`) instead of pinning `checksUsedOverride`, so screen 252 counts the flow's photos and holds the 4th. A link's own `freeChecksUsed` still pins it; free screens are unchanged. Screens 256–258 load the seed as of 12:04 (before its two 12:05/12:09 questions) so their questions start at 0, as the UI inventory says (`0 of 20`, `20 of 20 questions left`).

**Demo screens.** 252 Beta · Stylist home (0 used, counts real checks) · 253 Beta · Limit card · 254 Beta · Limit card, saved · 255 Beta · Questions used up · 256 Beta · Plan & usage · 257 Beta · You · 258 Beta · Settings · 259 Beta · Morning card, checks used. Every older screen sets `tier: 'free'` before its story; a missing screen clears the demo tier.

**Results.** `betaLimits.test.ts` 22 of 22 pass. Full app suite: 1648 passed, 4 skipped (123 suites passed, 3 skipped). `tsc --noEmit` clean; `expo lint` 0 errors (1 old warning in `tryOn.test.ts`); `@kitted/core` typecheck clean and 853 of 853 tests. Server on the emulator: 79 of 79 (`api.test.ts` 62, including `FP7 the beta` and the changed L7). `npm run check` was run step by step, because jest can't reach watchman in this environment (`unable to talk to your watchman ... Connection refused`); jest ran with `--no-watchman`.

**Not done.**
- Not checked on the Simulator or the web preview (light, dark, largest text) and the Maestro flow not run: the Mac had about 90–300 MB free with 6–7 GB compressed, and another session's Simulator was booted. The verifier runs them.
- On a dev build with the direct Gemini key (`LIVE_READING`), `session.ts` still pins checks to 0 when no `freeChecksUsed` is set (the founder's testing override), so screen 252 would never hold a 4th photo there. Run the flow on a Metro without the dev key (this worktree has no `.env`).
- Flow risk, for the verifier: the Stylist title is one accessible element (`Stylist, 1 photo waiting to score`), and You's Today card one (`Today. resets at 4 am. …`). If Maestro matches only whole labels, the flow's `assertVisible: "1 photo waiting to score"` and the Today-card `scrollUntilVisible` texts may not match; that is the existing markup, not changed here.

## Disputes (implementer)
- **Test:** `app/e2e/flows/T14-beta-limits.yaml`, after the 20 questions: `extendedWaitUntil: visible: "0 questions left today"` (line 90–92).
- **Why it looks wrong:** at that point the flow has already saved the 4th photo for tomorrow, so a photo is waiting. The spec keeps the waiting photo first: FP7, "Stylist subtitle: no check line (a waiting photo and `{n} questions left today` keep their priority as built)", and IMPLEMENTATION.md's interface: "on beta, `{ key: 'stylist.quota.held' }` when `heldCount > 0`; else `{ key: 'stylist.quota.questions', n }`". So the subtitle reads `1 photo waiting to score`, and this step waits 10 s and fails. The flow's own earlier step (`assertVisible: "1 photo waiting to score"`) agrees with the spec.
- **What it should say:** wait on something true at that moment, for example `extendedWaitUntil: visible: "1 photo waiting to score"` (or tap `Don't score it` before the questions and keep `0 questions left today`). The 21st question's line and You's `0 of 3 fit checks left · 0 of 20 questions left` already prove the 20 were counted. Not built around: the subtitle follows the spec.
