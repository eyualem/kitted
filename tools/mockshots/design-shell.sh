#!/bin/sh
# usage: design-shell.sh <task ID> "<title>"   -> tasks/<ID>/design.html (only if it doesn't exist yet)
# Starts a task's design page from the mockup's own CSS, icons and phone-frame script, so every design draws
# with the same tokens, frames, status bar, tab bar and composer as mockups/kitted-mockups.html.
# The designer then writes one <figure class="shot"> per state where the page says so.
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
ID=${1:?task ID}; TITLE=${2:-$ID}
MOCK=$ROOT/mockups/kitted-mockups.html
OUT=$ROOT/tasks/$ID/design.html
[ -e "$OUT" ] && { echo "exists: $OUT"; exit 0; }
mkdir -p "$ROOT/tasks/$ID"
{
  echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  echo '<base href="../../mockups/">'
  # Part A: fonts, the mockup's styles, the icon symbols and the board's opening tag.
  awk '/<div class="board" id="board"/{print; exit} {print}' "$MOCK" | sed "s|<title>.*</title>|<title>$ID design</title>|"
  cat <<EOF
<header class="masthead">
  <div class="mast-left">
    <span class="woven">KITTED</span>
    <h1 class="board-title">$TITLE</h1>
  </div>
  <div class="mast-right">
    <p class="lede">Design for $ID. Phones are true iPhone 17 size (402 × 874 pt), scaled to fit. Every word on them is the exact copy; what each part is and why is in DESIGN.md.</p>
    <div class="switch">
      <span class="lbl" id="app-lbl">App appearance</span>
      <div class="seg" role="group" aria-labelledby="app-lbl">
        <button type="button" id="ap-auto" data-v="auto" aria-pressed="true">Match page</button>
        <button type="button" id="ap-light" data-v="light" aria-pressed="false">Light</button>
        <button type="button" id="ap-dark" data-v="dark" aria-pressed="false">Dark</button>
      </div>
    </div>
  </div>
</header>

<section class="flow" id="states">
  <div class="flow-head">
    <div><span class="eyebrow">$ID</span><h2>States</h2></div>
    <p>One phone per state, in the order he meets them.</p>
  </div>
  <div class="row">
<!-- DESIGN: one <figure class="shot"><div class="phone" ...><div class="screen">…</div></div><figcaption>…</figcaption></figure> per state -->
  </div>
</section>
EOF
  # Part C: closes the board, then the mockup's extra styles and its frame script (status bar, tab bar, photos).
  awk 'f{print} /^<\/footer>/{f=1}' "$MOCK"
} > "$OUT"
echo "$OUT"
