#!/usr/bin/env python3
"""A second look when the AI is unsure (unsure1). Oct 17, 2026; DECISIONS-LOG #333; plan and checks
rubric/research/notes/unsure-look.md.

The founder's idea (Oct 17): when the reading is shaky on a detail that would move the score, ask again, narrowly.
Re-running the whole read doesn't help (#278, #220); a narrow look at one close-up does (#199, #332). This script
tests one narrow look on the gold set's own face-hidden lower close-ups (gold1/images/*.lower.jpg, the body
close-up when there's no hip split), against the main read's two gold1 runs. The look is the app's shipped second
look L (prompt_look_l.txt: pant_end, covers_shoe) with two questions added, shoe and leg_shape
(prompt_unsure_lower.txt + schema_unsure_lower.json), so that if it passes it ships inside the call the app already
makes on every check: no new call, no added wait. One arm, N, 3 runs, on two sets:
  S  shoe type: photos where the trigger U-T1 (the main read flags its shoe "likely"/"unsure" AND a look-alike shoe
     of the same family would move the score) fires on run 0 or 1: every one whose runs read different shoes, plus
     12 steady controls (seeded)
  G  leg shape: photos where U-T2 (a neighbouring leg would move the score; the AI's flag is blind on legs, 0 of 37
     flips) fires on run 0 or 1: every one whose runs read different legs, plus 10 steady controls (seeded)
and covers_shoe (the shipped answer) is checked for harm on every photo of either set.

PAPER (free, no key): --paper prints the flips, the triggers' rates and catches, the oracle (truth swapped in) and
the founder's saved checks. RUN: --dry-run (the call list and the estimate), then --arm S / --arm G with a HARD STOP
at BUDGET_CENTS counted from real usage plus the worst case of every call in flight. --report re-analyzes.

TRUTH: unsure_labels.csv, labelled by two blind subagents from the close-ups only (they never saw a reading), before
any narrow answer existed. A value counts as truth only when both labellers agree; the rest is "soft" and left out.

Rule 7: the gold photos are public screenshots, profile unknown; one stated test profile (minimal + smart casual,
0.5 each; boldness "a little"; no age), at Everyday, as gold_tune.py. The founder's phone checks are scored at their
own occasion with no picks (his profile is still pending).

  KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 unsure_look.py --paper
"""
import argparse, copy, csv, glob, json, os, random, sqlite3, statistics as st, sys, threading
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402

OUT = HERE / "results" / "unsure1"
GOLD = DATA / "extraction-test" / "results" / "gold1"
IMAGES = GOLD / "images"
BUDGET_CENTS = 30.0                       # the founder's cap for this test (asked in CLAUDE.md's to-do list)
RESERVE = 0.30                            # worst-case cents per narrow call, held while it's in flight
EST = 0.16                                # look1's L arm was 0.110 cents; ~600 more prompt tokens here
PROFILE = R.parse_styles("minimalist:0.5,smart_casual:0.5")
BAR = {"steady": 0.90, "right": 0.85, "unsure": 0.30, "beat": 0.10}

LEATHER = ("loafer", "dress_shoe", "derby", "suede_chukka", "chelsea_boot", "work_boot")
SNEAKER = ("white_leather_sneaker", "canvas_sneaker", "low_profile_sneaker", "retro_runner", "performance_runner",
           "chunky_sneaker", "basketball_sneaker")
SHOE_TYPES = LEATHER + SNEAKER + ("slides_sandals", "other")
FAMILY = {s: LEATHER for s in LEATHER} | {s: SNEAKER for s in SNEAKER}
LEGS = ("skinny", "slim", "straight", "relaxed", "wide", "barrel", "flare_bootcut")
LEG_NEIGHBORS = {"skinny": ("slim",), "slim": ("skinny", "straight"), "straight": ("slim", "relaxed", "flare_bootcut"),
                 "relaxed": ("straight", "wide"), "wide": ("relaxed", "barrel"), "barrel": ("wide",),
                 "flare_bootcut": ("straight",)}
PANTS = {"jeans", "chinos", "trousers", "drawstring_trousers", "suit_trousers", "cargos", "joggers", "sweatpants"}

PROMPT = HERE / "prompt_unsure_lower.txt"
SCHEMA = HERE / "schema_unsure_lower.json"
ARM = "N"


# ============================================================================================ data
def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def half(x):
    return round(x * 2) / 2


def load_gold():
    """The two gold1 runs per photo, the panel (median of the five judges' part-weighted means, as gold_tune.load),
    the founder's 20 blind ratings and the held-out test split."""
    J = DATA / "inputs/gold-judge"
    runs = defaultdict(dict)
    for x in json.load(open(GOLD / "raw.json")):
        if x.get("json"):
            runs[x["photo"]][x["run"]] = x["json"]
    runs = {p: v for p, v in runs.items() if 0 in v and 1 in v}
    W = {"fit": 25, "proportion": 25, "color": 15, "shoes": 15, "cohesion": 15, "condition": 5}
    photo_of = {m["gid"]: m["photo"] for m in json.load(open(J / "manifest.json"))}
    rows = defaultdict(dict)
    for f in sorted(J.glob("judge-*-b*.csv")):
        for r in csv.DictReader(f.open()):
            if r.get("id"):
                rows[f.stem.split("-")[1]][r["id"].strip()] = r
    per = defaultdict(lambda: defaultdict(list))
    for j in rows:
        for g, r in rows[j].items():
            p = photo_of.get(g)
            got = {k: num(r.get(k)) for k in W}
            got = {k: v for k, v in got.items() if v is not None}
            if p and got:
                per[p][j].append(sum(v * W[k] for k, v in got.items()) / sum(W[k] for k in got))
    panel = {p: half(st.median(st.mean(x) for x in v.values())) for p, v in per.items() if len(v) == len(rows)}
    fman = {m["fid"]: m["photo"] for m in json.load(open(J / "founder" / "manifest.json"))}
    founder = {fman[r["id"]]: float(r["score"]) for r in csv.DictReader(open(J / "founder" / "ratings.csv"))}
    split = json.load(open(DATA / "extraction-test/results/gold-tune/split.json"))
    return runs, panel, founder, set(split["test"])


def load_phone():
    """Every scored check in every phone pull, deduped by image hash (the newest pull wins)."""
    out = {}
    for db in sorted(glob.glob(str(DATA / "screenshots/phone/*/SQLite/kitted.db"))):
        cx = sqlite3.connect(f"file:{db}?mode=ro&immutable=1", uri=True)
        try:
            q = cx.execute("select f.image_hash, f.occasion, r.reading_json from fit_checks f join readings r "
                           "on r.id = f.reading_id where f.status = 'scored' order by f.created_at").fetchall()
        except sqlite3.Error:
            continue
        for h, occ, js in q:
            if js:
                out["phone-" + h[:6]] = {"reading": json.loads(js), "occ": occ or "everyday"}
    return out


def labels():
    f = HERE / "unsure_labels.csv"
    if not f.exists():
        return {}
    out = {}
    for r in csv.DictReader(f.open()):
        t = {}
        for k in ("shoe", "leg"):
            a, b = r.get(f"{k}_a", ""), r.get(f"{k}_b", "")
            t[k] = a if a and a == b and a not in ("unsure", "cant_see", "na") else None
            t[k + "_pair"] = (a, b)
        a, b = r.get("rests_a", ""), r.get("rests_b", "")          # the pant fabric rests on the shoe: yes / no
        t["rests"] = {"yes": True, "no": False}.get(a) if a == b else None
        out[r["photo"]] = t
    return out


# ============================================================================================ scoring helpers
def score(rd, occasion="everyday", styles=None):
    return P.score_parts(rd, occasion, PROFILE if styles is None else styles, None, "a_little")["overall"]


def slot(rd, cat):
    return next((g for g in rd.get("garments", []) if g.get("category") == cat), None)


def with_field(rd, cat, field, value):
    r2 = copy.deepcopy(rd)
    g = slot(r2, cat)
    if g is not None and value is not None:
        g[field] = value
    return r2


def shoe_flag(rd):
    s = slot(rd, "footwear")
    return bool(s and s.get("certainty") != "clear")


def shoe_swing(rd, occasion="everyday", styles=None):
    """The biggest score change if the shoe were another type of its own family (leather shoes and boots; sneakers).
    "other" and slides are left to the existing tap ("Boots, sneakers or slides?")."""
    s = slot(rd, "footwear")
    if not s or s.get("subcategory") not in FAMILY:
        return 0.0
    base = score(rd, occasion, styles)
    if base is None:
        return 0.0
    alts = [score(with_field(rd, "footwear", "subcategory", a), occasion, styles) for a in FAMILY[s["subcategory"]]
            if a != s["subcategory"]]
    return max((abs(x - base) for x in alts if x is not None), default=0.0)


def leg_swing(rd, occasion="everyday", styles=None):
    """The biggest score change if the pants' leg were a neighbouring shape (skinny-slim-straight-relaxed-wide-barrel;
    flare next to straight)."""
    b = slot(rd, "bottom")
    if not b or b.get("subcategory") not in PANTS or b.get("leg_shape") not in LEG_NEIGHBORS:
        return 0.0
    base = score(rd, occasion, styles)
    if base is None:
        return 0.0
    alts = [score(with_field(rd, "bottom", "leg_shape", a), occasion, styles) for a in LEG_NEIGHBORS[b["leg_shape"]]]
    return max((abs(x - base) for x in alts if x is not None), default=0.0)


TRIGGERS = {
    "S0 shoe flagged": lambda rd, o="everyday", s=None: shoe_flag(rd),
    "S1 shoe flagged + a look-alike moves the score": lambda rd, o="everyday", s=None: shoe_flag(rd) and shoe_swing(rd, o, s) >= 0.5,
    "S2 a look-alike moves the score (flag ignored)": lambda rd, o="everyday", s=None: shoe_swing(rd, o, s) >= 0.5,
    "G1 a neighbouring leg moves the score": lambda rd, o="everyday", s=None: leg_swing(rd, o, s) >= 0.5,
}


def flips(runs):
    """photo -> {field: (run0 value, run1 value, moves the score by itself)} for the shoe type and the leg."""
    out = {}
    for p, rr in runs.items():
        a, b = rr[0], rr[1]
        d = {}
        for cat, f, key in (("footwear", "subcategory", "shoe"), ("bottom", "leg_shape", "leg")):
            ga, gb = slot(a, cat), slot(b, cat)
            if ga and gb and ga.get(f) != gb.get(f):
                mv = (score(with_field(a, cat, f, gb.get(f))) != score(a)) or (score(with_field(b, cat, f, ga.get(f))) != score(b))
                d[key] = (ga.get(f), gb.get(f), mv)
        out[p] = d
    return out


def pearson(a, b):
    ma, mb = st.mean(a), st.mean(b)
    n = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    d = (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5
    return n / d if d else float("nan")


def pct(a, b):
    return f"{a}/{b} ({100 * a / b:.0f}%)" if b else "-"


# ============================================================================================ the test sets
def test_sets(runs):
    """S: U-T1 fires on run 0 or 1 and the runs read different shoes, plus 12 such photos whose runs agree (seeded).
    G: U-T2 fires on run 0 or 1 and the runs read different legs, plus 10 whose runs agree (seeded). The controls keep
    the sets from holding only photos the main read already shook on (a look that breaks steady reads must show)."""
    trig_s = TRIGGERS["S1 shoe flagged + a look-alike moves the score"]
    trig_g = TRIGGERS["G1 a neighbouring leg moves the score"]
    fl = flips(runs)
    out = []
    for kind, trig, n_ctrl in (("shoe", trig_s, 12), ("leg", trig_g, 10)):
        fired = [p for p, rr in sorted(runs.items()) if trig(rr[0]) or trig(rr[1])]
        flip = [p for p in fired if kind in fl[p]]
        ctrl = [p for p in fired if kind not in fl[p]]
        random.Random(17).shuffle(ctrl)
        out.append(sorted(flip + ctrl[:n_ctrl]))
    return out[0], out[1]


def image_for(pid):
    for part in ("lower", "body", "full"):
        f = IMAGES / f"{pid}.{part}.jpg"
        if f.exists():
            return part, f
    return None, None


# ============================================================================================ paper (free)
def paper():
    runs, panel, founder, test = load_gold()
    fl = flips(runs)
    L = ["## Paper: the gold set's two runs (engine v13, free)", ""]
    n = len(runs)
    diff = Counter(abs(score(rr[0]) - score(rr[1])) for rr in runs.values() if score(rr[0]) is not None and score(rr[1]) is not None)
    L.append(f"- {n} photos with two runs; score difference between runs: " + ", ".join(f"{k:g}: {v}" for k, v in sorted(diff.items())))
    for key in ("shoe", "leg"):
        f = [p for p in runs if key in fl[p]]
        mv = [p for p in f if fl[p][key][2]]
        L.append(f"- {key} flips: {len(f)} ({100 * len(f) / n:.0f}%); {len(mv)} move the score by themselves")
    L.append("")
    L.append("### Triggers, per reading (runs 0 and 1 of every photo)")
    L.append("")
    L.append("| Trigger | Fires on readings | Catches score-moving shoe flips | Catches score-moving leg flips | Fires on steady photos |")
    L.append("|---|---|---|---|---|")
    for name, trig in TRIGGERS.items():
        fires = sum(trig(rr[i]) for rr in runs.values() for i in (0, 1))
        cs = [p for p in runs if "shoe" in fl[p] and fl[p]["shoe"][2]]
        cg = [p for p in runs if "leg" in fl[p] and fl[p]["leg"][2]]
        kind = "shoe" if name.startswith("S") else "leg"
        steady = [p for p in runs if kind not in fl[p]]
        hit_s = sum(1 for p in cs if trig(runs[p][0]) or trig(runs[p][1]))
        hit_g = sum(1 for p in cg if trig(runs[p][0]) or trig(runs[p][1]))
        st_f = sum(1 for p in steady if trig(runs[p][0]) or trig(runs[p][1]))
        L.append(f"| {name} | {pct(fires, 2 * n)} | {pct(hit_s, len(cs))} | {pct(hit_g, len(cg))} | {pct(st_f, len(steady))} |")
    L.append("")
    S, G = test_sets(runs)
    U = sorted(set(S) | set(G))
    fl_s = sum(1 for p in S if "shoe" in fl[p]); fl_g = sum(1 for p in G if "leg" in fl[p])
    L.append(f"- Set S: {len(S)} photos ({fl_s} shoe flips + {len(S) - fl_s} steady controls); set G: {len(G)} photos "
             f"({fl_g} leg flips + {len(G) - fl_g} controls); {len(U)} photos in all")
    L.append(f"- Calls for 3 runs each: {3 * len(U)}, about {3 * len(U) * EST:.1f} cents (est. {EST} cents a call); "
             f"hard stop {BUDGET_CENTS:.0f} cents")
    L.append("")
    lab = labels()
    if lab:
        L += oracle(runs, panel, founder, test, lab, S, G)
    L += phone_paper()
    return L


def settled(rd, kind, value):
    if value is None:
        return rd
    return with_field(rd, "footwear", "subcategory", value) if kind == "shoe" else with_field(rd, "bottom", "leg_shape", value)


def metrics(runs, panel, founder, test, fix=None):
    """fix(photo, run, reading) -> the reading after the second look. Steadiness between the runs, the panel r on the
    held-out test photos (run 0, as gold_tune) and the founder's 20 (within 0.5)."""
    fix = fix or (lambda p, i, rd: rd)
    sc = {p: [score(fix(p, i, rr[i])) for i in (0, 1)] for p, rr in runs.items()}
    sc = {p: s for p, s in sc.items() if None not in s}
    same = sum(1 for s in sc.values() if s[0] == s[1])
    big = sum(1 for s in sc.values() if abs(s[0] - s[1]) >= 1.0)
    tp = [p for p in sc if p in test and p in panel]
    r_test = pearson([sc[p][0] for p in tp], [panel[p] for p in tp])
    fp = [p for p in founder if p in sc]
    f05 = sum(1 for p in fp if abs(sc[p][0] - founder[p]) <= 0.5)
    return {"same": same, "n": len(sc), "big": big, "r_test": r_test, "n_test": len(tp), "f05": f05, "nf": len(fp), "sc": sc}


def oracle(runs, panel, founder, test, lab, S, G):
    """The ceiling: if the second look always returned the labelled truth on the triggered readings."""
    trig_s = TRIGGERS["S1 shoe flagged + a look-alike moves the score"]
    trig_g = TRIGGERS["G1 a neighbouring leg moves the score"]

    def fix_truth(p, i, rd):
        t = lab.get(p, {})
        if t.get("shoe") and trig_s(rd):
            rd = settled(rd, "shoe", t["shoe"])
        if t.get("leg") and p in G and trig_g(rd):
            rd = settled(rd, "leg", t["leg"])
        return rd

    def fix_steady(p, i, rd):                     # a perfectly steady look: run 0's value on both runs, wherever triggered
        if trig_s(runs[p][0]) or trig_s(runs[p][1]):
            rd = settled(rd, "shoe", (slot(runs[p][0], "footwear") or {}).get("subcategory"))
        if trig_g(runs[p][0]) or trig_g(runs[p][1]):
            rd = settled(rd, "leg", (slot(runs[p][0], "bottom") or {}).get("leg_shape"))
        return rd

    a, b = metrics(runs, panel, founder, test), metrics(runs, panel, founder, test, fix_truth)
    c = metrics(runs, panel, founder, test, fix_steady)
    L = ["### The ceiling (free)", "",
         f"- A perfectly steady look (both runs get the same shoe and leg wherever U-T1 or U-T2 fires, all 225 photos): "
         f"runs give the same score {pct(a['same'], a['n'])} → {pct(c['same'], c['n'])}; 1.0+ apart {a['big']} → {c['big']}; "
         f"held-out panel r {a['r_test']:.3f} → {c['r_test']:.3f}; the founder's 20 within 0.5 {a['f05']} → {c['f05']}",
         "- The labelled truth swapped in wherever the trigger fires on that reading (labelled photos only):"]
    L.append(f"  runs give the same score {pct(a['same'], a['n'])} → {pct(b['same'], b['n'])}; 1.0+ apart {a['big']} → {b['big']}; "
             f"held-out panel r ({a['n_test']} photos) {a['r_test']:.3f} → {b['r_test']:.3f}; the founder's 20 within 0.5 {a['f05']} → {b['f05']}")
    agree = {k: sum(1 for t in lab.values() if t[k + "_pair"][0] == t[k + "_pair"][1] and t[k]) for k in ("shoe", "leg")}
    L.append(f"- The two blind labellers agree on the shoe type on {agree['shoe']}/{len(lab)} photos and the leg on "
             f"{agree['leg']}/{len(lab)}: the truth is soft exactly where the main read wobbles")
    # main read accuracy against the truth, per reading, in the two sets
    for kind, cat, f, ps in (("shoe", "footwear", "subcategory", S), ("leg", "bottom", "leg_shape", G)):
        judged = [(p, i) for p in ps for i in (0, 1) if lab.get(p, {}).get(kind) and slot(runs[p][i], cat)]
        ex = sum(1 for p, i in judged if slot(runs[p][i], cat).get(f) == lab[p][kind])
        sr = sum(1 for p, i in judged if score(runs[p][i]) == score(settled(runs[p][i], kind, lab[p][kind])))
        soft = sum(1 for p in ps if p in lab and not lab[p].get(kind))
        L.append(f"- Main read on set {'S' if kind == 'shoe' else 'G'} ({kind}), against the agreed labels: exact {pct(ex, len(judged))}, "
                 f"score-right {pct(sr, len(judged))}; {soft} of {len(ps)} photos have no agreed label (soft)")
    L.append("")
    return L


def phone_paper():
    ph = load_phone()
    if not ph:
        return ["- No phone pulls under KITTED_DATA.", ""]
    L = [f"### The founder's saved checks ({len(ph)} scored, deduped; their own occasion, no picks)", ""]
    for name, trig in TRIGGERS.items():
        fires = [k for k, v in ph.items() if trig(v["reading"], v["occ"], {})]
        L.append(f"- {name}: fires on {pct(len(fires), len(ph))}" + (f" ({', '.join(fires[:12])}{'…' if len(fires) > 12 else ''})" if fires else ""))
    L.append("")
    L.append("Where U-T1 or U-T2 fires, the score each look-alike would give (what the second look could change):")
    L.append("")
    for k, v in sorted(ph.items()):
        rd, occ = v["reading"], v["occ"]
        s0 = score(rd, occ, {})
        rows = []
        sh = slot(rd, "footwear")
        if TRIGGERS["S1 shoe flagged + a look-alike moves the score"](rd, occ, {}):
            alts = {a: score(with_field(rd, "footwear", "subcategory", a), occ, {}) for a in FAMILY[sh["subcategory"]]}
            rows.append(f"shoe read {sh['subcategory']} ({sh.get('certainty')}): " +
                        ", ".join(f"{a} {x:g}" for a, x in alts.items() if x is not None and x != s0))
        b = slot(rd, "bottom")
        if TRIGGERS["G1 a neighbouring leg moves the score"](rd, occ, {}):
            alts = {a: score(with_field(rd, "bottom", "leg_shape", a), occ, {}) for a in LEG_NEIGHBORS[b["leg_shape"]]}
            rows.append(f"leg read {b['leg_shape']}: " + ", ".join(f"{a} {x:g}" for a, x in alts.items() if x is not None and x != s0))
        if rows:
            L.append(f"- {k} ({occ}, {s0:g}): " + "; ".join(rows))
    L.append("")
    return L


# ============================================================================================ the run (spends)
def load_raw():
    f = OUT / "raw.json"
    return json.loads(f.read_text()) if f.exists() else []


def spent(raw):
    import b1_test
    return sum(b1_test.cents(r) for r in raw)


def get_key():
    k = os.environ.get("GEMINI_API_KEY")
    if k:
        return k
    envf = DATA / "app" / ".env.development.local"
    if envf.exists():
        for line in envf.read_text().splitlines():
            if line.startswith("EXPO_PUBLIC_GEMINI_DEV_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("No Gemini key (GEMINI_API_KEY or app/.env.development.local).")


def photos(runs):
    S, G = test_sets(runs)
    return sorted(set(S) | set(G))


def run_arm(n_runs, workers, dry, only=None):
    runs, *_ = load_gold()
    pids = photos(runs)
    if only:
        pids = [p for p in pids if p in only]
    raw = load_raw()
    done = {(r["photo"], r["run"]) for r in raw if r.get("json")}
    jobs = [(p, i) for i in range(n_runs) for p in pids if (p, i) not in done]     # run-major: a stop cuts run 2 first
    print(f"arm {ARM}: {len(pids)} photos, {len(jobs)} calls, about {len(jobs) * EST:.1f} cents; "
          f"spent so far {spent(raw):.2f} of {BUDGET_CENTS:.0f}")
    if dry or not jobs:
        return
    if not (HERE / "unsure_labels.csv").exists():
        sys.exit("No unsure_labels.csv: label blind before any answer exists.")
    import b1_test
    OUT.mkdir(parents=True, exist_ok=True)
    key = get_key()
    prompt, schema = PROMPT.read_text(), json.loads(SCHEMA.read_text())
    lock = threading.Lock()
    state = {"spent": spent(raw), "reserved": 0.0, "stopped": 0}

    def one(job):
        p, i = job
        with lock:                                    # the hard stop: real spend + every call in flight, worst case
            if state["spent"] + state["reserved"] + RESERVE > BUDGET_CENTS:
                state["stopped"] += 1
                return None
            state["reserved"] += RESERVE
        part, f = image_for(p)
        try:
            r = b1_test.call(key, prompt, schema, [f.read_bytes()])
        except Exception as e:                        # never leave a reservation behind
            r = {"json": None, "error": type(e).__name__}
        r.update({"arm": ARM, "photo": p, "run": i, "image": part})
        with lock:
            state["reserved"] -= RESERVE
            state["spent"] += b1_test.cents(r)
            raw.append(r)
            (OUT / "raw.json").write_text(json.dumps(raw, indent=1))
        if r.get("error"):
            print(f"  {p} run {i}: {str(r['error'])[:120]}")
        return r

    with ThreadPoolExecutor(workers) as ex:
        list(ex.map(one, jobs))
    print(f"arm {ARM} done: spent {state['spent']:.2f} cents in all; {state['stopped']} calls not started (budget)")


# ============================================================================================ analysis of the run
KINDS = {"shoe": ("footwear", "subcategory", "shoe", set(SHOE_TYPES) - {"other"}),
         "leg": ("bottom", "leg_shape", "leg_shape", set(LEGS))}


def narrow_answers(raw, field):
    out = defaultdict(dict)
    for r in raw:
        if r.get("json"):
            out[r["photo"]][r["run"]] = r["json"].get(field)
    return out


def analyze(kind, runs, lab, raw, ps):
    cat, f, field, valid = KINDS[kind]
    ans = narrow_answers(raw, field)
    rows = Counter()
    detail = []
    for p in ps:
        a = ans.get(p, {})
        vals = [a[i] for i in sorted(a)]
        ga, gb = slot(runs[p][0], cat), slot(runs[p][1], cat)
        if len(vals) >= 3:
            rows["n3"] += 1
            rows["steady3"] += len(set(vals[:3])) == 1 and vals[0] in valid
        if 0 in a and 1 in a and ga and gb:
            rows["n01"] += 1
            rows["steady01"] += a[0] == a[1] and a[0] in valid
            rows["main01"] += ga.get(f) == gb.get(f)
        rows["runs"] += len(vals)
        rows["unsure"] += sum(1 for v in vals if v not in valid)
        t = lab.get(p, {}).get(kind)
        if t:
            want = score(settled(runs[p][0], kind, t))
            for v in vals:
                if v in valid:
                    rows["judged"] += 1
                    rows["exact"] += v == t
                    rows["sright"] += score(settled(runs[p][0], kind, v)) == want
            for i in (0, 1):
                g = slot(runs[p][i], cat)
                if g:
                    rows["m_judged"] += 1
                    rows["m_exact"] += g.get(f) == t
                    rows["m_sright"] += score(runs[p][i]) == score(settled(runs[p][i], kind, t))
        soft = "/".join(lab.get(p, {}).get(kind + "_pair", ("?", "?")))
        detail.append(f"- {p}: truth {t or 'soft (' + soft + ')'}; main {ga.get(f) if ga else '-'} / "
                      f"{gb.get(f) if gb else '-'}; narrow {' / '.join(str(v) for v in vals)}")
    return rows, detail


def checks(kind, r):
    s3 = r["steady3"] / r["n3"] if r["n3"] else 0
    rt = r["sright"] / r["judged"] if r["judged"] else 0
    mr = r["m_sright"] / r["m_judged"] if r["m_judged"] else 0
    un = r["unsure"] / r["runs"] if r["runs"] else 1
    s01, m01 = (r["steady01"] / r["n01"], r["main01"] / r["n01"]) if r["n01"] else (0, 0)
    a, b, c = ("U1", "U2", "U3") if kind == "shoe" else ("U4", "U5", "U6")
    return [(f"{a} steady on 3 runs ≥ 90%, and runs 0–1 agree ≥ 10 pts more often than the main read's",
             s3 >= BAR["steady"] and s01 >= m01 + BAR["beat"], f"{s3:.0%} on 3 (runs 0–1: narrow {s01:.0%}, main {m01:.0%})"),
            (f"{b} score-right ≥ 85% and ≥ 10 pts above the main read", rt >= BAR["right"] and rt >= mr + BAR["beat"],
             f"narrow {rt:.0%} ({r['sright']}/{r['judged']}), main {mr:.0%} ({r['m_sright']}/{r['m_judged']})"),
            (f"{c} can't see ≤ 30%", un <= BAR["unsure"], f"{un:.0%} ({r['unsure']}/{r['runs']})")]


def covers_harm(raw, lab, ps):
    """U9: the shipped answer (covers_shoe → rests on the shoe yes/no) stays as steady and right as look1's (94% / 97%):
    ≥ 90% the same on 3 runs, ≥ 85% right against the agreed labels when it answers."""
    def yn(v):
        return True if v in ("partly", "mostly") else False if v == "no" else None
    ans = narrow_answers(raw, "covers_shoe")
    n3 = steady = judged = right = 0
    for p in ps:
        vals = [yn(ans[p][i]) for i in sorted(ans.get(p, {}))]
        if len(vals) >= 3:
            n3 += 1
            steady += len(set(vals[:3])) == 1
        t = lab.get(p, {}).get("rests")
        if t is not None:
            for v in vals:
                if v is not None:
                    judged += 1
                    right += v == t
    ok = n3 and steady / n3 >= 0.90 and judged and right / judged >= 0.85
    return f"| U9 the shipped covers_shoe (rests on the shoe) ≥ 90% steady, ≥ 85% right | steady {pct(steady, n3)}, right {pct(right, judged)} | {'yes' if ok else 'no'} |"


def report():
    runs, panel, founder, test = load_gold()
    lab = labels()
    raw = load_raw()
    S, G = test_sets(runs)
    import b1_test
    L = ["# A second look when the AI is unsure (unsure1)", "",
         "*Script `extraction-test/unsure_look.py`; labels `unsure_labels.csv` (two blind labellers, agreed values only); "
         "raw `results/unsure1/raw.json`. Gold photos: public screenshots, profile unknown; test profile minimal + smart "
         "casual, Everyday.*", ""]
    if raw:
        c = [b1_test.cents(r) for r in raw]
        secs = [r["seconds"] for r in raw if r.get("seconds")]
        errs = sum(1 for r in raw if not r.get("json"))
        L.append(f"**Spend:** {sum(c):.1f} of the {BUDGET_CENTS:.0f}-cent cap: {len(raw)} calls ({errs} failed), "
                 f"{sum(c) / len(c):.3f} cents a call, median {st.median(secs):.1f} s, 90th percentile "
                 f"{sorted(secs)[int(0.9 * (len(secs) - 1))]:.1f} s.")
        L.append("")
        fixes = {}
        for kind, ps in (("shoe", S), ("leg", G)):
            r, detail = analyze(kind, runs, lab, raw, ps)
            L.append(f"## {'Set S: shoe type' if kind == 'shoe' else 'Set G: leg shape'}, {len(ps)} photos")
            L.append("")
            L.append("| Check | Result | Passes |")
            L.append("|---|---|---|")
            for name, ok, val in checks(kind, r):
                L.append(f"| {name} | {val} | {'yes' if ok else 'no'} |")
            L.append(f"| exact value right (reported, no bar) | narrow {pct(r['exact'], r['judged'])}, main {pct(r['m_exact'], r['m_judged'])} | - |")
            L.append("")
            L += detail
            L.append("")
            fixes[kind] = narrow_answers(raw, KINDS[kind][2])
        L += ["## The shipped answer, for harm", "", "| Check | Result | Passes |", "|---|---|---|",
              covers_harm(raw, lab, sorted(set(S) | set(G))), ""]
        L += settle_report(runs, panel, founder, test, fixes, S, G)
    L += paper()
    txt = "\n".join(L) + "\n"
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.md").write_text(txt)
    print(txt)


def settle_report(runs, panel, founder, test, fixes, S, G):
    """U7–U8, two ways of settling the main read's run i with the narrow look's run i:
    "when triggered": only where the trigger fires on that reading (S's photos for the shoe, G's for the leg);
    "always": wherever the look gives a real answer on a tested photo (symmetric across reads, since the look runs on
    every check anyway when folded into L). Photos outside the test keep the main read in both."""
    trig_s = TRIGGERS["S1 shoe flagged + a look-alike moves the score"]
    trig_g = TRIGGERS["G1 a neighbouring leg moves the score"]
    vs, vg = KINDS["shoe"][3], KINDS["leg"][3]
    tested = set(S) | set(G)

    def make(always):
        def fix(p, i, rd):
            v = fixes["shoe"].get(p, {}).get(i)
            if v in vs and ((always and p in tested) or (p in S and trig_s(rd))):
                rd = settled(rd, "shoe", v)
            v = fixes["leg"].get(p, {}).get(i)
            b = slot(rd, "bottom")
            if v in vg and b and b.get("subcategory") in PANTS and ((always and p in tested) or (p in G and trig_g(rd))):
                rd = settled(rd, "leg", v)
            return rd
        return fix

    a = metrics(runs, panel, founder, test)
    L = ["## Settled: the narrow answer replaces the main read's", ""]
    for name, always in (("when triggered", False), ("always (on the tested photos)", True)):
        b = metrics(runs, panel, founder, test, make(always))
        moved = sorted(p for p in a["sc"] if a["sc"][p][0] != b["sc"][p][0])
        L.append(f"**{name}**")
        L.append(f"- U7 runs give the same score: {pct(a['same'], a['n'])} → {pct(b['same'], b['n'])}; 1.0+ apart {a['big']} → {b['big']} "
                 f"→ {'pass' if b['same'] > a['same'] and b['big'] <= a['big'] else 'FAIL'}")
        L.append(f"- U8 held-out panel r: {a['r_test']:.3f} → {b['r_test']:.3f}; the founder's 20 within 0.5: {a['f05']} → {b['f05']} "
                 f"→ {'pass' if b['r_test'] >= a['r_test'] - 0.02 and b['f05'] >= a['f05'] else 'FAIL'}")
        L.append(f"- Run-0 scores that change: {len(moved)}" + (": " + "; ".join(f"{p} {a['sc'][p][0]:g} → {b['sc'][p][0]:g}" for p in moved) if moved else ""))
        L.append("")
    return L


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--paper", action="store_true")
    ap.add_argument("--sets", action="store_true", help="print the photos to label (ids and close-up paths)")
    ap.add_argument("--run", action="store_true", help="spend: the narrow look on every photo of S and G")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--only", help="comma-separated photo ids (a pilot)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    if a.sets:
        runs, *_ = load_gold()
        for p in photos(runs):
            part, f = image_for(p)
            print(p, part, f)
        return
    if a.paper:
        print("\n".join(paper()))
        return
    if a.report:
        return report()
    only = set(a.only.split(",")) if a.only else None
    if a.dry_run or not a.run:
        return run_arm(a.runs, a.workers, True, only)
    run_arm(a.runs, a.workers, False, only)
    report()


if __name__ == "__main__":
    main()
