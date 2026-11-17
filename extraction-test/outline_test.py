#!/usr/bin/env python3
"""The cutout test (T98 round 3, Nov 17, $0): read the silhouette from the phone's own person cutout, using
scale-free shape ratios only, never widths in cm.

The founder (Nov 16): "Can't an iPhone make cutouts of people?... If we take that cutout and then use that as the
shape, what do you think about that?" ... "Run the free test, and then let me know how it goes."

Input: `kmeasure outline` JSON (vision/OutlineProbe.swift: Apple's person segmentation, the mask iOS uses for
cutouts, plus Apple's body joints; widths in px across each leg at fixed shares of the bone, and across the torso),
on the face-hidden copies of every photo he rated blind (founder4's 150 + the 20 of his first sheet). Three passes:
a as is, b at 1600 px with 3% cropped off each side, c reframed off-center (4% shift). Joint gate 0.1 (as T98).

Ratios (all px / px, so no scale and no cm):
  ankle/knee   the leg just above the ankle against the knee       (taper below the knee: skinny < slim < straight)
  knee/thigh   the knee against mid-thigh                          (taper above the knee)
  ankle/thigh  both together
  top/legs     the torso outline at 60-80% of shoulders -> hips against both thighs side by side (top- vs bottom-heavy)
  shorts hem   where the leg outline steps in by 25%+ between mid-thigh and mid-shin (a wide shorts hem), against the knee
Body-size leak check: does a ratio follow the build when the clothes are held the same? Build proxies come from the
skeleton (shoulder-joint spacing over torso length) and, for pants that hug the leg, the leg's own girth over its
bone length.

  /usr/bin/python3 extraction-test/outline_test.py collect <dir with a/ b/ c/>   -> results/reading-proportions/outline.csv
  /usr/bin/python3 extraction-test/outline_test.py report > extraction-test/results/reading-proportions/outline.txt
Every photo is "profile unknown". Nothing here rates a body; the leak check exists to prove a ratio doesn't.
"""
import csv, json, sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean, median

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import proportions_test as PT  # noqa: E402

OUT = HERE / "results" / "reading-proportions"
G = PT.DATA / "inputs/gold-judge"
COLS = ("status", "why_legs", "thigh_w", "knee_w", "ankle_w", "calf_w", "ankle_knee", "knee_thigh", "ankle_thigh",
        "top_w", "top_legs", "hem_pos", "hem_drop", "shoulder_span", "torso_len", "thigh_len", "girth", "broad", "hand_legs")


def pick(samples, ts):
    """The first measured width at any of the shares ts (in order), with the reasons the others failed."""
    why = []
    by = {round(s["t"], 2): s for s in samples or []}
    for t in ts:
        s = by.get(t)
        if s and "w" in s:
            return s["w"], why, s.get("hand", False)
        if s:
            why.append(s.get("why", "?"))
    return None, why, False


def features(j):
    if j.get("status") != "ok":
        return {"status": j.get("status")}
    f = {"status": "ok"}
    sides, whys, hand = [], Counter(), False
    for side in ("l", "r"):
        leg = (j.get("legs") or {}).get(side) or {}
        if not leg.get("thigh") or not leg.get("shin"):
            whys["no knee/ankle joints"] += 1
            continue
        th, w1, h1 = pick(leg["thigh"], (0.45, 0.6, 0.3))
        kn_a, w2, h2 = pick(leg["thigh"], (0.9,))
        kn_b, w3, h3 = pick(leg["shin"], (0.1,))
        an, w4, h4 = pick(leg["shin"], (0.85, 0.7, 0.95))
        ca, _, _ = pick(leg["shin"], (0.5,))
        kn = mean([v for v in (kn_a, kn_b) if v]) if (kn_a or kn_b) else None
        hand = hand or h1 or h2 or h3 or h4
        for w in w1 + w2 + w3 + w4:
            whys[w] += 1
        # the shorts hem: the biggest inward step along the leg between mid-thigh and mid-shin
        prof = [(-(1 - s["t"]), s["w"]) for s in leg["thigh"] if "w" in s and s["t"] >= 0.3] + \
               [(s["t"], s["w"]) for s in leg["shin"] if "w" in s and s["t"] <= 0.5]
        step = None
        for (p0, a), (p1, b) in zip(prof, prof[1:]):
            d = (a - b) / a
            if step is None or d > step[1]:
                step = ((p0 + p1) / 2, d)
        sides.append(dict(th=th, kn=kn, an=an, ca=ca, step=step, tl=leg.get("thigh_len")))
    def m(k):
        v = [s[k] for s in sides if s[k]]
        return mean(v) if v else None
    f.update(thigh_w=m("th"), knee_w=m("kn"), ankle_w=m("an"), calf_w=m("ca"), thigh_len=m("tl"))
    if f["knee_w"] and f["ankle_w"]:
        f["ankle_knee"] = f["ankle_w"] / f["knee_w"]
    if f["thigh_w"] and f["knee_w"]:
        f["knee_thigh"] = f["knee_w"] / f["thigh_w"]
    if f["thigh_w"] and f["ankle_w"]:
        f["ankle_thigh"] = f["ankle_w"] / f["thigh_w"]
    steps = [s["step"] for s in sides if s["step"]]
    if steps:
        best = max(steps, key=lambda x: x[1])
        f["hem_pos"], f["hem_drop"] = best
    f["why_legs"] = ";".join(f"{k}:{v}" for k, v in whys.most_common()) if not f.get("ankle_thigh") else ""
    f["hand_legs"] = hand
    tor = [s["w"] for s in j.get("torso") or [] if "w" in s and 0.6 <= s["s"] <= 0.8]
    if tor:
        f["top_w"] = median(tor)
        th = [s["th"] for s in sides if s["th"]]
        if len(th) == 2:
            f["top_legs"] = f["top_w"] / sum(th)
    f["shoulder_span"], f["torso_len"] = j.get("shoulder_span"), j.get("torso_len")
    if f["shoulder_span"] and f["torso_len"]:
        f["broad"] = f["shoulder_span"] / f["torso_len"]
    if f["thigh_w"] and f["thigh_len"]:
        f["girth"] = f["thigh_w"] / f["thigh_len"]
    return f


def collect(d):
    rows = []
    for p in ("a", "b", "c"):
        for fp in sorted((d / p).glob("*.json")):
            f = features(json.loads(fp.read_text()))
            rows.append({"id": fp.stem, "pass": p, **{k: ("" if f.get(k) is None else (round(f[k], 4) if isinstance(f[k], float) else f[k])) for k in COLS}})
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / "outline.csv").open("w", newline="") as fh:
        w = csv.DictWriter(fh, ["id", "pass", *COLS])
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {len(rows)} rows")


def load():
    M = defaultdict(dict)
    for r in csv.DictReader((OUT / "outline.csv").open()):
        d = {}
        for k in COLS:
            v = r[k]
            if k in ("status", "why_legs"):
                d[k] = v
            elif k == "hand_legs":
                d[k] = v == "True"
            else:
                d[k] = float(v) if v != "" else None
        M[r["pass"]][r["id"]] = d
    return M


def scores():
    s = {r["id"]: float(r["score"]) for r in csv.DictReader(open(PT.F4 / "ratings.csv"))}
    f2p = {x["fid"]: x["photo"] for x in json.load(open(G / "founder/manifest.json"))}
    for r in csv.DictReader(open(G / "founder/ratings.csv")):
        s[f2p[r["id"]]] = float(r["score"])
    return s


def report():
    lab, _ = PT.labels()
    R = PT.readings()
    S = scores()
    M = load()
    A = M["a"]
    say = print
    ids = sorted(A)

    def leg(p):
        return PT.rf(R[p][0])["leg"] if R.get(p) else None

    def is_pants(p):
        if p in lab:
            return lab[p]["bottom"] == "p"
        return bool(R.get(p)) and not PT.rf(R[p][0])["shorts"]

    say(f"# The cutout test (T98 round 3, $0): {len(ids)} photos he rated (founder4 150 + his first 20)\n")
    st = Counter(A[p]["status"] for p in ids)
    say(f"Cutout and joints found: {dict(st)}\n")

    # ---------- coverage
    say("## Coverage (pass a)\n")
    pants = [p for p in ids if is_pants(p)]
    got = [p for p in pants if A[p]["ankle_thigh"] is not None]
    say(f"- leg ratios measured on {len(got)}/{len(pants)} photos in pants")
    why = Counter()
    for p in pants:
        if A[p]["ankle_thigh"] is None:
            if A[p]["status"] != "ok":
                why[f"prep: {A[p]['status']}"] += 1
            else:
                w = A[p]["why_legs"] or "no width"
                why["legs merged (touching legs, crossed or walking, an arm or bag against them)" if "merged" in w
                    else "knee or ankle joints missing" if "joints" in w else w] += 1
    for k, v in why.most_common():
        say(f"  - skipped, {k}: {v}")
    say(f"- of the measured, a hand box sits on a measured leg point: {sum(A[p]['hand_legs'] for p in got)}")
    say(f"- top/legs measured on {sum(1 for p in ids if A[p]['top_legs'] is not None)}/{len(ids)}")

    # ---------- legs vs the reading and labels
    say("\n## Leg taper against the reading's leg shape and Claude's eye labels\n")
    for k in ("ankle_thigh", "ankle_knee", "knee_thigh"):
        g = defaultdict(list)
        for p in got:
            if A[p][k] is not None and leg(p):
                g[leg(p)].append(A[p][k])
        say(f"- `{k}` median by reading: " + ", ".join(f"{s} {median(v):.2f} (n {len(v)})" for s, v in sorted(g.items(), key=lambda kv: PT.LEG_ORDER.get(kv[0], 9))))
        xs = [(PT.LEG_ORDER[leg(p)], A[p][k]) for p in got if A[p][k] is not None and leg(p) in PT.LEG_ORDER]
        say(f"  Spearman with the reading's order (skinny 0 .. wide 4): {PT.spearman(*zip(*xs)):.2f}, n {len(xs)}")
        narrow = [A[p][k] for p in got if A[p][k] is not None and leg(p) in ("skinny", "slim")]
        other = [A[p][k] for p in got if A[p][k] is not None and leg(p) in PT.LEG_ORDER and leg(p) not in ("skinny", "slim")]
        a = PT.auc([-v for v in narrow], [-v for v in other])
        say(f"  narrow (reading skinny/slim) vs the rest: AUC {a:.2f}; leave-one-out right {PT.loo(narrow, other, False):.0%}")
        y = [A[p][k] for p in got if p in lab and lab[p]["tight_legs"] == "y" and A[p][k] is not None]
        n = [A[p][k] for p in got if p in lab and lab[p]["tight_legs"] == "n" and A[p][k] is not None]
        b = [A[p][k] for p in got if p in lab and lab[p]["tight_legs"] == "b" and A[p][k] is not None]
        say(f"  eye labels: tight {len(y)}, not narrow {len(n)}: AUC {PT.auc([-v for v in y], [-v for v in n]):.2f}, "
            f"leave-one-out {PT.loo(y, n, False):.0%}; medians tight {median(y):.2f}, slim {median(b):.2f}, not narrow {median(n):.2f}")

    # ---------- his ratings
    say("\n## Against his blind ratings\n")
    for k in ("ankle_thigh", "ankle_knee", "knee_thigh"):
        xs = [(A[p][k], S[p]) for p in got if A[p][k] is not None and p in S]
        both = [(A[p][k], PT.LEG_ORDER[leg(p)], S[p]) for p in got if A[p][k] is not None and p in S and leg(p) in PT.LEG_ORDER]
        say(f"- `{k}`: Spearman {PT.spearman(*zip(*xs)):.2f} (n {len(xs)}); on the same photos the reading's leg shape "
            f"{PT.spearman([b[1] for b in both], [b[2] for b in both]):.2f} and this ratio {PT.spearman([b[0] for b in both], [b[2] for b in both]):.2f} (n {len(both)})")
    xs = [(PT.LEG_ORDER[leg(p)], S[p]) for p in pants if p in S and leg(p) in PT.LEG_ORDER]
    say(f"- the reading's leg shape on every pants photo with a reading: Spearman {PT.spearman(*zip(*xs)):.2f} (n {len(xs)})")
    # does the ratio add anything inside a reading class?
    for cls in ("slim", "straight"):
        xs = [(A[p]["ankle_thigh"], S[p]) for p in got if leg(p) == cls and p in S]
        if len(xs) >= 8:
            say(f"- inside the reading's `{cls}`: ankle/thigh vs his score Spearman {PT.spearman(*zip(*xs)):.2f} (n {len(xs)})")
    tl = [(A[p]["top_legs"], S[p]) for p in ids if A[p]["top_legs"] is not None and p in S and is_pants(p)]
    say(f"- top/legs (pants): Spearman with his score {PT.spearman(*zip(*tl)):.2f} (n {len(tl)})")
    for grp in ("y", "b", "n"):
        v = [A[p]["top_legs"] for p in ids if p in lab and lab[p]["top_bulky"] == grp and A[p]["top_legs"] is not None]
        if v:
            say(f"  top/legs median for bulky-labelled {grp}: {median(v):.2f} (n {len(v)})")

    # ---------- steadiness
    say("\n## Steadiness (the same photo always gives the same numbers; these are reframed copies)\n")
    cut_at = None
    for k in ("ankle_thigh", "ankle_knee", "top_legs"):
        for q, name in (("b", "1600 px + 3% crop"), ("c", "4% off-center shift")):
            pairs = [(A[p][k], M[q][p][k]) for p in ids if p in M[q] and A[p][k] is not None and M[q][p][k] is not None]
            if not pairs:
                continue
            d = sorted(abs(x - y) for x, y in pairs)
            say(f"- `{k}` vs {name}: both measured {len(pairs)}; median change {median(d):.3f}, 90th percentile {d[int(0.9 * len(d))]:.3f}")
    # flips of the narrow call at a cut chosen on the reading
    narrow = [A[p]["ankle_thigh"] for p in got if leg(p) in ("skinny", "slim")]
    other = [A[p]["ankle_thigh"] for p in got if leg(p) in PT.LEG_ORDER and leg(p) not in ("skinny", "slim")]
    vals = sorted(set(narrow + other))
    best = max(((sum(v < c for v in narrow) + sum(v >= c for v in other), c) for c in
                ((x + y) / 2 for x, y in zip(vals, vals[1:]))), default=(0, None))
    cut_at = best[1]
    if cut_at:
        say(f"- the narrow call at ankle/thigh < {cut_at:.3f} (the best single cut against the reading):")
        for q, name in (("b", "1600 px + 3% crop"), ("c", "4% shift")):
            pairs = [(A[p]["ankle_thigh"], M[q][p]["ankle_thigh"]) for p in pants if p in M[q] and A[p]["ankle_thigh"] is not None
                     and M[q][p]["ankle_thigh"] is not None]
            if not pairs:
                continue
            fl = sum((x < cut_at) != (y < cut_at) for x, y in pairs)
            fires = sum((x < cut_at) or (y < cut_at) for x, y in pairs)
            lost = sum(1 for p in pants if A[p]["ankle_thigh"] is not None and (p not in M[q] or M[q][p]["ankle_thigh"] is None))
            say(f"  vs {name}: flips {fl}/{len(pairs)} ({fl / len(pairs):.0%}); {fl}/{fires} where it fires; "
                f"measured on a but not here: {lost}")

    # ---------- body size
    say("\n## Does it leak body size?\n")
    say("Build proxies: `broad` = shoulder-joint spacing / shoulder-to-hip length (skeleton only); "
        "`girth` = thigh outline / thigh bone length, read only on pants the reading calls skinny or slim, "
        "where the outline is close to the leg itself.")
    for k in ("ankle_thigh", "ankle_knee", "knee_thigh", "top_legs"):
        for cls in (("skinny", "slim"), ("straight",), ("wide", "barrel", "relaxed", "flare_bootcut")):
            xs = [(A[p][k], A[p]["broad"]) for p in ids if A[p][k] is not None and A[p]["broad"] and leg(p) in cls]
            gs = [(A[p][k], A[p]["girth"]) for p in ids if A[p][k] is not None and A[p]["girth"] and leg(p) in cls] if "skinny" in cls else []
            if len(xs) >= 8:
                line = f"- `{k}` in {'/'.join(cls)}: vs broad {PT.spearman(*zip(*xs)):+.2f} (n {len(xs)})"
                if gs and k != "top_legs":
                    line += f"; vs girth {PT.spearman(*zip(*gs)):+.2f} (n {len(gs)})"
                say(line)
    xs = [(A[p]["girth"], S[p]) for p in ids if A[p]["girth"] and p in S and leg(p) in ("skinny", "slim")]
    if len(xs) >= 8:
        say(f"- girth (skinny/slim pants) vs his score: Spearman {PT.spearman(*zip(*xs)):+.2f} (n {len(xs)}) "
            "(a check that the score doesn't follow build; not a measure to use)")

    # ---------- shorts
    say("\n## Shorts: the hem as a step in the outline\n")
    sh = [p for p in ids if p in lab and lab[p]["bottom"] == "s"]
    right = n = 0
    rows = []
    for p in sh:
        f = A[p]
        if f["hem_pos"] is None or f["hem_drop"] is None or f["hem_drop"] < 0.25:
            rows.append(f"{p} {lab[p]['shorts_length']}: no step")
            continue
        n += 1
        above = f["hem_pos"] < -0.1
        right += above == (lab[p]["shorts_length"] == "above")
        rows.append(f"{p} {lab[p]['shorts_length']}: step at {f['hem_pos']:+.2f} ({f['hem_drop']:.0%})")
    say(f"- a 25%+ step found on {n}/{len(sh)}; above-the-knee call right {right}/{n}")
    say("- " + "; ".join(rows))


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "collect":
        collect(Path(sys.argv[2]))
    elif len(sys.argv) > 1 and sys.argv[1] == "report":
        report()
    else:
        print(__doc__)
