# T14 · The beta's limits: 3 fit checks and 20 questions a day, no paywall, no price, no "Pro"

**From:** `plan.md` → T14 · **Spec:** `specs/free-and-pro.md` → FP7 (approved by the founder Nov 8), and "What counts" · **Lane:** Free and Pro (plus the server's `firebase/functions/src/api/{limits,store}.ts`, named on the plan line)

## Goal
A friend on the beta gets 3 fit checks (each with its re-check) and 20 questions a day; a 4th photo is held with the beta limit card, the 21st question gets the beta line, You → Plan says `Kitted beta`, and he never sees a paywall, a price, the word "Pro", "free check" or "trial".

## Files
Only these. Anything else is a deviation the implementer writes in REPORT.md.

**Named on the plan line (in the lane):**
- `firebase/functions/src/api/limits.ts`: a third tier `beta` (3 checks, 3 re-checks, 20 questions).
- `firebase/functions/src/api/store.ts`: the config accepts `tier: 'beta'`; the default (no or unknown `tier` in `server/config`) becomes `beta`.
- `app/src/services/server/tier.ts`: the `beta` tier, the build's fallback tier, a synchronous "tier now" with change listeners, and a demo override.
- `app/src/services/quota.ts`: the snapshot's `tier`, the beta limits, no check line on beta, the question-limit line per tier.
- `app/src/features/held/content.ts`, `app/src/features/held/LimitCard.tsx`: the beta limit card and the beta saved card; testIDs.
- `app/src/features/settings/plan.ts`: a `beta` plan kind, its status card and short name; `hasPro` excludes beta.
- `app/src/features/paywall/switch.ts` (lane folder `paywall/`): `paywallOn()` is false whenever the tier is `beta`.
- `app/src/i18n/en.ts` (shared): the new strings, in `addedInBuild`.

**Outside the lane (each a minimal edit; the coordinator must OK them, see Open questions T-1):**
- `app/src/services/server/transport.ts`: accept `x-kitted-tier: beta` (today it drops anything but `free`/`pro`).
- `app/src/features/fitcheck/session.ts`: the quota's `serverTier` dep becomes `() => appTier(store)` (one line).
- `app/src/features/ask/pipeline.ts`: `limitLine` takes its words from `questionLimitText(snapshot)` and shows Try Pro only on `tier === 'free'` (two lines).
- `app/src/features/settings/usePlan.ts`: passes the tier into `currentPlan` (and re-renders on a tier change).
- `app/src/app/(tabs)/you/plan.tsx`: Manage only when `hasPro(plan)`; a testID wrapper on the status card.
- `app/src/app/(tabs)/you/index.tsx`: the Today card's beta branch (no "1 free check today", no Try Pro); a testID wrapper.
- `app/src/features/morning/MorningCard.tsx`: the "checks used" line on beta (today `Your free check resets tomorrow`; words pending, Open question F-1).
- `app/src/demo/scenarios.ts`, `app/src/demo/applyDemoScreen.ts`, `app/src/demo/prepareDemoScreen.ts`: a `tier` field per demo screen (default `free`, so every existing screen looks as it does today) and the new beta screens 252–259.

Not touched: `firebase/functions/src/api/handler.ts` (it already sends `x-kitted-tier: <config.tier>` and passes `config.tier` to `reserve`), `features/fitcheck/service.ts` (a beta snapshot has `pro: false`, so the existing free path holds the photo and offers it after 4 am), `features/finish/` (its `paywallOn` dep is the gated switch), the copy deck `handoff/02-screens.md` and `en.generated.ts`.

## Interfaces
What the tests call. The test writer reads only this section.

### Server (`firebase/functions/src/api/`)
- `limits.ts`: `export type Tier = 'free' | 'pro' | 'beta'`.
- `limits.ts`: `TIERS.beta = { checks: 3, rechecks: 3, questions: 20 }`. `free` and `pro` are unchanged (`free` 1/1/5, `pro` 10/10/50).
- `limits.ts`: `reserve(day, 'beta', route, opts)` follows the existing rules with beta's numbers: a 4th new `full` check id in a day → `{ ok: false, which: 'checks' }`; re-checks never more than the checks counted that day (at least 1, for a re-check across 4 am) and never more than 3; questions stop at `20 + QUESTION_SLACK` (= 22), the 23rd → `{ ok: false, which: 'questions' }`; taps free up to 10. `photoCallBudget('beta') = 60`, `askCallBudget('beta') = 96`.
- `store.ts`: `Config.tier: Tier`. `DEFAULT_CONFIG.tier = 'beta'`. `firestoreStore(db).config()` returns `tier` = the doc's `tier` when it is `'free'`, `'pro'` or `'beta'`, else `'beta'`.
- HTTP (unchanged shape): with `server/config` `{ tier: 'beta' }` or no `tier`, every 200 carries `x-kitted-tier: beta`; a refused call is `429 { "error": "limit", "which": "checks" | "rechecks" | "questions" | … }`.
- Writes (unchanged): a beta reservation writes only `usage/{uid}/usageDays/{day}` (and `usage/{uid}` `{ tz, tzChangedAt }` on a time-zone change). No lifetime field anywhere.

### Phone: the tier (`app/src/services/server/tier.ts`)
- `export type ServerTier = 'free' | 'pro' | 'beta'`.
- `export const SERVER_TIER_KV = 'server.tier'` (unchanged).
- `export function parseTier(v: unknown): ServerTier | null`: `'free' | 'pro' | 'beta'` → itself; anything else → `null`.
- `export async function serverTier(store): Promise<ServerTier | null>`: the stored tier or `null` (unchanged meaning; now also `'beta'`). Updates the in-memory "known" tier.
- `export function fallbackTier(): ServerTier`: `PAYWALL_BUILT ? 'free' : 'beta'` (reads `@/config/features`; no edit there).
- `export async function appTier(store): Promise<ServerTier>`: demo override ?? stored ?? `fallbackTier()`.
- `export function tierNow(): ServerTier`: synchronous; demo override ?? the last known tier (read or recorded) ?? `fallbackTier()`.
- `export function onTierChange(cb: () => void): () => void`: called when the known tier or the override changes; returns the unsubscribe.
- `export function setDemoTier(tier: ServerTier | null): void`: the demo screen's tier (null = none). Notifies listeners.
- `export function resetTierForTests(): void`: clears the known tier and the override (tests only; the module keeps state).
- `export function tierRecorder(store): (tier: ServerTier) => void`: as today (writes `SERVER_TIER_KV` only on a change), now accepts `'beta'`, and updates the known tier and notifies.
- `transport.ts`: `ServerTransportOptions.onTier?: (tier: ServerTier) => void`; a 200 with `x-kitted-tier: beta` calls `onTier('beta')`; an unknown value calls nothing.

### Phone: the quota (`app/src/services/quota.ts`)
- `export type PlanTier = ServerTier` (re-exported for callers).
- `LIMITS` gains `betaChecks: 3`, `betaQuestions: 20` (free and Pro unchanged: 1/5 and 10/50).
- `export function limitsFor(tier: PlanTier): { checks: number; questions: number }`: free `{1, 5}`, beta `{3, 20}`, pro `{10, 50}`.
- `QuotaDeps.serverTier?: () => Promise<ServerTier | null>` (type widened).
- `QuotaSnapshot.tier: PlanTier`: `'pro'` when `isPro()` (a purchase) or the server tier is `'pro'`; else the server tier when it is `'beta'`; else `'free'`. With no `serverTier` dep, or it returns `null`: `'free'` (existing tests unchanged).
- `QuotaSnapshot.pro` keeps its meaning (`tier === 'pro'`); `purchased` unchanged. On beta: `pro: false`, `purchased: false`, `checkLimit: 3`, `questionLimit: 20`.
- No lifetime field on the snapshot; `consumeCheck` / `consumeRecheck` / `consumeQuestion` write only today's `UsageDay` row (as today).
- `quotaLine(s)`: `null` when `s.tier === 'beta'` (and when `s.pro`, as today); free unchanged.
- `stylistSubtitle(s)`: on beta, `{ key: 'stylist.quota.held' }` when `heldCount > 0`; else `{ key: 'stylist.quota.questions', n }` when 3 or fewer questions are left; else `null`. Free and Pro unchanged.
- `export function questionLimitText(s: Pick<QuotaSnapshot, 'tier'>): string`: free → `t('ask.limit.free')`; pro → `t('ask.limit.pro')`; beta → `That's 20 questions today. More at 4 am.`
- `canStartCheck()` / `canAskQuestion()`: unchanged logic, using the beta limits on beta (a 4th check → false; a 21st question → false).

### Phone: the paywall switch (`app/src/features/paywall/switch.ts`)
- `paywallOn(): boolean` = `(PAYWALL_BUILT || a demo store script is set) && tierNow() !== 'beta'`.
- `usePaywallOn()` also re-renders on `onTierChange`.
- Effect: on beta, every existing paywall entry reads false: the soft page (`finish` → `paywallDue` → `skip`, then the notification ask follows as today), the limit card's upgrade button, the question line's Try Pro, the You tab's Try Pro, the Plan & usage Restore row, Settings' Subscription section.

### Phone: the limit card (`app/src/features/held/content.ts`, `LimitCard.tsx`)
- `limitCardContent(row, quota: Pick<QuotaSnapshot, 'questionsUsed' | 'questionLimit' | 'recheckOpen' | 'tier'>, o?)`:
  - beta, not saved: `{ state: 'limit', tag: 'Daily limit', tagRight: 'Resets at 4 am', title: "That's today's 3 fit checks.", body: "I'll save this photo and score it after 4 am.", save: 'Save for tomorrow', tryPro: null, dontScore: null, a11y: "Daily limit. That's today's 3 fit checks. I'll save this photo and score it after 4 am." }`. `tryPro` is `null` on beta even with `o.paywallBuilt: true`. The body never adds the re-check sentence on beta (FP7 gives the body exactly).
  - beta, saved: `{ state: 'saved', tag: 'Waiting to score', tagRight: 'After 4 am', title: null, body: <held.body.beta, words pending F-2>, save: null, tryPro: null, dontScore: "Don't score it", a11y: 'Waiting to score. After 4 am. ' + body }`.
  - free and Pro: unchanged.
- `heldReadyContent(row)`: unchanged (`Ready to score last night's photo?` · `Score it` · `Not this one`).
- `LimitCard` testIDs (on plain wrapping `View`s, not `accessible`, so VoiceOver is unchanged; the design system's `KCard`/`KButton`/`TextLink` take no testID and are not edited): `limit-card` (the card, limit state), `held-card` (the card, saved state), `limit-card-save` (Save for tomorrow), `limit-card-pro` (the upgrade button; never rendered on beta), `held-card-dont-score` (Don't score it).

### Phone: the plan (`app/src/features/settings/plan.ts`, `usePlan.ts`, `you/plan.tsx`)
- `PlanInfo` gains `{ kind: 'beta' }`.
- `currentPlan(isPro: boolean, nowMs: number, demoPlan?: string | null, tier?: ServerTier): PlanInfo`: `demoPlan` first (as today), then `isPro` → pro, then `tier === 'beta'` → `{ kind: 'beta' }`, else free. A server tier of `pro` without a purchase stays `free` (as today: never "Pro" for the server's tier).
- `planStatus({ kind: 'beta' }, zone)` → `{ title: 'Kitted beta', detail: '3 fit checks and 20 questions a day · resets at 4 am' }`.
- `planShortName({ kind: 'beta' })` → `'Kitted beta'` (Settings' Plan & usage row value).
- `hasPro(p)` → `p.kind === 'pro' || p.kind === 'trial'` (false for free and beta).
- `usePlan()` passes `tierNow()` and re-renders on `onTierChange`.
- `you/plan.tsx`: Manage subscription shows only when `hasPro(plan)`; Restore purchases only when `paywallOn()` (unchanged; false on beta). Status card wrapped in `View testID="plan-status"`.
- `usageLines(snapshot, rechecks)` unchanged; on beta it reads `Fit checks · {used} of 3`, `Re-check · 1 left | Used | Closed`, `Questions · {used} of 20`.

### Phone: other callers
- `ask/pipeline.ts` `limitLine`: text = `questionLimitText(snapshot)`; `payload.tryPro = snapshot.tier === 'free' && deps.tryPro()`. Outcome `limit`, nothing counted (as today).
- `you/index.tsx` `TodayCard`: when `s.pro || s.tier === 'beta'` → title `Today`, right `resets at 4 am`, line `t('you.today.pro', …)` = `{c} of 3 fit checks left · {q} of 20 questions left`; Try Pro only when `paywallOn() && s.tier === 'free'`. Wrapped in `View testID="you-today"`.
- `MorningCard`: when today's checks are used on beta, the line is `t('own.limit.beta')` (words pending F-1) instead of `own.limit`.
- `fitcheck/session.ts`: `serverTier: () => appTier(store)`.

### New strings (`app/src/i18n/en.ts`, `addedInBuild`, one comment pointing at FP7)
- `limit.beta.title`: `That's today's {n} fit checks.` (n = 3 → `That's today's 3 fit checks.`)
- `limit.beta.body`: `I'll save this photo and score it after 4 am.`
- `ask.limit.beta`: `That's {n} questions today. More at 4 am.` (n = 20)
- `you.plan.beta`: `Kitted beta`
- `you.plan.betaLine`: `{checks} fit checks and {questions} questions a day · resets at 4 am` (3, 20)
- `held.body.beta`: pending the founder (F-2). Placeholder until he answers: `Saved. I'll score it when you open Kitted after 4 am.`
- `own.limit.beta`: pending the founder (F-1). Placeholder until he answers: `Your fit checks reset at 4 am.`

### Demo screens (new; all `scenario: 'full'`, `onboarded: true`, `tier: 'beta'`)
Every existing screen gets `tier: 'free'` by default (applied before its story), so nothing already shot changes.
- `252` Beta · Stylist home: `now 2026-10-22T08:01:00`, `freeChecksUsed: 0`, `/stylist` (no check line under "Stylist").
- `253` Beta · Limit card: `now 2026-10-22T21:12:00`, `freeChecksUsed: 3`, story `hold s14` at 21:12, `/stylist`.
- `254` Beta · Limit card, saved for tomorrow: as 253 with `saved: true`.
- `255` Beta · Questions used up: story `askUsed n: 20` at 12:20, then `ask 'What shoes go with my khaki chinos?'` at 12:21, `/stylist`.
- `256` Beta · Plan & usage: `now 2026-10-22T12:22:00`, `freeChecksUsed: 1`, `/you/plan`, under `/you`.
- `257` Beta · You: `now 2026-10-22T12:22:00`, `freeChecksUsed: 0`, `/you`.
- `258` Beta · Settings: `now 2026-10-22T12:22:00`, `/you/settings`, under `/you`.
- `259` Beta · Morning card, checks used: `now 2026-10-22T07:40:00`, `freeChecksUsed: 3`, story `morning` at 07:40, weather `coldRain`, `/stylist`.
- `ScreenScenario.tier?: ServerTier`; `applyDemoScreen` calls `setDemoTier(scenario.tier ?? 'free')` before the story runs, and `setDemoTier(null)` when no demo screen is set.

## Data
- `kv['server.tier']` may now hold `'beta'`. No migration: a phone holding `'pro'` (the server's old beta default) switches on the next answer.
- No new stored field on the phone or the server. No lifetime count (FP7: "No lifetime count"). Beta checks are not marked; see Open question T-4 for how T11 keeps them out of the 7.
- Server: `server/config.tier` may be `'beta'`; missing → `'beta'`.

## Steps
1. Server: `Tier` and `TIERS.beta` in `limits.ts`; `DEFAULT_CONFIG.tier = 'beta'` and the `'beta'` parse in `store.ts`. Run `npm --prefix tests run emulate` in `firebase/`.
2. `tier.ts`: the type, `parseTier`, `fallbackTier`, `appTier`, `tierNow`, `onTierChange`, `setDemoTier`, `resetTierForTests`; `tierRecorder` updates the known tier. `transport.ts` uses `parseTier`.
3. `quota.ts`: `tier` on the snapshot, `LIMITS.beta*`, `limitsFor`, `quotaLine`/`stylistSubtitle` on beta, `questionLimitText`. `fitcheck/session.ts` wires `appTier`.
4. `paywall/switch.ts`: gate `paywallOn` and `usePaywallOn` on the tier.
5. `en.ts`: the new keys (with the two placeholders marked "pending the founder").
6. `held/content.ts` and `LimitCard.tsx`: the beta variants and the testIDs.
7. `settings/plan.ts`, `usePlan.ts`, `you/plan.tsx`: the beta plan; Manage only with Pro.
8. `ask/pipeline.ts`, `you/index.tsx`, `morning/MorningCard.tsx`: the beta lines.
9. Demo: `tier` per screen, screens 252–259 and their stories. Check each on the Simulator, light, dark and the largest text size.
10. `npm run check` in `app/` (on its own), then the flows.

## Must not break
- Free and Pro behave exactly as today when the tier is `free` or `pro` (the existing `quota`, `limitCard`, `askPipeline`, `settingsPrefs` tests, unchanged).
- `serverProxy.test.ts` A10 stays true: no header → `serverTier()` is `null` and a quota built with `serverTier: () => serverTier(store)` uses free limits; `x-kitted-tier: pro` → 10/50 with `purchased: false`; the direct path never records a tier.
- The server's L1–L10 tests with `tier: 'free'` and `'pro'`. One server test changes on purpose: "the beta default is Pro when the config is missing" becomes "the beta default is beta" (FP7 replaces that rule; DECISIONS-LOG 399). The test writer makes that change and says why in REPORT.md.
- A held photo is never read or sent before his tap; same photo, same score; failed, offline, "not rated" and same-photo checks never count.
- The paywall demo screens (150–162) and every other existing demo screen look as before (they pin `tier: 'free'`).
- The re-check window rules (30 min; the first-ever check until 4 am).

## Open questions
**For the founder (words he reads):**
- **F-1** · The morning card's line when today's 3 checks are used. Today it says `Your free check resets tomorrow`, which breaks FP7 ("free check"). · the founder · default meanwhile: `Your fit checks reset at 4 am.` (marked pending in `en.ts`; the test checks only that it has no banned word until he answers).
- **F-2** · The saved card's body on the beta. FP3's says `Saved. I'll score it when you open Kitted after 4 am. It uses tomorrow's free check.`, and FP7 says "the saved card works as in FP3" but also bans "free check". · the founder · default meanwhile: `Saved. I'll score it when you open Kitted after 4 am.` (the last sentence dropped). Alternative: `… It uses one of tomorrow's 3 fit checks.`

**Technical defaults (the coordinator logs them):**
- **T-1** · Lane: the task can't be done inside the lane's files. It needs the minimal out-of-lane edits listed under Files (transport, fitcheck session wiring, ask pipeline, usePlan, the You and Plan screens, the morning card, the demo files). Default: allowed as listed, nothing more.
- **T-2** · Before the server's first answer, the phone uses `fallbackTier()`: `beta` while `PAYWALL_BUILT` is off, `free` once it's on, so the one launch switch flips both. Without it a new tester sees `1 free check today` until his first check reaches the server.
- **T-3** · One gate for "no paywall on beta": `paywallOn()` reads the tier, rather than a check at each entry point. The ask line and the limit card also check the tier themselves, so a test that injects "paywall on" still can't show Try Pro on beta.
- **T-4** · FP7.6 ("beta checks never count toward the 7"): T14 adds no lifetime count and no per-check marker. The phone's 7-free-checks count is T11's: it must count only checks it marks as made on the free tier, so every unmarked check (all beta and dev checks) never counts. The server's lifetime count is T21's and must count only `free`-tier reservations. Both go in the DECISIONS-LOG entry so the T11 and T21 planners see them.
- **T-5** · "You → Plan" is the Plan & usage screen's top card (Y5) plus Settings' "Plan & usage" row value. No new row on the You tab itself (free has none there today, #246); the You tab's Today card shows the beta counts with words that already exist (`Today` · `resets at 4 am` · `{c} of 3 fit checks left · {q} of 20 questions left`).
- **T-6** · The new strings go in `en.ts` `addedInBuild`, not the copy deck `handoff/02-screens.md` §5 (not in this task's files); T11/T12 rework the deck.
- **T-7** · The server keeps its 2-question slack (20 + 2 = 22 on the server); the phone stops at 20.
- **T-8** · Day counts are kept per day whatever the tier: on the day the server switches from beta to free, a tester who used beta checks that day is held to free's daily limit until 4 am. Acceptable (one day, at launch).
- **T-9** · testIDs go on plain wrapping `View`s, because the design system's components take none; no design-system edit.
- **T-10** · Demo screens 252–259 are the next free numbers on main today; renumber at merge if another branch took them (same trap as DECISIONS-LOG numbers).
