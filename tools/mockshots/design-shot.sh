#!/bin/sh
# usage: design-shot.sh <task ID> <phone 1-n> <light|dark>   -> tasks/<ID>/design/NN-theme.png (804x1748)
# Screenshots one phone of tasks/<ID>/design.html on its own, at 2x, for DESIGN.md, the PR and the critic.
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
ID=${1:?task ID}; N=${2:?phone number}; THEME=${3:-light}
SRC=$ROOT/tasks/$ID/design.html
OUT=$ROOT/tasks/$ID/design; mkdir -p "$OUT"
W=$ROOT/build/designpreview; mkdir -p "$W"
sed "s|<base href=\"../../mockups/\">|<base href=\"file://$ROOT/mockups/\">|" "$SRC" > "$W/$ID.html"
cat "$ROOT/tools/mockshots/isolate.js" >> "$W/$ID.html"
NN=$(printf %02d "$N")
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --allow-file-access-from-files --force-device-scale-factor=2 --window-size=402,874 \
  --virtual-time-budget=20000 --screenshot="$OUT/$NN-$THEME.png" "file://$W/$ID.html#n=$N&theme=$THEME" >/dev/null 2>&1
echo "$OUT/$NN-$THEME.png"
