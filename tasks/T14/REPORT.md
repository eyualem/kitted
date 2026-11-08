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
