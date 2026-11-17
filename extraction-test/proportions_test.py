#!/usr/bin/env python3
"""Reading test for proportions (T98, Nov 16, $0): can the app see the four things the founder's blind ratings punish
that today's reading is said to miss? Tight or skinny legs, a top that's too long, a bulky top, and shorts that don't
work (length, fit, and the top over them).

No model calls. Three sources against Claude's eye labels (proportions_labels.csv: 150 founder4 photos, written and
committed before any run; long-top truth also from the Nov 14 longtop_labels.csv, 62 photos):
  1. today's stored readings (the scoring call's leg_shape, length, volume, tucked): results/gold1/raw.json (2 runs
     per gold photo, also used for steadiness on all 225 gold photos) and results/rated1/raw.json on the T68 branch
     (1 run, the rest of founder4);
  2. the body ruler on the Mac (`kmeasure waist`: Apple Vision's joints and outline on the face-hidden copy; the top's
     end as t, the share of the way from the shoulders (0) to the knees (1), crotch at 0.619; leg widths in body-ruler
     cm), and the shorts ruler (`kmeasure ruler --shorts`);
  3. the same rulers on a 1600 px, 3%-cropped copy, for steadiness. The same photo twice gives the identical answer
     (code is deterministic; checked on 8 photos), so the resized copy is the harder test.

Joint gate: Apple's joints come back with low confidence on face-hidden copies (the head block), so passes c/d lower
it to 0.1 (RULER_JOINT_MIN=0.1 RULER_HIP_MIN=0.1); passes a/b keep the default 0.3. On the phone the joints come from
the original photo, before faces are hidden.

  /usr/bin/python3 extraction-test/proportions_test.py collect <scratch dir with a/ b/ c/ d/ shorts/>
      writes results/reading-proportions/measures.csv (the numbers the report uses)
  /usr/bin/python3 extraction-test/proportions_test.py report > extraction-test/results/reading-proportions/numbers.txt

Every photo is "profile unknown" (CLAUDE.md rule 6). Nothing here scores a body: widths in cm include the leg or torso
under the clothes, so they're reported only to show why they're not used.
"""
import csv, json, subprocess, sys
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean

HERE = Path(__file__).resolve().parent
OUT = HERE / "results" / "reading-proportions"
DATA = Path("/Users/eyu/Desktop/files/Kitted")
F4 = DATA / "inputs/gold-judge/founder4"
GOLD_RAW = DATA / "extraction-test/results/gold1/raw.json"
RATED_REF = "origin/claude/rescoring-v16-58d34b:extraction-test/results/rated1/raw.json"
LONGTOP_REF = "origin/claude/rescoring-v16-58d34b:extraction-test/longtop_labels.csv"
T_CROTCH = 0.619  # BodyRuler (ANSUR II): the crotch as a share of shoulder -> knee
LEFT_OUT = {"C001", "C013", "C032", "C064", "C071", "C140"}  # prep finds no head on the face-hidden copy (T68)
FIELDS = ("status", "why", "top_end", "visual", "class4", "shoulder_cm", "top_hem_cm", "thigh_cm", "knee_cm",
          "shin_cm", "low_cm", "low_over_thigh", "shin_over_thigh", "shorts_value", "shorts_pos")
LEG_ORDER = {"skinny": 0, "slim": 1, "straight": 2, "relaxed": 3, "flare_bootcut": 3, "wide": 4, "barrel": 4}
LEN_ORDER = {"cropped": 0, "at_belt": 1, "mid_fly": 2, "below_crotch": 3}


def git_show(ref):
    return subprocess.run(["git", "-C", str(HERE), "show", ref], capture_output=True, text=True, check=True).stdout


# ---------------------------------------------------------------- inputs

def labels():
    lab = {r["id"]: r for r in csv.DictReader((HERE / "proportions_labels.csv").open())}
    lt = {r["id"]: r for r in csv.DictReader(git_show(LONGTOP_REF).splitlines())}
    return lab, lt


def his_scores():
    return {r["id"]: float(r["score"]) for r in csv.DictReader(open(F4 / "ratings.csv"))}


def gold_runs():
    gold = defaultdict(list)
    for r in json.load(open(GOLD_RAW)):
        if isinstance(r.get("json"), dict) and "garments" in r["json"]:
            gold[r["photo"]].append(r["json"])
    return gold


def readings():
    """{C-id or gold photo id: [reading, ...]}."""
    g2p = {m["gid"]: m["photo"] for m in json.load(open(DATA / "inputs/gold-judge/manifest.json"))}
    key = {r["id"]: r for r in csv.DictReader(open(F4 / ".mapping/mapping.csv"))}
    gold = gold_runs()
    out = defaultdict(list)
    for c, k in key.items():
        p = g2p.get(k["gold_id"])
        if p and p in gold:
            out[c] = gold[p]
    for r in json.loads(git_show(RATED_REF)):
        if r["kind"] == "read" and isinstance(r.get("json"), dict):
            out[r["photo"]].append(r["json"])
    for p, v in gold.items():
        out[p] = v
    return out


def rf(j):
    """The reading's fields this test uses."""
    g = j.get("garments", [])
    b = next((x for x in g if x["category"] == "bottom"), {})
    tops = [x for x in g if x["category"] == "top"]
    outer = [x for x in g if x["category"] == "outerwear"]
    return {
        "leg": b.get("leg_shape"), "shorts": "shorts" in b.get("subcategory", ""), "bottom_vol": b.get("volume", 0),
        "length": tops[0]["length"] if tops else "na",
        "tucked": any(x.get("tucked") in ("full", "front") for x in tops),
        "outer": bool(outer),
        "top_vol": max([x.get("volume", 0) for x in tops] or [0]),
        "upper_vol": max([x.get("volume", 0) for x in tops + outer] or [0]),
    }


def collect(scratch):
    rows = []
    for p in ("a", "b", "c", "d"):
        for f in sorted((scratch / p).glob("*.json")):
            j = json.loads(f.read_text())
            bf = (j.get("rulers") or {}).get("body_fit") or {}
            si = j.get("silhouette") or {}
            w = j.get("waist") or {}
            rows.append({"id": f.stem, "pass": p, "status": j.get("status"), "why": w.get("why"),
                         "top_end": bf.get("top_end_s"), "visual": bf.get("visual_s"), "class4": w.get("class4"),
                         **{k: si.get(k) for k in FIELDS[5:12]},
                         "shin_over_thigh": (j.get("legs") or {}).get("shin_over_thigh")})
    for f in sorted((scratch / "shorts").glob("*.json")):
        s = json.loads(f.read_text()).get("shorts_length") or {}
        stem = f.name[:-len(".json")]
        p = "shorts_b" if stem.endswith(".b") else "shorts_a"
        rows.append({"id": stem.replace(".b", ""), "pass": p, "shorts_value": s.get("value"), "shorts_pos": s.get("pos")})
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / "measures.csv").open("w", newline="") as fh:
        wr = csv.DictWriter(fh, ["id", "pass", *FIELDS])
        wr.writeheader()
        for r in rows:
            wr.writerow({k: ("" if v is None else v) for k, v in r.items()})
    print(f"wrote {len(rows)} rows to {OUT / 'measures.csv'}")


def measures():
    M = defaultdict(dict)
    for r in csv.DictReader((OUT / "measures.csv").open()):
        d = {}
        for k in FIELDS:
            v = r.get(k, "")
            try:
                d[k] = float(v) if v != "" and k not in ("status", "why", "class4", "shorts_value") else (v or None)
            except ValueError:
                d[k] = v
        M[r["pass"]][r["id"]] = d
    return M


# ---------------------------------------------------------------- statistics

def auc(pos, neg):
    if not pos or not neg:
        return None
    return sum((p > n) + 0.5 * (p == n) for p in pos for n in neg) / (len(pos) * len(neg))


def loo(pos, neg, higher):
    """Leave-one-out accuracy of one threshold: each photo is judged by a cut fitted without it."""
    pts = [(v, 1) for v in pos] + [(v, 0) for v in neg]
    if len(pos) < 2 or len(neg) < 2:
        return None

    def fit(data):
        vals = sorted({v for v, _ in data})
        best = (-1, None)
        for i in range(len(vals) - 1):
            c = (vals[i] + vals[i + 1]) / 2
            acc = sum(((v > c) if higher else (v < c)) == bool(y) for v, y in data)
            best = max(best, (acc, c), key=lambda t: t[0])
        return best[1]

    right = 0
    for i, (v, y) in enumerate(pts):
        c = fit(pts[:i] + pts[i + 1:])
        right += c is not None and (((v > c) if higher else (v < c)) == bool(y))
    return right / len(pts)


def spearman(x, y):
    def rank(v):
        s = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(s):
            j = i
            while j + 1 < len(s) and v[s[j + 1]] == v[s[i]]:
                j += 1
            for k in range(i, j + 1):
                r[s[k]] = (i + j) / 2
            i = j + 1
        return r
    rx, ry = rank(x), rank(y)
    mx, my = mean(rx), mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den = (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5
    return num / den if den else 0.0


def pct(a, b):
    return f"{a}/{b} ({a / b:.0%})" if b else f"{a}/0"


# ---------------------------------------------------------------- the report

def report():
    lab, lt = labels()
    R = readings()
    S = his_scores()
    M = measures()
    gold = gold_runs()
    two = [v for v in gold.values() if len(v) == 2]
    say = print

    def first(c):
        return rf(R[c][0]) if R.get(c) else None

    def steady(fire, pool=None):
        """Flips between the two stored runs of each gold photo: all photos, and photos where either run fires."""
        pool = pool or two
        f = [(fire(rf(a)), fire(rf(b))) for a, b in pool]
        flips = sum(x != y for x, y in f)
        either = sum(x or y for x, y in f)
        return f"flips {pct(flips, len(f))} of photos; {pct(flips, either)} of photos where it fires"

    def by_score(key):
        g = defaultdict(list)
        for c in lab:
            k = key(c)
            if k is not None and c in S:
                g[k].append(S[c])
        return ", ".join(f"{k} {mean(v):.2f} (n {len(v)})" for k, v in sorted(g.items(), key=lambda kv: str(kv[0])))

    say("# Reading-proportions numbers (T98, $0). Labels: Claude's eye, Nov 16; long tops also Nov 14.\n")
    say(f"His 150 blind scores: mean {mean(S.values()):.2f}. Readings found for {sum(1 for c in lab if R.get(c))}/150.\n")

    # ---- 1. tight legs
    say("## 1. Tight or skinny legs (pants only)\n")
    pants = [c for c, r in lab.items() if r["bottom"] == "p"]
    for grp in "ynb":
        cnt = Counter(first(c)["leg"] for c in pants if lab[c]["tight_legs"] == grp and first(c))
        say(f"- labelled {dict(y='tight', n='not narrow', b='slim, not tights')[grp]}: reading says {dict(cnt.most_common())}")
    say(f"- his mean score by label: {by_score(lambda c: lab[c]['tight_legs'] if lab[c]['bottom'] == 'p' and lab[c]['tight_legs'] in 'ynb' else None)}")
    say(f"- his mean score by the reading's leg_shape: {by_score(lambda c: first(c)['leg'] if lab[c]['bottom'] == 'p' and first(c) else None)}")
    xs = [(LEG_ORDER[first(c)["leg"]], S[c]) for c in pants if first(c) and first(c)["leg"] in LEG_ORDER and c in S]
    say(f"- leg_shape (skinny 0 ... wide 4) against his score: Spearman {spearman(*zip(*xs)):.2f}, n {len(xs)}")
    say(f"- steadiness, `skinny`: {steady(lambda f: f['leg'] == 'skinny')}")
    say(f"- steadiness, `skinny or slim`: {steady(lambda f: f['leg'] in ('skinny', 'slim'))}")
    for p, name in (("a", "default gate"), ("c", "gate 0.1")):
        A, B = M[p], M[chr(ord(p) + 1)]
        for k in ("low_cm", "shin_cm", "low_over_thigh"):
            pos = [A[c][k] for c in pants if c in A and A[c][k] is not None and lab[c]["tight_legs"] == "y"]
            neg = [A[c][k] for c in pants if c in A and A[c][k] is not None and lab[c]["tight_legs"] == "n"]
            n_lab = sum(lab[c]["tight_legs"] in "yn" for c in pants if c not in LEFT_OUT)
            a = auc([-v for v in pos], [-v for v in neg])
            acc = loo(pos, neg, False)
            say(f"- ruler `{k}` ({name}): measured {len(pos) + len(neg)}/{n_lab} tight-or-not photos; "
                f"AUC {a:.2f}; leave-one-out right {acc:.0%}")
    xs = [(M["c"][c]["low_cm"], S[c]) for c in pants if c in M["c"] and M["c"][c]["low_cm"] is not None and c in S]
    say(f"- ruler low_cm (gate 0.1) against his score: Spearman {spearman(*zip(*xs)):.2f}, n {len(xs)}")
    slim = [c for c in pants if first(c) and first(c)["leg"] == "slim" and c in M["c"] and M["c"][c]["low_cm"] is not None]
    for grp in "yb":
        v = sorted(M["c"][c]["low_cm"] for c in slim if lab[c]["tight_legs"] == grp)
        say(f"- inside the reading's `slim`, ruler low_cm for labelled {grp}: {v}")

    # ---- 2. long top
    say("\n## 2. A top that's too long (past the crotch)\n")
    truth = {c: r["top_long"] for c, r in lab.items() if r["top_long"] in "ynb"}
    for p, r in lt.items():
        truth[p] = {"yes": "y", "no": "n", "borderline": "b"}.get(r["label"], "u")
    say(f"- truth: {dict(Counter(truth.values()))} (y long, b borderline, n not)")
    say(f"- his mean score by label: {by_score(lambda c: lab[c]['top_long'] if lab[c]['top_long'] in 'ynb' else None)}")
    say(f"- his mean score by the reading's top length: {by_score(lambda c: first(c)['length'] if first(c) else None)}")
    xs = [(LEN_ORDER.get(first(c)["length"], 1), S[c]) for c in lab if first(c) and c in S
          and not first(c)["outer"] and not first(c)["tucked"] and first(c)["length"] != "na"]
    say(f"- untucked, no jacket: the reading's length against his score: Spearman {spearman(*zip(*xs)):.2f}, n {len(xs)}")
    xs = [(M["c"][c]["top_end"], S[c]) for c in lab if first(c) and c in S and c in M["c"] and M["c"][c]["top_end"]
          is not None and not first(c)["outer"] and not first(c)["tucked"]]
    say(f"- untucked, no jacket: the ruler's top end against his score: Spearman {spearman(*zip(*xs)):.2f}, n {len(xs)}")
    say(f"- steadiness, `below_crotch`: {steady(lambda f: f['length'] == 'below_crotch')}")
    say(f"- steadiness, `mid_fly or below_crotch`: {steady(lambda f: f['length'] in ('mid_fly', 'below_crotch'))}")

    def t_of(m):
        return None if not m else (m["top_end"] if m["top_end"] is not None else m["visual"])

    def long_rule(p, f, m, cut, rule):
        if f["outer"] or f["tucked"]:
            return False
        t = t_of(m)
        if rule == "reading below_crotch":
            return f["length"] == "below_crotch"
        if rule == "reading mid_fly or lower":
            return f["length"] in ("mid_fly", "below_crotch")
        if t is None:
            return None
        if rule == "ruler":
            return t >= cut
        return t >= cut and f["length"] in ("mid_fly", "below_crotch")  # ruler + reading

    for rule, cut in (("reading below_crotch", None), ("reading mid_fly or lower", None), ("ruler", 0.62),
                      ("ruler + reading", 0.60), ("ruler + reading", 0.62), ("ruler + reading", 0.64)):
        tab, flips, nb = Counter(), 0, 0
        for p, y in truth.items():
            f = first(p)
            if not f:
                continue
            a = long_rule(p, f, M["c"].get(p), cut, rule)
            tab[(y, "?" if a is None else a)] += 1
            if a is not None and rule.startswith("ruler") and M["d"].get(p) and t_of(M["d"][p]) is not None:
                nb += 1
                flips += long_rule(p, f, M["d"][p], cut, rule) != a
        tag = f"{rule}" + (f" at t {cut}" if cut else "")
        st = f"; flips on the resized copy {pct(flips, nb)}" if nb else ""
        say(f"- {tag} (no jacket, untucked): long caught {tab[('y', True)]}/{tab[('y', True)] + tab[('y', False)]}"
            f" (not measured {tab[('y', '?')]}); borderline fired {tab[('b', True)]}/{tab[('b', True)] + tab[('b', False)]}; "
            f"false yes {pct(tab[('n', True)], tab[('n', True)] + tab[('n', False)])} (not measured {tab[('n', '?')]}){st}")

    # ---- 3. bulky top
    say("\n## 3. A bulky top\n")
    say(f"- his mean score by label: {by_score(lambda c: lab[c]['top_bulky'] if lab[c]['top_bulky'] in 'ynb' else None)}")
    for grp in "ynb":
        cnt = Counter(first(c)["upper_vol"] for c in lab if lab[c]["top_bulky"] == grp and first(c))
        say(f"- labelled {grp}: reading's largest upper-body volume {dict(sorted(cnt.items()))}")
    say(f"- steadiness, `upper volume >= 4`: {steady(lambda f: f['upper_vol'] >= 4)}")
    for k in ("shoulder_cm", "top_hem_cm"):
        pos = [M["c"][c][k] for c in lab if c in M["c"] and M["c"][c][k] is not None and lab[c]["top_bulky"] == "y"]
        neg = [M["c"][c][k] for c in lab if c in M["c"] and M["c"][c][k] is not None and lab[c]["top_bulky"] == "n"]
        say(f"- ruler `{k}` (gate 0.1): measured {len(pos) + len(neg)} (bulky {len(pos)}); AUC {auc(pos, neg):.2f}")

    # ---- 4. shorts
    say("\n## 4. Shorts\n")
    sh = [c for c, r in lab.items() if r["bottom"] == "s"]
    say(f"- his mean score by length: {by_score(lambda c: lab[c]['shorts_length'] or None)}")
    say(f"- by fit: {by_score(lambda c: lab[c]['shorts_fit'] or None)}; by the top over them: {by_score(lambda c: lab[c]['shorts_balance'] or None)}")
    say(f"- named as shorts by the reading: {sum(1 for c in sh if first(c) and first(c)['shorts'])}/{sum(1 for c in sh if first(c))}; "
        f"pants read as shorts: {sum(1 for c in pants if first(c) and first(c)['shorts'])}")
    for grp in ("wide", "reg", "slim"):
        cnt = Counter((first(c)["leg"], first(c)["bottom_vol"]) for c in sh if lab[c]["shorts_fit"] == grp and first(c))
        say(f"- labelled {grp}: reading (leg_shape, volume) {dict(cnt.most_common())}")
    wide = [c for c in sh if first(c)]
    caught = sum(first(c)["leg"] == "wide" for c in wide if lab[c]["shorts_fit"] == "wide")
    fp = sum(first(c)["leg"] == "wide" for c in wide if lab[c]["shorts_fit"] != "wide")
    say(f"- `leg_shape wide` as wide shorts: caught {caught}/{sum(lab[c]['shorts_fit'] == 'wide' for c in wide)}, "
        f"false yes {fp}/{sum(lab[c]['shorts_fit'] != 'wide' for c in wide)}")
    shorts_two = [v for v in two if rf(v[0])["shorts"] and rf(v[1])["shorts"]]
    say(f"- steadiness, `leg_shape wide` on gold shorts: {steady(lambda f: f['leg'] == 'wide', shorts_two)}")
    say(f"- steadiness, `bottom volume >= 4` on gold shorts: {steady(lambda f: f['bottom_vol'] >= 4, shorts_two)}")
    right = n = unsure = flips = nb = 0
    for c in sh:
        a, b = M["shorts_a"].get(c), M["shorts_b"].get(c)
        v = a and a["shorts_value"]
        if v not in ("above_knee", "at_knee", "below_knee"):
            unsure += 1
            continue
        n += 1
        right += (v == "above_knee") == (lab[c]["shorts_length"] == "above")
        bv = b and b["shorts_value"]
        if bv in ("above_knee", "at_knee", "below_knee"):
            nb += 1
            flips += (bv == "above_knee") != (v == "above_knee")
    say(f"- shorts ruler, above the knee vs at or below: right {pct(right, n)}; unsure {unsure}/{len(sh)}; "
        f"flips on the resized copy {pct(flips, nb)}")

    # ---- coverage
    say("\n## Coverage of the body ruler on face-hidden copies (founder4, the 6 the app can't prep left out)\n")
    for p in ("a", "c"):
        ids = [c for c in lab if c not in LEFT_OUT]
        why = Counter((M[p].get(c) or {}).get("why") or (M[p].get(c) or {}).get("status") or "missing" for c in ids)
        say(f"- pass {p}: {dict(why.most_common())}  (None = measured)")


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "collect":
        collect(Path(sys.argv[2]))
    elif len(sys.argv) > 1 and sys.argv[1] == "report":
        report()
    else:
        print(__doc__)
