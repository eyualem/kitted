#!/bin/sh
# The landing page against the real waitlist function, on the Firebase emulators (handoff/15-landing-page.md §7 step 8):
# builds web/ and the functions, then serves http://127.0.0.1:5002 with /api/waitlist/** going to the function and the
# Firestore emulator. Local-only secrets; nothing reaches the real project (--project demo-kitted).
set -e
cd "$(dirname "$0")/../.."
npm --prefix web run build >/dev/null
npm --prefix firebase/functions run build >/dev/null
printf 'WAITLIST_SECRET=local-only-secret\nGEMINI_KEY=unused\nOPENAI_KEY=unused\n' > firebase/functions/.secret.local
trap 'rm -f firebase/functions/.secret.local' EXIT INT TERM
cd firebase
tests/node_modules/.bin/firebase emulators:start --project demo-kitted --only hosting,functions,firestore
