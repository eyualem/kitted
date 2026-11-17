#!/usr/bin/env python3
"""Score the AI-judge runs against v16's bars (Nov 17, 2026; $0). Test only: nothing in the app changes.

  KITTED_DATA=<main checkout> /usr/bin/python3 score_runs.py [--judge claude|gemini]

Reads the judges' answers (inputs/ai-judge/out/ for Claude, out-gemini/ for Gemini) and the key (.key/), and writes
aggregate numbers only (no per-photo ratings) to extraction-test/results/ai-judge1/report-<judge>.txt.

The bars, as tasks/T68/TASK.md and v16_paper.py count them:
  B1 within 1 point of his blind ratings (bar 80%) and r with him (bar 0.69): on all 164, and on the 8 held-out halves
     taste_rules.py uses (seeds 1-8). The AI is fitted on nothing of his, so every photo is held out for it; v16's
     sizes were fitted on all 164, so its in-sample number here is a little flattering (its honest held-out: 82.0%,
     r 0.63, from T68 round 7).
  B2 the creators' 6 before/after pairs the right way (median of 3 runs, and each run).
  B3 the creators' anchors: step <= 5.5 -> 6 or under; step <= 7.5 -> 6 to 8; above -> 7.5 or over.
  B4 the dealbreaker examples (written, Variant T) at or under their caps; the spared ones above; "depends" 5.5-7 with
     the loud version below the quiet one.
  B5 band shares on his 164 against the target (5/15/30/30/15/5) and against his own.
  B6 steadiness: two runs within half a point (v16's bar: 218 of 223 = 97.8%). Each run saw a fresh order and fresh
     neighbours, so this is also the order-swap test for absolute scores. Pairs (Variant P): verdict flips when A
     and B swap.
  NOTE: W/WG/Wm here use the full-fit v16 (its sizes saw half B), so they are flattered; the honest blend is
     refit_blend.py (v16 refit on each half A).
  Hybrids: (G) the AI's score inside the code's guardrails (3-9.5, v16's dealbreaker cap on that photo's reading);
     (W) a blend w*AI + (1-w)*v16, w fitted on half A of each split, tested on half B; (WG) the blend, then the caps.
"""
import glob
import json
import math
import os
import random
import re
import statistics as st
import sys
from collections import Counter
from pathlib import Path

DATA = Path(os.environ["KITTED_DATA"])
J = DATA / "inputs" / "ai-judge"
HERE = Path(__file__).resolve().parent
TARGET = [0.05, 0.15, 0.30, 0.30, 0.15, 0.05]
BANDS = [("3-4.5", 3, 4.5), ("5-5.5", 5, 5.5), ("6-6.5", 6, 6.5), ("7-7.5", 7, 7.5), ("8-8.5", 8, 8.5), ("9-9.5", 9, 9.5)]
BODY = re.compile(r"\b(body|build|weight|skinny guy|slim guy|muscl\w*|belly|physique|tall|short guy|face|skin|hair|"
                  r"attractive|chest is|his frame|frame)\b", re.I)


def pearson(a, b):
    ma, mb = st.mean(a), st.mean(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
    return num / den if den else float("nan")


def half(x):
    return math.floor(x * 2 + 0.5) / 2


def band(x):
    for i, (_, lo, hi) in enumerate(BANDS):
        if lo <= x <= hi:
            return i
    return 0 if x < 5 else 5


def shares(xs):
    c = Counter(band(x) for x in xs)
    return [c[i] / len(xs) for i in range(6)]


def fmt(s):
    return "  ".join(f"{BANDS[i][0]} {100 * v:4.1f}%" for i, v in enumerate(s))


def w1(xs, hv):
    return sum(abs(x - y) <= 1 for x, y in zip(xs, hv))


def load(judge):
    out = J / ("out" if judge == "claude" else f"out-{judge}")
    runs = {}
    for r in (1, 2, 3):
        kf = J / ".key" / f"run{r}.json"
        if not kf.exists():
            continue
        key = json.loads(kf.read_text())
        got = {}
        for f in glob.glob(str(out / f"run{r}-*.jsonl")):
            for line in open(f):
                line = line.strip()
                if not line:
                    continue
                d = json.loads(line)
                if d.get("id") in key:
                    got[key[d["id"]]["photo"]] = d
        if got:
            runs[r] = got
    return runs, out


def main():
    judge = sys.argv[sys.argv.index("--judge") + 1] if "--judge" in sys.argv else "claude"
    truth = json.loads((J / ".key" / "truth.json").read_text())
    runs, out = load(judge)
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    R = sorted(k for k, v in truth.items() if v["kind"] == "rated")
    say(f"AI judge test, judge = {judge}; runs found: {sorted(runs)}; answers per run: "
        + ", ".join(f"run {r} {len(v)}" for r, v in runs.items()) + f" of {len(truth)}")
    sc = {r: {k: d.get("score") for k, d in v.items()} for r, v in runs.items()}
    nr = [k for r in sc for k, x in sc[r].items() if x is None]
    say(f"  not rated / no score: {len(nr)} answers" + (f" ({', '.join(sorted(set(nr)))})" if nr else ""))
    full = [k for k in truth if all(sc[r].get(k) is not None for r in sc)]
    med = {k: st.median(sc[r][k] for r in sc) for k in full}
    say()

    # ------------------------------------------------------------------ B1
    say("== B1 His blind ratings (bar: within 1 point on 80%, r >= 0.69) ==")
    Rk = [k for k in R if k in med]
    for keyname in ("his", "key"):
        hv = [truth[k][keyname] for k in Rk]
        say(f"  {'his raw ratings' if keyname == 'his' else 'his consistent key'} ({len(Rk)} photos):")
        rows = [("v16 (in-sample: its sizes were fitted on these)", [truth[k]["v16"] for k in Rk]),
                ("v15 (the app today)", [truth[k]["v15"] for k in Rk])]
        rows += [(f"AI run {r} (one call per photo)", [sc[r][k] for k in Rk]) for r in sc]
        rows += [("AI median of the runs (3x the cost)", [med[k] for k in Rk])]
        for name, xs in rows:
            say(f"    {name:48s} within 1 {w1(xs, hv):3d}/{len(hv)} ({100 * w1(xs, hv) / len(hv):4.1f}%)  "
                f"r {pearson(xs, hv):.3f}  mean {st.mean(xs):.2f} (his {st.mean(hv):.2f})  sd {st.pstdev(xs):.2f} "
                f"(his {st.pstdev(hv):.2f})")
    say(f"  AI run 1 vs v16: r {pearson([sc[min(sc)][k] for k in Rk], [truth[k]['v16'] for k in Rk]):.3f}")
    say("  by group (AI run average | v16), raw:")
    for g in ("his first 20", "sheet 1 (gold photos)", "sheet 2", "the 20 new"):
        ks = [k for k in Rk if truth[k]["group"] == g]
        if len(ks) < 5:
            continue
        hv = [truth[k]["his"] for k in ks]
        aw = st.mean(w1([sc[r][k] for k in ks], hv) / len(ks) for r in sc)
        ar = st.mean(pearson([sc[r][k] for k in ks], hv) for r in sc)
        v = [truth[k]["v16"] for k in ks]
        say(f"    {g:24s} n {len(ks):3d}  AI within 1 {100 * aw:4.1f}% r {ar:.3f}  |  v16 {100 * w1(v, hv) / len(ks):4.1f}% "
            f"r {pearson(v, hv):.3f}")

    # held-out halves, plus the hybrids fitted on half A
    caps = {k: truth[k].get("cap") for k in Rk}

    def guard(x, k):
        c = caps.get(k)
        return max(3.0, min(9.5, x if c is None else min(x, c)))

    def blend(w, k, a):
        return half(w * a + (1 - w) * truth[k]["v16"])

    def obj(xs, hv):
        return pearson(xs, hv) + w1(xs, hv) / len(hv)
    say()
    say("== B1 on the 8 held-out halves (seeds 1-8, the split taste_rules.py uses; averages, range in brackets) ==")
    arms = {}
    first = min(sc)
    for seed in range(1, 9):
        sh = sorted(Rk)
        random.Random(seed).shuffle(sh)
        A, B = sorted(sh[: len(sh) // 2]), sorted(sh[len(sh) // 2:])
        hA, hB = [truth[k]["his"] for k in A], [truth[k]["his"] for k in B]
        best = {}
        for nm, src in (("W", lambda k: sc[first][k]), ("Wm", lambda k: med[k])):
            ws = [i / 10 for i in range(11)]
            best[nm] = max(ws, key=lambda w: obj([blend(w, k, src(k)) for k in A], hA))
            best[nm + "G"] = max(ws, key=lambda w: obj([guard(blend(w, k, src(k)), k) for k in A], hA))
        cand = {
            "v16 (in-sample)": [truth[k]["v16"] for k in B],
            "AI, one call (run average)": None,
            "AI median of 3": [med[k] for k in B],
            "G: AI one call inside the guardrails": [guard(sc[first][k], k) for k in B],
            "W: blend, AI one call + v16": [blend(best["W"], k, sc[first][k]) for k in B],
            "WG: blend + guardrails": [guard(blend(best["WG"], k, sc[first][k]), k) for k in B],
            "Wm: blend, AI median of 3 + v16": [blend(best["Wm"], k, med[k]) for k in B],
        }
        for nm, xs in cand.items():
            if xs is None:
                vals = [(w1([sc[r][k] for k in B], hB) / len(B), pearson([sc[r][k] for k in B], hB)) for r in sc]
                v = (st.mean(a for a, _ in vals), st.mean(b for _, b in vals))
            else:
                v = (w1(xs, hB) / len(B), pearson(xs, hB))
            arms.setdefault(nm, []).append(v + ((best.get({"W: blend, AI one call + v16": "W",
                                                           "WG: blend + guardrails": "WG",
                                                           "Wm: blend, AI median of 3 + v16": "Wm"}.get(nm, ""))),))
    for nm, vs in arms.items():
        a = [v[0] for v in vs]
        b = [v[1] for v in vs]
        wtxt = ""
        if vs[0][2] is not None:
            wtxt = "  AI weight " + "/".join(f"{v[2]:.1f}" for v in vs)
        say(f"  {nm:40s} within 1 {100 * st.mean(a):4.1f}% ({100 * min(a):.0f}-{100 * max(a):.0f})  r {st.mean(b):.3f} "
            f"({min(b):.2f}-{max(b):.2f}){wtxt}")
    say("  v16's honest held-out (T68 round 7, sizes refitted on each half A): 82.0%, r 0.63 (raw); 81.1%, r 0.62 (key)")

    # ------------------------------------------------------------------ B2, B3
    say()
    say("== B2 The creators' before/after pairs (the after must score higher) ==")
    pairs = [("wIib9hzVUuw/o1-before-04-10", "wIib9hzVUuw/o1-after-04-52", "oversized tee + denim jacket over skinny jeans -> relaxed jeans, cropped jacket"),
             ("wIib9hzVUuw/o2-before-05-30", "wIib9hzVUuw/o2-after-06-14", "knit on knit -> one knit, relaxed light jeans"),
             ("wIib9hzVUuw/o3-before-07-26", "wIib9hzVUuw/o3-after-09-07", "all-navy flannel + jeans -> black flannel, tank, pleated trousers, loafers"),
             ("wIib9hzVUuw/o4-before-09-30", "wIib9hzVUuw/o4-after-10-02", "tight beige monochrome -> wider trousers, tucked tee, loafers"),
             ("wIib9hzVUuw/o5-before-10-18", "wIib9hzVUuw/o5-after-11-22", "skinny joggers -> straight trousers, plain sweater"),
             ("k6Gig6r7BSQ/before-longer-tee-10-47", "k6Gig6r7BSQ/after-shorter-tee-10-47", "Frugal: the same tee 4 in shorter")]
    ok_m = 0
    per_run = Counter()
    for w, b, what in pairs:
        if w not in med or b not in med:
            say(f"  ----  missing  {what}")
            continue
        ok = med[b] > med[w]
        ok_m += ok
        for r in sc:
            per_run[r] += sc[r][b] > sc[r][w]
        say(f"  {'PASS' if ok else 'FAIL'}  AI {med[w]:g} -> {med[b]:g}  (runs " +
            ", ".join(f"{sc[r][w]:g}->{sc[r][b]:g}" for r in sc) + f")   v16 {truth[w]['v16']:g} -> {truth[b]['v16']:g}   {what}")
    say(f"B2 median of runs: {ok_m}/6 (v16 6/6); each run: " + ", ".join(f"run {r} {per_run[r]}/6" for r in sc))
    say()
    say("== B3 The creators' anchors (step from the rulebook; median of runs) ==")
    ok3, n3 = 0, 0
    for k, t in truth.items():
        if t["kind"] != "creator" or t.get("step") is None or k not in med:
            continue
        step, m = t["step"], med[k]
        ok = (m <= 6.0) if step <= 5.5 else (6.0 <= m <= 8.0) if step <= 7.5 else (m >= 7.5)
        ok3 += ok
        n3 += 1
        say(f"  {'PASS' if ok else 'FAIL'}  step {step:g}: AI {m:g} (runs {'/'.join(f'{sc[r][k]:g}' for r in sc)})  "
            f"v16 {t['v16']:g}   {t['pieces']}")
    say(f"B3 {ok3}/{n3} (v16 17/18)")

    # ------------------------------------------------------------------ B4
    say()
    say("== B4 The dealbreaker examples, written (Variant T; each run is a fresh order) ==")
    wr = {}
    for r in (1, 2, 3):
        kf, of = J / ".key" / f"written{r}.json", out / f"written{r}.jsonl"
        if not (kf.exists() and of.exists()):
            continue
        key = json.loads(kf.read_text())
        for line in open(of):
            if line.strip():
                d = json.loads(line)
                if d["id"] in key:
                    wr.setdefault(tuple(key[d["id"]]), {})[r] = d.get("score")
    rows = json.loads((HERE / "dealbreakers.json").read_text())["rows"]
    passes, total = 0, 0
    for x in rows:
        kk = (x["row"], x["kind"], x.get("version"))
        got = wr.get(kk, {})
        if not got:
            continue
        m = st.median(v for v in got.values() if v is not None)
        runs_txt = "/".join(f"{v:g}" for _, v in sorted(got.items()))
        if x["kind"] == "cap":
            ok = m <= x["cap"]
        elif x["kind"] == "spared":
            ok = m > x["cap"]
        elif x["kind"] == "anchor":
            ok = abs(m - x["target"]) <= 0.5
        else:
            ok = 5.5 <= m <= 7.0
        if x["kind"] == "depends" and x["version"] == "loud":
            q = wr.get((x["row"], "depends", "quiet"), {})
            if q:
                ok = ok and m < st.median(q.values())
        passes += ok
        total += 1
        lim = f"cap {x['cap']:g}" if x["kind"] in ("cap", "spared") else (f"target {x['target']:g}" if x["kind"] == "anchor"
                                                                            else "5.5-7")
        say(f"  {x['row']:6s} {x['kind']:7s} {x.get('version') or '':5s} {'PASS' if ok else 'FAIL'}  AI {m:g} ({runs_txt})  {lim}  "
            f"{x['text']}")
    if total:
        say(f"B4 {passes}/{total} (v16: every row but H7, which is a tip by his call)")
    else:
        say("B4: no written answers found")

    # ------------------------------------------------------------------ B5
    say()
    say("== B5 Band shares on his 164 ==")
    say(f"  target                {fmt(TARGET)}")
    for name, xs in (("his ratings", [truth[k]["his"] for k in Rk]), ("v16", [truth[k]["v16"] for k in Rk]),
                     ("AI run 1", [sc[first][k] for k in Rk]), ("AI median", [med[k] for k in Rk])):
        s = shares(xs)
        gap_t = max(abs(a - b) for a, b in zip(s, TARGET)) * 100
        gap_h = max(abs(a - b) for a, b in zip(s, shares([truth[k]["his"] for k in Rk]))) * 100
        say(f"  {name:20s}  {fmt(s)}   worst gap to target {gap_t:4.1f}, to his {gap_h:4.1f}")

    # ------------------------------------------------------------------ B6
    say()
    say("== B6 Steadiness (bar: two runs within half a point on 97.8%, v16's 218/223) ==")
    rs = sorted(sc)
    for i in range(len(rs)):
        for j in range(i + 1, len(rs)):
            ks = [k for k in truth if sc[rs[i]].get(k) is not None and sc[rs[j]].get(k) is not None]
            d = [abs(sc[rs[i]][k] - sc[rs[j]][k]) for k in ks]
            say(f"  run {rs[i]} vs run {rs[j]}: same {sum(x == 0 for x in d)}/{len(d)} ({100 * sum(x == 0 for x in d) / len(d):.0f}%), "
                f"within 0.5 {sum(x <= 0.5 for x in d)}/{len(d)} ({100 * sum(x <= 0.5 for x in d) / len(d):.1f}%), "
                f"within 1 {sum(x <= 1 for x in d)} ({100 * sum(x <= 1 for x in d) / len(d):.1f}%), "
                f"2+ apart {sum(x >= 2 for x in d)}")
    if len(rs) >= 3:
        spread = [max(sc[r][k] for r in rs) - min(sc[r][k] for r in rs) for k in full]
        say(f"  all {len(rs)} runs within 0.5: {sum(x <= 0.5 for x in spread)}/{len(spread)} "
            f"({100 * sum(x <= 0.5 for x in spread) / len(spread):.1f}%); mean spread {st.mean(spread):.2f}; "
            f"same band all runs {sum(len({band(sc[r][k]) for r in rs}) == 1 for k in full)}/{len(full)}")
        g = [k for k in full if truth[k].get("cap") is not None]
        if g:
            say(f"  G (inside the guardrails), all runs within 0.5: "
                f"{sum(max(guard(sc[r][k], k) for r in rs) - min(guard(sc[r][k], k) for r in rs) <= 0.5 for k in full)}/{len(full)}")
    pk = J / ".key" / "pairs.json"
    if pk.exists():
        key = json.loads(pk.read_text())
        ans = {}
        for o in (1, 2):
            f = out / f"pairs-order{o}.jsonl"
            if f.exists():
                for line in open(f):
                    if line.strip():
                        d = json.loads(line)
                        ans[d["pair"]] = d
        by_n = {}
        for e in key:
            a = ans.get(e["pair"])
            if a is None:
                continue
            pick = {"A": e["A"], "B": e["B"]}.get(a.get("better"), "same")
            by_n.setdefault(e["n"], {})[e["order"]] = (pick, e["better"], e["kind"])
        both = {n: v for n, v in by_n.items() if len(v) == 2}
        if both:
            flips = sum(v[1][0] != v[2][0] for v in both.values())
            right = Counter()
            for v in both.values():
                for o in (1, 2):
                    right[v[o][2]] += v[o][0] == v[o][1]
            nk = Counter(v[1][2] for v in both.values())
            first_pick = sum(1 for e in key if e["pair"] in ans and ans[e["pair"]].get("better") == "A")
            say(f"  pairs (Variant P), {len(both)} shown both ways: the verdict changes when A and B swap on {flips}/{len(both)} "
                f"({100 * flips / len(both):.0f}%; ZOZO 2024's GPT-4o: 57-74%); picked A {first_pick} of {2 * len(both)} answers")
            for kind in ("creator", "rated"):
                if nk[kind]:
                    say(f"    {kind:8s} pairs: the better one (creator's after / his higher) picked on {right[kind]}/{2 * nk[kind]} answers")
            abs_right = sum(med[w] < med[b] for _, w, b in [(e["kind"], *sorted((e["A"], e["B"]),
                            key=lambda k: e["better"] == k)) for e in key if e["order"] == 1 and e["kind"] == "rated"]
                            if w in med and b in med)
            say(f"    the same rated pairs by the absolute scores (median of runs): his order on {abs_right}/{nk['rated']}")

    # ------------------------------------------------------------------ the words
    say()
    say("== The words (hard lines: never the body; the look it reads as) ==")
    reasons = [(r, k, d.get("reason", "")) for r, v in runs.items() for k, d in v.items()]
    hits = [(r, k, x) for r, k, x in reasons if BODY.search(x or "")]
    say(f"  reasons naming a body or face word: {len(hits)} of {len(reasons)} (checked by hand below)")
    for r, k, x in hits[:12]:
        say(f"    run {r}: {x[:160]}")
    looks = Counter(d.get("look") for v in runs.values() for d in v.values())
    say("  looks: " + ", ".join(f"{a} {b}" for a, b in looks.most_common()))
    lw = [len((d.get("reason") or "").split()) for v in runs.values() for d in v.values()]
    say(f"  reason length: median {st.median(lw):.0f} words, max {max(lw)}")
    look_same = sum(len({runs[r][k].get("look") for r in rs}) == 1 for k in full)
    say(f"  same look in all runs: {look_same}/{len(full)}")

    dst = HERE.parent / "results" / "ai-judge1"
    dst.mkdir(parents=True, exist_ok=True)
    (dst / f"report-{judge}.txt").write_text("\n".join(lines) + "\n")
    print(f"\n-> {dst / f'report-{judge}.txt'}")


if __name__ == "__main__":
    sys.exit(main())
