#!/usr/bin/env python3
"""Running shoes at Everyday and Class, on paper (Oct 24, 2026; the founder: "soften running shoes at Everyday and Class
(Shoes 6.0 instead of 5.0, so about half a point). Test it on paper first and show me the before/after.").
No API calls, no app change: parts_proto.py is NOT edited. The candidate is the engine's own knob, tune sk2_runner=6.0,
passed only when the occasion is Everyday or Class. Everything else about [SHO-3] stays: 4.5 under a tailored jacket,
nothing lifts it, gym/home/outdoor uncharged, and every dressier occasion keeps 5.0.

  /usr/bin/python3 runners_paper.py      (from a worktree: KITTED_DATA=/Users/eyu/Desktop/files/Kitted)

Bars, written before the run:
  R1  At Everyday and Class a runners outfit's Shoes part is 6.0 where it was 5.0; at Going out, Date, Interview, Event and
      Work it doesn't change; at Gym and Home it doesn't change; under a tailored jacket it stays 4.5.
  R2  No check or photo without running shoes moves (gold set and phone checks).
  R3  Gold set, held-out half: r with the 5-judge panel doesn't drop by more than 0.03.
  R4  The founder's 20 blind ratings: no fewer within 0.5.
  R5  The two gold runs stay as steady (within 0.5) on the runner photos.
  R6  Report (no bar): his saved checks that move; today's runners check; the 8+ share; the conformance cases whose
      expected numbers change (to update on a port).

Rule 7: gold photos are "profile unknown", scored with one stated test profile (Minimal + Smart casual, 0.5 each) at
Everyday, as gold_tune.py. Phone checks are the founder's: born 2004 (22-25), picks streetwear 0.5 / minimalist 0.25 /
workwear 0.25 (from his phone's profile, Oct 24), at each check's own occasion, with its stored second look.
"""
import json
import os
import sqlite3
import glob
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
os.environ.setdefault("KITTED_DATA", str(DATA))
import parts_proto as P  # noqa: E402
import rubric as R  # noqa: E402
import rules_conformance as RC  # noqa: E402
import casual_athletic_paper as CAP  # noqa: E402  (its gold loader and helpers)

SOFT = {"everyday", "class"}
CAND = {"sk2_runner": 6.0}
GOLD_PROFILE = R.parse_styles("minimalist:0.5,smart_casual:0.5")
HIS = {"streetwear": 0.5, "minimalist": 0.25, "workwear": 0.25}
OUT = HERE / "results" / "runners"


def score(rd, occ, styles, sl=None, cand=False):
    tune = CAND if cand and occ in SOFT else None
    return P.score_parts(rd, occ, dict(styles), sl, tune=tune)


def has_runner(rd):
    return any(g.get("category") == "footwear" and g.get("subcategory") in P.RUNNER for g in rd.get("garments", []))


def fired(r, check):
    return any(x["check"] == check for p in (r.get("parts") or {}).values() for x in p.get("reasons", []))


def shoes(r):
    p = (r.get("parts") or {}).get("shoes") or {}
    return p.get("score")


def load_phone():
    """Every scored check in every pull, newest pull wins, with its second look and occasion."""
    out = {}
    for db in sorted(glob.glob(str(DATA / "screenshots/phone/*/SQLite/kitted.db"))):
        cx = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
        try:
            q = cx.execute("select f.id, f.created_at, f.image_hash, f.occasion, f.score, f.details, r.reading_json "
                           "from fit_checks f join readings r on r.id = f.reading_id where f.status = 'scored'").fetchall()
        except sqlite3.Error:
            continue
        for fid, at, h, occ, sc, det, js in q:
            if not js:
                continue
            d = json.loads(det or "{}")
            look = d.get("secondLook") or {}
            sl = {**(look.get("u") or {}), **(look.get("l") or {})} or None
            out[fid] = {"at": at, "occ": occ, "stored": sc, "reading": json.loads(js), "sl": sl}
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    fails = 0
    # ---- R1 on the conformance cases' runner outfits, at every occasion
    occs = ["everyday", "class", "going_out", "date", "interview", "event", "work", "gym", "home"]
    runner_cases = [c for c in RC.CASES if has_runner(c["reading"]) and not c.get("future")]
    bad1 = []
    for c in runner_cases:
        for occ in occs:
            b = score(c["reading"], occ, c["styles"], c["second_look"])
            a = score(c["reading"], occ, c["styles"], c["second_look"], cand=True)
            if b.get("overall") is None:
                continue
            sb, sa = shoes(b), shoes(a)
            tailored = any("tailored" in x["line"] for x in b["parts"]["shoes"]["reasons"] if x["check"] == "SK2_runners")
            want = sb + 1.0 if occ in SOFT and fired(b, "SK2_runners") and not tailored else sb
            if sa != want:
                bad1.append((c["id"], occ, sb, sa))
    say(f"R1 Shoes 5.0 -> 6.0 only at Everyday/Class (tailored 4.5 kept; {len(runner_cases)} runner cases x {len(occs)} "
        f"occasions): {'PASS' if not bad1 else 'FAIL ' + str(bad1[:5])}")
    fails += bool(bad1)

    changed = []
    for c in RC.CASES:
        if c.get("future"):
            continue
        b, a = RC.run(c), score(c["reading"], c["occasion"], c["styles"], c["second_look"], cand=True)
        if b.get("overall") != a.get("overall") or shoes(b) != shoes(a):
            changed.append((c["id"], c["rule"], c["occasion"], b.get("overall"), a.get("overall"), c["what"]))
    say(f"R6 conformance cases whose numbers change ({len(changed)} of {len(RC.CASES)}; update on a port):")
    for cid, rule, occ, b, a, what in changed:
        say(f"     {cid:10s} {rule:10s} {occ:9s} {b} -> {a}  {what}")
    say()

    # ---- the founder's phone checks
    phone = load_phone()
    say(f"== His saved checks ({len(phone)} across the phone pulls; his profile; each at its own occasion) ==")
    moved, bad2 = [], []
    for fid, x in sorted(phone.items(), key=lambda kv: kv[1]["at"]):
        b = score(x["reading"], x["occ"], HIS, x["sl"])
        a = score(x["reading"], x["occ"], HIS, x["sl"], cand=True)
        if b.get("overall") != a.get("overall") or shoes(b) != shoes(a):
            moved.append((fid, x, b, a))
            if not has_runner(x["reading"]):
                bad2.append(fid)
    for fid, x, b, a in moved:
        import datetime as dt
        when = dt.datetime.fromtimestamp(x["at"] / 1000).strftime("%b %d %H:%M")
        say(f"  {when}  {x['occ']:9s} stored {x['stored']}  now {b['overall']} -> {a['overall']}  "
            f"(Shoes {shoes(b)} -> {shoes(a)})  {CAP.desc(x['reading'])}")
    say(f"  {len(moved)} of {len(phone)} move")

    # ---- the gold set
    runs, panel, founder, _, test = CAP.load_gold()
    B = {p: [score(rd, "everyday", GOLD_PROFILE) for rd in rs] for p, rs in runs.items()}
    A = {p: [score(rd, "everyday", GOLD_PROFILE, cand=True) for rd in rs] for p, rs in runs.items()}
    for p in runs:
        if any(x.get("overall") != y.get("overall") for x, y in zip(B[p], A[p])) and not any(has_runner(rd) for rd in runs[p]):
            bad2.append(p)
    say(f"R2 nothing without running shoes moves: {'PASS' if not bad2 else 'FAIL ' + str(bad2[:5])}")
    fails += bool(bad2)
    say()

    run_ps = [p for p in runs if any(has_runner(rd) for rd in runs[p])]
    say(f"== The gold set (5-judge AI panel; profile unknown, test profile; Everyday): {len(run_ps)} of {len(runs)} photos "
        f"have running shoes in at least one read ==")

    def metr(S, ps):
        ps = [p for p in ps if p in panel and S[p][0].get("overall") is not None]
        app, pan = [S[p][0]["overall"] for p in ps], [panel[p] for p in ps]
        return len(ps), CAP.pearson(app, pan) if len(ps) > 2 else float("nan"), sum(abs(a - b) <= 0.5 for a, b in zip(app, pan)), \
            (sum(app) / len(app) if app else 0), (sum(pan) / len(pan) if pan else 0)
    for name, ps in (("all photos", list(runs)), ("held-out test half", [p for p in runs if p in test]),
                     ("runner photos", run_ps)):
        nb, rb, wb, mb, pm = metr(B, ps)
        na, ra, wa, ma, _ = metr(A, ps)
        say(f"  {name:20s} n {nb:3d}  r {rb:.2f} -> {ra:.2f}   within 0.5 {wb} -> {wa}   app mean {mb:.2f} -> {ma:.2f} "
            f"(panel {pm:.2f})")
    _, rb, *_ = metr(B, [p for p in runs if p in test])
    _, ra, *_ = metr(A, [p for p in runs if p in test])
    r3 = ra >= rb - 0.03
    say(f"R3 held-out r doesn't drop by more than 0.03: {'PASS' if r3 else 'FAIL'}")
    fails += not r3

    fp = [p for p in founder if p in runs and B[p][0].get("overall") is not None]
    fb, fa, fr = [B[p][0]["overall"] for p in fp], [A[p][0]["overall"] for p in fp], [founder[p] for p in fp]
    wb, wa = sum(abs(x - y) <= 0.5 for x, y in zip(fb, fr)), sum(abs(x - y) <= 0.5 for x, y in zip(fa, fr))
    say(f"R4 his {len(fp)} blind ratings: r {CAP.pearson(fb, fr):.2f} -> {CAP.pearson(fa, fr):.2f}; within 0.5 {wb} -> {wa}: "
        f"{'PASS' if wa >= wb else 'FAIL'}")
    fails += wa < wb
    for p in fp:
        if has_runner(runs[p][0]):
            say(f"     runner photo {p}: he rated {founder[p]}, panel {panel.get(p)}, app {B[p][0]['overall']} -> {A[p][0]['overall']}")

    def steady(S, ps):
        two = [p for p in ps if len(S[p]) >= 2 and all(x.get("overall") is not None for x in S[p][:2])]
        return sum(abs(S[p][0]["overall"] - S[p][1]["overall"]) <= 0.5 for p in two), len(two)
    sb, sa = steady(B, run_ps), steady(A, run_ps)
    say(f"R5 two runs within 0.5 on runner photos: {sb[0]}/{sb[1]} -> {sa[0]}/{sa[1]}: {'PASS' if sa[0] >= sb[0] else 'FAIL'}")
    fails += sa[0] < sb[0]

    e8b = sum(B[p][0].get("overall") is not None and B[p][0]["overall"] >= 8 for p in runs)
    e8a = sum(A[p][0].get("overall") is not None and A[p][0]["overall"] >= 8 for p in runs)
    say(f"R6 8+ share on the gold set: {e8b} -> {e8a} of {len(runs)}")
    say()
    say("  The runner photos one by one (first run; panel = 5-judge median):")
    for p in sorted(run_ps, key=lambda p: panel.get(p, 0)):
        b, a = B[p][0], A[p][0]
        say(f"    {p:12s} panel {panel.get(p, '-')!s:4s} app {b.get('overall')} -> {a.get('overall')}  "
            f"{CAP.desc(runs[p][0])}")
    say()
    say(f"{'ALL BARS PASS' if not fails else f'{fails} BAR(S) FAIL'}")
    (OUT / "report.txt").write_text("\n".join(lines) + "\n")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
