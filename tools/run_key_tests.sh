#!/bin/zsh
# The two tests that need the Gemini key (DECISIONS-LOG #235, #237). About $0.75 in all.
# Uses the app's dev key from app/.env.development.local (git-ignored; the founder's OK, Oct 13),
# or asks for one if that file is missing. The key is never printed or written anywhere.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENVF="$ROOT/app/.env.development.local"
if [ -f "$ENVF" ]; then
  GEMINI_API_KEY="$(sed -n 's/^EXPO_PUBLIC_GEMINI_DEV_KEY=//p' "$ENVF" | head -1 | tr -d '"'"'"' \r')"
fi
[ -n "$GEMINI_API_KEY" ] || { read -s "GEMINI_API_KEY?Gemini API key (hidden): "; echo; }
export GEMINI_API_KEY
cd "$ROOT/extraction-test"
echo "== 1/3 hem test pilot (2 calls) =="
/usr/bin/python3 hem_test.py --runs 1 --only phone-d1967f,stock-s10 --budget 0.02
echo "== 2/3 hem test (78 photos x 3 runs, capped at \$0.60) =="
/usr/bin/python3 hem_test.py --runs 3 --budget 0.60
echo "== 3/3 the creators' own outfits (26 photos x 3 runs, about \$0.45) =="
/usr/bin/python3 creator_read.py
unset GEMINI_API_KEY
echo "Done. Tell Claude: the key tests ran."
