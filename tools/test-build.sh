#!/bin/sh
# Before a TestFlight build (/test-build): every automatic check in one run, and one short summary at the end, so the
# session reads a few lines instead of driving each check itself.
# Usage: sh tools/test-build.sh [--since <ref>] [--udid <udid>] [--port <metro port>] [--no-flows]
#   --since  what counts as new (default: the latest testflight/* tag, the commit of the last build)
#   --no-flows  skip the tap-through flows (no Simulator or Metro needed)
# Needs for the flows: the Simulator booted with the dev build installed, and Metro on the port (kitted-metro).
# Logs: build/test-build/<time>/<step>.log. Exits 0 only if every step that ran passed.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
UDID=111D0A09-C2CA-4F72-BF3C-44019A05C89D
PORT=8081
SINCE=""
FLOWS=1
while [ $# -gt 0 ]; do
  case "$1" in
    --since) SINCE=$2; shift 2 ;;
    --udid) UDID=$2; shift 2 ;;
    --port) PORT=$2; shift 2 ;;
    --no-flows) FLOWS=0; shift ;;
    *) echo "unknown option: $1"; exit 2 ;;
  esac
done

# The flows every build runs: setup, a fit check, Kit, Closet, You.
CORE="T39-setup-fresh core-fit-check core-kit T73-closet-no-outfits T34-you-settings-home"

cd "$ROOT" || exit 2
OUT=$ROOT/build/test-build/$(date +%Y%m%d-%H%M%S)
mkdir -p "$OUT"
FAILED=0

[ -n "$SINCE" ] || SINCE=$(git describe --tags --match 'testflight/*' --abbrev=0 2>/dev/null || true)

# ── What's new
echo "== What's new"
if [ -n "$SINCE" ]; then
  CHANGED=$(git diff --name-only "$SINCE"..HEAD)
  TASKS=$(git log --format=%s "$SINCE"..HEAD | grep -oE '^T[0-9]+' | sort -u | tr '\n' ' ')
  echo "since $SINCE: $(git rev-list --count "$SINCE"..HEAD) commits · tasks: ${TASKS:-none}"
  git log --merges --format='  %s' "$SINCE"..HEAD | grep '^  Merge pull request ' | sed 's/Merge pull request /PR /' | head -30
else
  CHANGED=$(git ls-files)
  TASKS=""
  echo "no testflight/* tag: treating everything as new (core flows only)"
fi
touches() { echo "$CHANGED" | grep -q "^$1"; }

# ── One step: a name, then the command. Prints PASS or FAIL with its log.
step() {
  name=$1; shift
  log="$OUT/$(echo "$name" | tr ' ' '-').log"
  printf '%-30s' "$name"
  if "$@" >"$log" 2>&1; then echo "PASS"; else echo "FAIL  ${log#"$ROOT"/}"; tail -5 "$log" | sed 's/^/    /'; FAILED=1; fi
}

echo
echo "== Checks   ($(top -l 1 | grep PhysMem | sed 's/PhysMem: //'))"

# guard:release reads app/.env*, which a worktree doesn't have (git-ignored): borrow the main checkout's for the run.
MAIN=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
LINKED=""
if [ "$MAIN" != "$ROOT" ]; then
  for f in "$MAIN"/app/.env*; do
    [ -e "$f" ] || continue
    t="$ROOT/app/$(basename "$f")"
    [ -e "$t" ] || { ln -s "$f" "$t"; LINKED="$LINKED $t"; }
  done
fi
cleanup() { for t in $LINKED; do rm -f "$t"; done; }
trap cleanup EXIT INT TERM

step "app check" sh -c 'cd app && npm run check'
step "release guard" sh -c 'cd app && npm run guard:release'
if touches firebase/; then
  step "server tests" sh -c 'cd firebase && npm --prefix tests run emulate'
else
  printf '%-30s%s\n' "server tests" "skipped (server unchanged)"
fi

# ── Tap-through flows: the core five, plus the flows of tasks merged since the last build.
if [ "$FLOWS" = 1 ]; then
  echo
  echo "== Flows"
  if ! xcrun simctl list devices booted | grep -q "$UDID"; then
    echo "Simulator $UDID isn't booted: boot it (CLAUDE.md rule 9), or run with --no-flows"; FAILED=1
  elif ! curl -s "http://localhost:$PORT/status" | grep -q running; then
    echo "Metro isn't answering on $PORT: start kitted-metro, or run with --no-flows"; FAILED=1
  else
    LIST=$CORE
    for id in $TASKS; do
      for f in app/e2e/flows/"$id"-*.yaml; do
        [ -e "$f" ] || continue
        n=$(basename "$f" .yaml)
        case " $LIST " in *" $n "*) ;; *) LIST="$LIST $n" ;; esac
      done
    done
    for n in $LIST; do
      step "flow $n" maestro --device "$UDID" test -e PORT="$PORT" "app/e2e/flows/$n.yaml"
    done
  fi
fi

echo
if [ "$FAILED" = 0 ]; then echo "== ALL PASSED: ready to build"; else echo "== NOT READY: fix what failed first"; fi
exit $FAILED
