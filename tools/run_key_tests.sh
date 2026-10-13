#!/bin/zsh
# The two tests that need the founder's Gemini key (DECISIONS-LOG #235, #237). About $0.75 in all.
# The key is read without echo, used only in this shell, never written.
set -e
cd "$(dirname "$0")/../extraction-test"
read -s "GEMINI_API_KEY?Gemini API key (hidden): " && export GEMINI_API_KEY && echo
echo "== 1/3 hem test pilot (2 calls) =="
/usr/bin/python3 hem_test.py --runs 1 --only phone-d1967f,stock-s10 --budget 0.02
echo "== 2/3 hem test (78 photos x 3 runs, capped at \$0.60) =="
/usr/bin/python3 hem_test.py --runs 3 --budget 0.60
echo "== 3/3 the creators' own outfits (26 photos x 3 runs, about \$0.45) =="
/usr/bin/python3 creator_read.py
unset GEMINI_API_KEY
echo "Done. Tell Claude: the key tests ran."
