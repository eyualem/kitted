#!/bin/sh
# usage: shot.sh <html file> <out.png> [width=1400] [height=2000] [scale=1]
# Takes a lock so only one headless Chrome runs at a time (the Mac is short on memory).
# For animated pages, the screenshot is taken after --virtual-time-budget ms (default 9000); set KVT=ms to change.
LOCK=/private/tmp/claude-501/-Users-eyu-Desktop-files-Kitted--claude-worktrees-social-share-card-demos-c424a6/9ecb68fd-10d7-455f-9c3e-0aadff38d780/scratchpad/share/.shotlock
W=${3:-1400}; H=${4:-2000}; SC=${5:-1}
n=0; until mkdir "$LOCK" 2>/dev/null; do sleep 1; n=$((n+1)); [ $n -gt 120 ] && rmdir "$LOCK" 2>/dev/null; done
F=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --allow-file-access-from-files --force-device-scale-factor=$SC --window-size=$W,$H \
  --virtual-time-budget=${KVT:-9000} --screenshot="$2" "file://$F" >/dev/null 2>&1
rmdir "$LOCK"
echo "$2"
