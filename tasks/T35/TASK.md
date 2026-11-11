# T35 · The feature guide: Kit's hello, tips at the moment, Show me around

**Size:** normal · **From:** `plan.md` → T35 · **Spec:** `specs/setup-and-you.md` → SY2, SY3 · **Lane:** Setup and You

## What changes
- **Goal:** a new user is told what Kitted does in Kit's first message, then gets one short tip the first time he reaches his first score, Closet, Lookbook and You; "Show me around" in You brings them all back.
- **Files:**
  - `app/src/features/onboarding/tips.ts` (new): which tip shows when, the done marks in kv, "Show me around".
  - `app/src/features/onboarding/TipCard.tsx` (new): the tip card, and the first-score tip under the score card.
  - `app/src/features/onboarding/complete.ts`: setup's end posts Kit's hello in place of the AI note.
  - `app/src/features/stylist/MessageView.tsx`: draws Kit's hello, and the first-score tip under that check's card.
  - `app/src/app/(tabs)/{closet,lookbook,you}/index.tsx`: the tab's tip at the top.
  - `app/src/features/settings/SettingsRows.tsx`: `Show me around` first in Help & about.
  - `app/src/i18n/en.ts` (shared): the approved words.
  - `app/src/demo/{scenarios,applyDemoScreen}.ts`: existing demo screens keep tips dismissed (they're an established user); new screens show each tip.
- **Done means:**
  - SY2.1 setup's end posts Kit's hello with the approved words, once, and no separate AI note.
  - SY2.2 the first-score tip shows under the first scored check's card only; Got it ends it for good; re-checking that fit ends it too.
  - SY2.3 / SY2.4 the Closet / Lookbook tip shows at the top while it has a piece / a look and the tip isn't done; never on the empty tab.
  - SY2.5 the You tip shows at the top of You until Got it.
  - SY2.6 an install that finished setup before this shows the tips not yet done, and gets no Kit's hello.
  - SY2.7 "Delete all my data" clears every done mark.
  - SY2.8 the words are exactly the approved ones; Got it is at least 44 pt; VoiceOver reads the tip, then Got it as a button.
  - SY2.9 no tip before his first scored check, on the camera, while a check is read, or over a score card.
  - SY3.1 Show me around clears every done mark, switches to Stylist and posts Kit's hello as the newest message.
  - SY3.2 tapping it again while the hello is still the newest message posts no second copy.
  - SY3.3 afterwards the first-score tip shows under the next scored check and no older one; the tab tips show again.
- **Must not break:** old AI-note messages still read as the AI note; Kit's hello is never sent to the server as part of a question's history; the You page's rows and landing (T34); the "Turn on fit checks" card after Not now.

## Built
- **Changed:** <…>
- **Tests added:** <…>
- **Screenshots:** <…>
- **Not done or not checked:** <…>

## Disputes

## Review
