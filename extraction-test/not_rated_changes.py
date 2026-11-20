#!/usr/bin/env python3
"""T61 · NR8.2: which stored readings change when "not rated" lands. $0: no network, no AI call.

  /usr/bin/python3 extraction-test/not_rated_changes.py [--old-rev 07ed10cc]

Scores every stored reading (git-tracked extraction-test/results/**/raw_results.json, handoff/fixtures/readings/**)
with rubric.py as it was before the build (read from git at --old-rev) and with the one on disk, at the same config
(everyday, no picks, "a little"). Writes tasks/T61/changed-readings.md: every reading whose result changes, with its old
score and its new reason, and a count of everything that did not change. Exits 1 if any change is not "a traditional
main piece" or "an unsure top, jacket or pants" (the only changes the spec allows), or if any scored reading moved.
Profile unknown: these are stored model readings, most of them stock or test photos.
"""
import argparse
import hashlib
import importlib.util
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
import rubric as NEW  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--old-rev", default="07ed10cc")
ap.add_argument("--data", help="also read every raw_results.json under DIR/extraction-test/results (the git-ignored runs in the main checkout)")
args = ap.parse_args()

src = subprocess.run(["git", "-C", str(K), "show", f"{args.old_rev}:extraction-test/rubric.py"], capture_output=True, text=True, check=True).stdout
spec = importlib.util.spec_from_loader("rubric_old", loader=None)
OLD = importlib.util.module_from_spec(spec)
OLD.__file__ = str(HERE / "rubric.py")      # the old file reads its own data files next to itself
exec(compile(src, "rubric_old.py", "exec"), OLD.__dict__)


def canon(r):
    return json.dumps({"scene": r.get("scene"), "garments": r.get("garments")}, sort_keys=True, separators=(",", ":"))


readings = {}   # canon -> (reading, [where])
tracked = subprocess.run(["git", "-C", str(K), "ls-files", "extraction-test/results", "handoff/fixtures/readings"],
                         capture_output=True, text=True, check=True).stdout.split()
for rel in tracked:
    if not rel.endswith(".json") or rel.endswith("INDEX.json"):
        continue
    try:
        data = json.load(open(K / rel))
    except Exception:
        continue
    if rel.endswith("raw_results.json") and isinstance(data, list):
        for x in data:
            e = x.get("extraction") if isinstance(x, dict) else None
            if isinstance(e, dict) and isinstance(e.get("garments"), list):
                r, where = readings.setdefault(canon(e), (e, []))
                if len(where) < 3:
                    where.append(f"{rel.split('results/', 1)[-1]}:{x.get('outfit')}/{x.get('stage')}/run{x.get('run')}")
    elif isinstance(data, dict) and isinstance(data.get("garments"), list):
        r, where = readings.setdefault(canon(data), (data, []))
        if len(where) < 3:
            where.append(rel)

if args.data:
    for f in sorted(Path(args.data, "extraction-test", "results").rglob("raw_results.json")):
        try:
            data = json.load(open(f))
        except Exception:
            continue
        for x in data if isinstance(data, list) else []:
            e = x.get("extraction") if isinstance(x, dict) else None
            if isinstance(e, dict) and isinstance(e.get("garments"), list):
                r, where = readings.setdefault(canon(e), (e, []))
                if len(where) < 3:
                    where.append(f"{f.relative_to(Path(args.data, 'extraction-test', 'results'))}:{x.get('outfit')}/{x.get('stage')}/run{x.get('run')}")

changed, same, flagged = [], 0, []
for key, (r, where) in readings.items():
    o = OLD.score(json.loads(json.dumps(r)))
    n = NEW.score(json.loads(json.dumps(r)))
    rid = "r" + hashlib.sha256(key.encode()).hexdigest()[:10]
    if (o.get("overall"), o.get("reason"), o.get("not_rated")) == (n.get("overall"), n.get("reason"), n.get("not_rated")) \
            and o.get("raw_unrounded") == n.get("raw_unrounded"):
        same += 1
        continue
    gs = [g for g in r.get("garments", []) if g.get("category") != "accessory"]
    trad = [g for g in gs if g.get("category") == "traditional" and g.get("subcategory") != "traditional_shoe"]
    unsure_main = [g for g in gs if g.get("certainty") == "unsure" and g.get("category") in ("top", "outerwear", "bottom")]
    kind = "traditional main piece" if trad else ("unsure top, jacket or pants" if unsure_main else "OTHER")
    row = (rid, o.get("overall"), o.get("reason"), n.get("reason"), n.get("unreadable_slot"), kind, where)
    changed.append(row)
    ok = (n.get("overall") is None and n.get("reason") in ("traditional", "unreadable") and kind != "OTHER")
    if not ok or o.get("overall") is None and o.get("reason") == n.get("reason"):
        flagged.append(row)

by = Counter((c[5], c[3], c[4]) for c in changed)
lines = [
    "# T61 · stored readings that change (NR8.2)",
    "",
    f"Made by `extraction-test/not_rated_changes.py` (old = `rubric.py` at {args.old_rev}, new = the one on disk), $0, no AI call. "
    "Config: everyday, no picks, boldness \"a little\". Profile unknown (stored model readings, mostly stock and test photos).",
    "",
    f"- Stored readings checked (unique{', git-tracked only' if not args.data else ', tracked and the main checkout runs'}): **{len(readings)}**",
    f"- Unchanged (every score, part of the result and `not_rated`): **{same}**",
    f"- Changed: **{len(changed)}**; changes outside the two allowed kinds: **{len(flagged)}**",
    "",
    "| Kind | New reason | Slot | Readings |",
    "|---|---|---|---|",
]
for (kind, reason, slot), n_ in sorted(by.items(), key=lambda kv: -kv[1]):
    lines.append(f"| {kind} | {reason} | {slot or ''} | {n_} |")
lines += ["", "## Every changed reading", "", "| Reading | Old score | Old reason | New reason | Slot | Kind | Where (first 3) |", "|---|---|---|---|---|---|---|"]
for rid, os_, orr, nr, slot, kind, where in sorted(changed, key=lambda c: (c[5], c[0])):
    lines.append(f"| {rid} | {os_ if os_ is not None else 'none'} | {orr or ''} | {nr or ''} | {slot or ''} | {kind} | {'; '.join(where)} |")
out = K / "tasks" / "T61" / "changed-readings.md"
out.write_text("\n".join(lines) + "\n")
print(f"{len(readings)} readings, {same} unchanged, {len(changed)} changed, {len(flagged)} outside the allowed kinds -> {out}")
sys.exit(1 if flagged else 0)
