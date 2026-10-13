#!/usr/bin/env python3
"""Gold set, step 3 (DECISIONS-LOG #227): retune the parts engine against the 5-judge panel, on paper. No API calls.

  /usr/bin/python3 gold_tune.py split          make (once) results/gold-tune/split.json
  /usr/bin/python3 gold_tune.py report [eng]   the metrics for an engine (default v7) on tune / test / all
  /usr/bin/python3 gold_tune.py dump           per-photo table of the TUNE half (readings, app parts, judges' reasons)

Data: the gold readings (results/gold1/raw.json, 2 runs per photo, live reading config), the panel (median of the 5
judges' part-weighted scores, as gold_compare.py), the judges' part scores and reasons (inputs/gold-judge/), the
founder's 20 blind ratings (inputs/gold-judge/founder/ratings.csv) and the saved phone checks (parts2_test.load()).

The split: photos are grouped (an Instagram creator's series is one group, so a person's outfits never sit on both
sides), stratified by source and panel band, 2/3 tune and 1/3 test, seed fixed. The founder's 20 are always in the
test half: they're the one human check, so nothing is ever tuned on them.

Rule 7: every gold photo is "profile unknown". The app side uses ONE stated test profile (picks Minimal + Smart casual,
0.5 each; boldness "a little"; no age) at Everyday, exactly as gold_read.py. No split by age band or picked look.
"""
import csv
import json
import random
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
K = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import parts2_test as Q  # noqa: E402

GOLD = HERE / "results" / "gold1"
J = K / "inputs" / "gold-judge"
OUT = HERE / "results" / "gold-tune"
W = {"fit": 25, "proportion": 25, "color": 15, "shoes": 15, "cohesion": 15, "condition": 5}
PMAP = {"fit": "fit", "proportions": "proportion", "color": "color", "shoes": "shoes", "cohesion": "cohesion"}
# the Instagram creator series (gold1/within_person.txt): one person each
SERIES = [(1, 6), (33, 36), (50, 55), (60, 66), (73, 79), (80, 86), (91, 95), (102, 106), (108, 111), (113, 116),
          (118, 121), (122, 125), (126, 130)]
SEED = 20261012


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def half(x):
    return round(x * 2) / 2


def pearson(a, b):
    if len(a) < 3:
        return float("nan")
    ma, mb = st.mean(a), st.mean(b)
    n = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    d = (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5
    return n / d if d else float("nan")


def spearman(a, b):
    def rank(v):
        o = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(o):
            j = i
            while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]:
                j += 1
            for k in range(i, j + 1):
                r[o[k]] = (i + j) / 2
            i = j + 1
        return r
    return pearson(rank(a), rank(b))


def bucket(x):
    return "≤5.5" if x <= 5.5 else "6–6.5" if x <= 6.5 else "7–7.5" if x <= 7.5 else "8–8.5" if x <= 8.5 else "9+"


def group_of(p):
    if p.startswith("ig-"):
        n = int(p[3:])
        for a, b in SERIES:
            if a <= n <= b:
                return f"ig-series-{a}"
    return p


# ------------------------------------------------------------------ loading
def load():
    raw = json.load(open(GOLD / "raw.json"))
    runs = defaultdict(dict)
    for x in raw:
        if x.get("json"):
            runs[x["photo"]][x["run"]] = x["json"]
    runs = {p: [v[i] for i in sorted(v)] for p, v in runs.items()}

    man = json.load(open(J / "manifest.json"))
    photo_of = {m["gid"]: m["photo"] for m in man}
    rows = defaultdict(dict)                                  # judge -> gid -> row
    for f in sorted(J.glob("judge-*-b*.csv")):
        name = f.stem.split("-")[1]
        for r in csv.DictReader(f.open()):
            if r.get("id"):
                rows[name][r["id"].strip()] = r
    judges = sorted(rows)
    per = defaultdict(lambda: defaultdict(list))              # photo -> judge -> [scores]
    parts = defaultdict(lambda: defaultdict(list))            # photo -> part -> [values over judges and repeats]
    reasons = defaultdict(list)                               # photo -> [(judge, gut, reason)]
    for j in judges:
        for g, r in rows[j].items():
            p = photo_of.get(g)
            if p is None:
                continue
            got = {k: num(r.get(k)) for k in W}
            got = {k: v for k, v in got.items() if v is not None}
            if got:
                per[p][j].append(sum(v * W[k] for k, v in got.items()) / sum(W[k] for k in got))
            for k in W:
                if num(r.get(k)) is not None:
                    parts[p][k].append(num(r.get(k)))
            reasons[p].append((j, r.get("gut"), r.get("style"), r.get("reason", "")))
    panel, panel_raw = {}, {}
    for p, v in per.items():
        if len(v) == len(judges):
            m = st.median(st.mean(x) for x in v.values())
            panel_raw[p], panel[p] = m, half(m)
    jparts = {p: {k: st.median(v) for k, v in d.items()} for p, d in parts.items()}

    fman = {m["fid"]: m["photo"] for m in json.load(open(J / "founder" / "manifest.json"))}
    founder = {}
    for r in csv.DictReader(open(J / "founder" / "ratings.csv")):
        founder[fman[r["id"]]] = {"score": float(r["score"]), "note": r["note"]}
    return {"runs": runs, "panel": panel, "panel_raw": panel_raw, "jparts": jparts, "reasons": reasons,
            "founder": founder, "judges": judges}


# ------------------------------------------------------------------ the split
def make_split(D):
    rng = random.Random(SEED)
    photos = sorted(p for p in D["panel"] if p in D["runs"])
    groups = defaultdict(list)
    for p in photos:
        groups[group_of(p)].append(p)
    forced = {group_of(p) for p in D["founder"]}
    # strata: source x the group's mean panel band; deal groups round-robin so each stratum splits 2:1
    strata = defaultdict(list)
    for g, ps in groups.items():
        if g in forced:
            continue
        band = bucket(half(st.mean(D["panel"][p] for p in ps)))
        strata[(ps[0].split("-")[0], band)].append(g)
    test = set(forced)
    for key in sorted(strata):
        gs = sorted(strata[key])
        rng.shuffle(gs)
        for i, g in enumerate(gs):
            if i % 3 == 1:
                test.add(g)
    out = {"seed": SEED, "tune": sorted(p for g in groups if g not in test for p in groups[g]),
           "test": sorted(p for g in groups if g in test for p in groups[g]),
           "note": "groups = an Instagram creator's series or one photo; the founder's 20 forced into test"}
    return out


def get_split():
    f = OUT / "split.json"
    return json.load(open(f))


# ------------------------------------------------------------------ scoring
def score_photo(D, p, engine="v7", tune=None, occasion="everyday"):
    out = []
    for rd in D["runs"][p]:
        s = P.score_parts(rd, occasion, Q.PROFILE, None, Q.BOLD, engine=engine, tune=tune)
        out.append(s)
    return out


def score_all(D, photos, engine="v7", tune=None):
    return {p: score_photo(D, p, engine, tune) for p in photos}


def metrics(D, S, photos):
    ps = [p for p in photos if S[p] and S[p][0]["overall"] is not None and p in D["panel"]]
    app = [S[p][0]["overall"] for p in ps]
    raw = [S[p][0]["raw_score"] for p in ps]
    pan = [D["panel"][p] for p in ps]
    panr = [D["panel_raw"][p] for p in ps]
    m = {"n": len(ps), "r": pearson(app, pan), "r_raw": pearson(raw, panr), "rho": spearman(app, pan),
         "bias": st.mean(a - b for a, b in zip(app, pan)), "mae": st.mean(abs(a - b) for a, b in zip(app, pan)),
         "within_0.5": sum(abs(a - b) <= 0.5 for a, b in zip(app, pan)), "sd_app": st.pstdev(app), "sd_panel": st.pstdev(pan),
         "share_8": sum(a >= 8 for a in app) / len(app)}
    two = [p for p in ps if len(S[p]) > 1 and S[p][1]["overall"] is not None]
    m["steady"] = (sum(abs(S[p][0]["overall"] - S[p][1]["overall"]) <= 0.5 for p in two), len(two))
    m["exact"] = (sum(S[p][0]["overall"] == S[p][1]["overall"] for p in two), len(two))
    # mean of both runs vs panel (what the app would average to)
    mean2 = [st.mean(x["overall"] for x in S[p] if x["overall"] is not None) for p in ps]
    m["r_mean2"] = pearson(mean2, pan)
    m["bands"] = {}
    for b in ("≤5.5", "6–6.5", "7–7.5", "8–8.5", "9+"):
        idx = [i for i, x in enumerate(pan) if bucket(x) == b]
        if idx:
            m["bands"][b] = (len(idx), st.mean(app[i] for i in idx))
    m["src"] = {}
    for s in ("ig", "pin", "rd"):
        idx = [i for i, p in enumerate(ps) if p.startswith(s)]
        if idx:
            m["src"][s] = (len(idx), st.mean(app[i] - pan[i] for i in idx),
                           pearson([app[i] for i in idx], [pan[i] for i in idx]))
    m["parts"] = {}
    for ap, jp in PMAP.items():
        a, b = [], []
        for p in ps:
            v = S[p][0]["parts"].get(ap, {}).get("score")
            w = D["jparts"].get(p, {}).get(jp)
            if v is not None and w is not None:
                a.append(v); b.append(w)
        if a:
            m["parts"][ap] = (len(a), pearson(a, b), st.pstdev(a), st.mean(x - y for x, y in zip(a, b)))
    fo = [p for p in ps if p in D["founder"]]
    if fo:
        m["founder"] = (len(fo), pearson([S[p][0]["overall"] for p in fo], [D["founder"][p]["score"] for p in fo]),
                        sum(abs(S[p][0]["overall"] - D["founder"][p]["score"]) <= 0.5 for p in fo))
    return m


def fmt(name, m):
    L = [f"  {name:10s} n {m['n']:3d} · r {m['r']:.2f} (raw {m['r_raw']:.2f}, rank {m['rho']:.2f}, 2-run mean {m['r_mean2']:.2f})"
         f" · bias {m['bias']:+.2f} · MAE {m['mae']:.2f} · within 0.5 {m['within_0.5']} · sd {m['sd_app']:.2f} vs {m['sd_panel']:.2f}"
         f" · 8+ {100 * m['share_8']:.0f}% · steady {m['steady'][0]}/{m['steady'][1]} (exact {m['exact'][0]})"]
    L.append("             by panel band: " + " · ".join(f"{b} n{n} → {v:.2f}" for b, (n, v) in m["bands"].items()))
    L.append("             by source: " + " · ".join(f"{s} n{n} bias {b:+.2f} r {r:.2f}" for s, (n, b, r) in m["src"].items()))
    L.append("             parts r: " + " · ".join(f"{k} {r:.2f} (sd {sd:.2f}, {d:+.2f})" for k, (n, r, sd, d) in m["parts"].items()))
    if "founder" in m:
        L.append(f"             the founder's 20: r {m['founder'][1]:.2f} · within 0.5 {m['founder'][2]}/{m['founder'][0]}")
    return "\n".join(L)


def report(engine="v7", tune=None, D=None, quiet=False):
    D = D or load()
    sp = get_split()
    S = score_all(D, sp["tune"] + sp["test"], engine, tune)
    out = {k: metrics(D, S, sp[k]) for k in ("tune", "test")}
    out["all"] = metrics(D, S, sp["tune"] + sp["test"])
    if not quiet:
        for k in ("tune", "test", "all"):
            print(fmt(k, out[k]))
    return out, S


# ------------------------------------------------------------------ the tune-half dump
def short(g):
    bits = [g.get("subcategory") or "?", g.get("color_family") or ""]
    if g.get("pattern") not in (None, "solid"):
        bits.append(f"{g['pattern']}/{g.get('pattern_scale')}")
    if g.get("category") in ("top", "outerwear"):
        bits.append(f"v{g.get('volume')} {g.get('length')} tuck:{g.get('tucked')} sl:{g.get('sleeve_end')}")
    if g.get("category") == "bottom":
        bits.append(f"v{g.get('volume')} {g.get('leg_shape')} hem:{g.get('hem')}")
    if g.get("strain") not in (None, "none"):
        bits.append(f"strain:{g['strain']}")
    if g.get("condition") not in (None, "clean"):
        bits.append(g["condition"])
    if g.get("saturation") == "bright":
        bits.append("BRIGHT")
    if g.get("logo") == "large":
        bits.append("LOGO")
    if g.get("certainty") != "clear":
        bits.append(g.get("certainty"))
    return " ".join(b for b in bits if b)


def dump(D=None, which="tune"):
    D = D or load()
    sp = get_split()
    S = score_all(D, sp[which])
    rows = sorted(sp[which], key=lambda p: S[p][0]["overall"] - D["panel"][p] if S[p][0]["overall"] is not None else 0)
    for p in rows:
        s = S[p][0]
        if s["overall"] is None:
            continue
        jp = D["jparts"].get(p, {})
        print(f"\n### {p} panel {D['panel'][p]} ({D['panel_raw'][p]:.2f}) app {s['overall']} / {S[p][1]['overall'] if len(S[p]) > 1 else '-'}"
              f"  [{s['style_label']}; {','.join(s['detected_styles'])}]")
        print("   app parts  " + P.card_row(s))
        print("   panel parts " + " · ".join(f"{k} {jp.get(v, float('nan')):.1f}" for k, v in PMAP.items()) + f" · cond {jp.get('condition', float('nan')):.1f}")
        for g in R.scored_garments(D["runs"][p][0]):
            print("     - " + g.get("category", "")[:4] + " " + short(g))
        for k, r in s["parts"].items():
            for x in r["reasons"]:
                print(f"       [{k}] {x['points']:+.2f} {x['line']}")
        for j, gut, sty, why in D["reasons"][p][:5]:
            print(f"     > {j}: {gut} ({sty}) {why}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    OUT.mkdir(parents=True, exist_ok=True)
    if cmd == "split":
        f = OUT / "split.json"
        if f.exists():
            print("split.json exists; not remaking it (delete it on purpose to reshuffle)")
        else:
            sp = make_split(load())
            json.dump(sp, open(f, "w"), indent=1)
            print(f"tune {len(sp['tune'])} · test {len(sp['test'])}")
    elif cmd == "report":
        report(sys.argv[2] if len(sys.argv) > 2 else "v7")
    elif cmd == "dump":
        dump(which=sys.argv[2] if len(sys.argv) > 2 else "tune")
