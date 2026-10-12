#!/usr/bin/env python3
"""Agreement test (Oct 11, 2026): trust a proportion fact only when independent readers agree. No API calls, no money.

  /usr/bin/python3 agree_test.py --collect   -> results/agree1/phone_readers.json (the phone's ruler + hem probe values,
                                                 from results/ruler1, results/hem1 and the Oct 11 local re-runs in
                                                 results/agree1/ruler2 + hem2: fit_ruler.py --groups phone and
                                                 hem_probe.run_all on the phone photos the Oct 9-10 runs lacked)
  /usr/bin/python3 agree_test.py             -> results/agree1/analysis.txt + analysis.json + facts.json

The founder's point (Oct 11): Proportions sits at 7.0 on most real photos because the facts its faults need failed the
3-run and accuracy tests one reader at a time. Idea: for the same 50 photos there are three readers:
  (a) the scoring call's own fields (batch 1 arm A, results/b1/raw.json, 3 runs; for the corpus, the live reading),
  (b) the second look (results/look1/raw.json: U = the upper close-up, L = the lower close-up; 3 runs),
  (c) the phone (no AI): the fit ruler (vision/FitRuler.swift: the top stack's lower edge against the hip/knee
      joints, the pant hem against the shoe) and, for a heavy hem, the hem probe's "how much shoe shows" (shoeVisToW,
      vision/HemProbe.swift; cut 1.2, inside the probe's own leave-one-out range 1.18-1.23). Its three "runs" are the
      base photo, the photo at 1600 px and a 3% crop (the ruler is deterministic, so a plain rerun proves nothing).
A fact fires under a rule when the readers say so; it moves points only if it is right >= 90% of the times it fires,
steady across the three paired runs, and fires often enough to matter.

Labels: b1_labels.csv (top and layer hems, the peek), look_labels.csv (pant end, rests on the shoe), hem_labels.csv
(heavy vs light). All are one labeller's blind work (Claude subagents, Oct 9-10), not ground truth. "a|b" labels that
fall on both sides of a fact are 'either' and count as right (the house convention); the firm-only precision is
reported next to it.

Rescoring uses a SCRATCH wrapper around rubrics/parts_proto.py (engine v7, the default): the engine file is not
changed. Rule 7: the founder is profile pending (no birth year or picked looks yet); his friends are profile unknown;
703a8b and ebe23f are unknown (ask the founder); stock and web photos are profile unknown. Everything is scored with
ONE stated test profile (picks Minimal + Smart casual, 0.5 each; boldness a little; no age), and picks never move a
number, so no split by age band or picked look is possible.
"""
import argparse
import contextlib
import csv
import json
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
import parts_test as T  # noqa: E402
import parts2_test as Q  # noqa: E402

OUT = HERE / "results" / "agree1"
PULL11 = K / "screenshots/phone/20261011-133011/SQLite/kitted.db"
VARS = ("base", "max1600", "crop3")          # the phone reader's three "runs"
HEM_CUT = 1.2                                # shoeVisToW below this = heavy (less shoe showing below the hem)
LINES = []


def say(s=""):
    LINES.append(s)
    print(s)


def pct(a, b):
    return f"{a}/{b} ({round(100 * a / b)}%)" if b else "-"


# ============================================================================================ (0) the phone's values
def collect():
    import hem_probe as H
    out = {}
    for folder in (HERE / "results/ruler1/runs", OUT / "ruler2/runs"):
        for f in sorted(folder.glob("*.json")):
            pid, var = f.name.rsplit(".", 2)[0], f.name.rsplit(".", 2)[1]
            if var not in VARS:
                continue
            j = json.loads(f.read_text())
            r = out.setdefault(pid, {}).setdefault("ruler", {})
            r[var] = {k: (j.get(k) or {}).get("value") for k in ("top_length", "hem", "layers", "top_length_box", "hem_box")}
    for folder in (HERE / "results/hem1/runs", OUT / "hem2/runs"):
        for f in sorted(folder.glob("*.json")):
            pid, var = f.name.rsplit(".", 2)[0], f.name.rsplit(".", 2)[1]
            if var not in VARS:
                continue
            v, why = H.value(json.loads(f.read_text()), "shoeVisToW", gates=True)
            out.setdefault(pid, {}).setdefault("hemprobe", {})[var] = {"shoeVisToW": v, "why": why}
    (OUT / "phone_readers.json").write_text(json.dumps(out, indent=1, sort_keys=True))
    print(f"phone readers for {len(out)} photos -> {OUT / 'phone_readers.json'}")


# ============================================================================================ facts: labels
LONG = {"crotch", "thigh", "knee", "knee_or_lower", "below_crotch"}
SHORT = {"tucked", "cropped", "waistband", "hip", "at_belt", "mid_fly"}
LAYER_KINDS = {"jacket_or_coat", "blazer", "vest", "open_shirt"}
HEAVY = {"full_break", "stacked", "pooling"}
LIGHT = {"cropped", "cuffed", "no_break", "slight_break"}
FACTS = {
    "long_top": "the top, worn without a layer, ends at the crotch or lower",
    "long_layer": "the outer layer is long (crotch or lower); 'no' = short (hip or higher)",
    "peek": "the top underneath shows below the outer piece (a little or clearly)",
    "peek_clearly": "the top underneath clearly hangs below the outer piece",
    "heavy_hem": "heavy hem: full break, stack or pool ('no' = light: cropped, no or slight break)",
    "rests": "the pant fabric rests on the shoe",
}


def tri(raw, yes, no):
    opts = set((raw or "").split("|")) - {"", "unsure"}
    opts = {o.rstrip("?") for o in opts}
    ys, ns = opts & yes, opts & no
    if ys and ns:
        return "either"
    return "yes" if ys else "no" if ns else None


def load_labels():
    b1 = {r["photo"]: r for r in csv.DictReader(open(HERE / "b1_labels.csv"))}
    lk = {r["photo"]: r for r in csv.DictReader(open(HERE / "look_labels.csv"))}
    hm = {r["photo"]: r for r in csv.DictReader(open(HERE / "hem_labels.csv"))}
    lab = defaultdict(dict)
    for p, r in b1.items():
        layer = r["outer_type"] not in ("na", "")
        if not layer:
            lab[p]["long_top"] = tri(r["top_hem_at"], LONG, SHORT)
        else:
            lab[p]["long_layer"] = tri(r["outer_hem_at"], LONG, SHORT)
        us = r["under_shows"]
        lab[p]["peek"] = "no" if us == "na" else tri(us, {"a_little", "clearly"}, {"no"})
        lab[p]["peek_clearly"] = "no" if us == "na" else tri(us, {"clearly"}, {"no", "a_little"}) \
            if us != "a_little|clearly" else "either"
    for p, r in lk.items():
        lab[p]["rests"] = tri(r["l_covers_shoe"], {"partly", "mostly"}, {"no"})
        h = hm.get(p, {}).get("heavy")
        lab[p]["heavy_hem"] = {"heavy": "yes", "light": "no"}.get(h) if h else tri(r["l_pant_end"], HEAVY, LIGHT)
    return lab


# ============================================================================================ facts: the readers
def _g(j, cat):
    return [g for g in (j or {}).get("garments", []) if g.get("category") == cat]


def read_a(fact, j):
    """(a) the scoring call's own fields, one run."""
    if j is None:
        return None
    tops, outs, bots = _g(j, "top"), _g(j, "outerwear"), _g(j, "bottom")
    if fact == "long_top":
        if outs or not tops:
            return None
        t = tops[0]
        if t.get("tucked") in ("full", "half"):
            return "no"
        return {"below_crotch": "yes", "cropped": "no", "at_belt": "no", "mid_fly": "no"}.get(t.get("length"))
    if fact == "long_layer":
        if not outs:
            return None
        return {"below_crotch": "yes", "cropped": "no", "at_belt": "no", "mid_fly": "no"}.get(outs[0].get("length"))
    if fact in ("peek", "peek_clearly"):
        if not tops:
            return None
        return "yes" if any(g.get("shows_below_outer") for g in tops) else "no"
    if not bots or bots[0].get("subcategory") in ("shorts", "athletic_shorts"):
        return None
    h = bots[0].get("hem")
    if fact == "heavy_hem":
        return "yes" if h in HEAVY else "no" if h in LIGHT else None
    if fact == "rests":
        if not _g(j, "footwear"):
            return None
        return "yes" if h in ("full_break", "pooling") else "no" if h in ("cropped", "cuffed", "no_break", "slight_break") else None


def read_b(fact, u, l_):
    """(b) the second look, one run (U = upper close-up, L = lower close-up)."""
    if fact in ("long_top", "long_layer", "peek", "peek_clearly"):
        if u is None:
            return None
        kind, hem = u.get("outer_kind"), u.get("outer_hem_at")
        layer = kind in LAYER_KINDS or (kind in ("shirt",) and u.get("under_present") == "yes")
        if fact == "long_top":
            if layer:
                return None
            return "yes" if hem in LONG else "no" if hem in SHORT else None
        if fact == "long_layer":
            if not layer:
                return None
            return "yes" if hem in LONG else "no" if hem in SHORT else None
        shows = u.get("under_shows")
        if u.get("under_present") != "yes":
            return "no"
        if fact == "peek":
            return "yes" if shows in ("a_little", "clearly") else "no"
        return "yes" if shows == "clearly" else "no"
    if l_ is None:
        return None
    if fact == "heavy_hem":
        pe = l_.get("pant_end")
        return "yes" if pe in HEAVY else "no" if pe in LIGHT else None
    if fact == "rests":
        cs = l_.get("covers_shoe")
        return "yes" if cs in ("partly", "mostly") else "no" if cs == "no" else None


def read_c(fact, ph, var):
    """(c) the phone, no AI: the fit ruler, or for a heavy hem the hem probe. One variant."""
    if ph is None:
        return None
    if fact == "heavy_hem":
        v = ((ph.get("hemprobe") or {}).get(var) or {}).get("shoeVisToW")
        return None if v is None else ("yes" if v < HEM_CUT else "no")
    r = (ph.get("ruler") or {}).get(var)
    if r is None:
        return None
    if fact in ("long_top", "long_layer"):
        v = r.get("top_length")
        return "yes" if v == "below_crotch" else "no" if v in ("cropped", "at_belt", "mid_fly") else None
    if fact in ("peek", "peek_clearly"):
        return {"yes": "yes", "no": "no"}.get(r.get("layers"))      # 'na' = one box: it can't see a peek
    if fact == "rests":
        v = r.get("hem")
        return "yes" if v == "covers" else "no" if v in ("meets", "gap") else None


# ============================================================================================ rules
def combine(votes, rule):
    """votes: {'a': v, 'b': v, 'c': v} (each 'yes', 'no' or None). Returns 'yes', 'no' or None (no answer: no points)."""
    if rule in ("a", "b", "c"):
        return votes[rule]
    if rule == "ab":                                  # the two AI readers agree (no phone)
        vs = [votes["a"], votes["b"]]
        return vs[0] if vs[0] is not None and vs[0] == vs[1] else None
    have = [v for v in votes.values() if v is not None]
    if rule == "2of3":
        c = Counter(have)
        return "yes" if c["yes"] >= 2 else "no" if c["no"] >= 2 else None
    if rule == "all":                                 # every reader with an answer agrees, and at least two answer
        return have[0] if len(have) >= 2 and len(set(have)) == 1 else None
    if rule == "any":                                 # not agreement: one reader says yes and none says no
        return "yes" if "yes" in have and "no" not in have else "no" if have and set(have) == {"no"} else None
    raise ValueError(rule)


RULES = ("a", "b", "c", "ab", "2of3", "all", "any")
RULE_TEXT = {"a": "(a) scoring call alone", "b": "(b) second look alone", "c": "(c) phone alone",
             "ab": "(a)+(b) agree", "2of3": "2 of 3 agree", "all": "all available agree (>=2)",
             "any": "one says yes, none says no"}


def majority(vs):
    c = Counter(vs)
    v, n = c.most_common(1)[0]
    return v if n >= 2 else None


# ============================================================================================ (1) fact metrics
def fact_metrics(fact, photos, runs_of, lab, who):
    """runs_of(p) -> [votes run0, run1, run2]. Precision per run (every run that fires), photo coverage by the 3-run
    majority, steadiness = all 3 paired runs give the same answer (None counts as an answer)."""
    out = {}
    for rule in RULES:
        fires = Counter()          # yes/no/either labels among 'yes' runs
        denies = Counter()
        same = n = sf = sd = 0
        fired_photos, fired_his, found, pos, answered = [], [], 0, 0, 0
        for p in photos:
            vals = [combine(v, rule) for v in runs_of(p)]
            n += 1
            same += len(set(vals)) == 1
            sf += len({v == "yes" for v in vals}) == 1          # the grouping a fault uses: fires or not
            sd += len({v == "no" for v in vals}) == 1           # the grouping a 'no' gate uses: denies or not
            lb = lab.get(p, {}).get(fact)
            for v in vals:
                if v == "yes" and lb:
                    fires[lb] += 1
                if v == "no" and lb:
                    denies[lb] += 1
            m = majority(vals)
            answered += m is not None
            if m == "yes":
                fired_photos.append(p)
                if who(p) in ("founder", "friend", "unknown"):
                    fired_his.append(p)
            if lb == "yes":
                pos += 1
                found += m == "yes"
        right = fires["yes"] + fires["either"]
        nf = right + fires["no"]
        dright = denies["no"] + denies["either"]
        nd = dright + denies["yes"]
        out[rule] = {"fire_runs": nf, "fire_right": right, "fire_right_firm": [fires["yes"], fires["yes"] + fires["no"]],
                     "prec": round(right / nf, 3) if nf else None,
                     "deny_runs": nd, "deny_right": dright, "deny_prec": round(dright / nd, 3) if nd else None,
                     "steady": [same, n], "steady_fire": [sf, n], "steady_deny": [sd, n], "photos_fired": fired_photos, "his_fired": fired_his,
                     "recall": [found, pos], "answered": [answered, n]}
    return out


def fmt_rule(m):
    pr = f"{pct(m['fire_right'], m['fire_runs'])}" if m["fire_runs"] else "never fires"
    firm = m["fire_right_firm"]
    return (f"fires right {pr:>14s} (firm {pct(*firm):>12s}) · 'no' right {pct(m['deny_right'], m['deny_runs']):>14s} · "
            f"steady: fires {pct(*m['steady_fire']):>12s}, says no {pct(*m['steady_deny']):>12s} · fires on {len(m['photos_fired']):2d} photos ({len(m['his_fired'])} his/friends') · "
            f"finds {pct(*m['recall'])} of 'yes' labels · answers on {pct(*m['answered'])}")


def passes(m, min_photos=3):
    return (m["prec"] is not None and m["prec"] >= 0.9 and m["steady_fire"][0] >= 0.9 * m["steady_fire"][1]
            and len(m["photos_fired"]) >= min_photos)


def deny_passes(m, min_photos=3):
    return (m["deny_prec"] is not None and m["deny_prec"] >= 0.9 and m["steady_deny"][0] >= 0.9 * m["steady_deny"][1]
            and m["answered"][0] >= min_photos)


# ============================================================================================ (2) the scratch engine
ORIG_PROPORTIONS = P._proportions
CUR = {"facts": {}, "rules": frozenset()}
RULE_SIZES = {   # proportions.md §2 sizes (part points); the gold set sets the final ones
    "F1": "heavy hem under a tailored jacket -2.0",
    "F2": "a long top worn alone -1.5, -2.0 over a loose leg",
    "F3": "a long loose layer (not tailored) over a loose leg -1.5",
    "F10": "the under-top shows below the layer -0.5 (look1's size, as the engine has it)",
    "HB": "a heavy hem blocks the deliberate-shape rewards (and a slight/clean hem doesn't)",
    "DRAG": "Shoes: loose jeans drag on slides -0.5 only when 'rests on the shoe' is agreed",
    "HH": "WHAT-IF, not a proposed rule (RULEBOOK ruling 13 says 0): a heavy hem on loose jeans or cargos, no tailoring, "
          "not on slides -1.0",
}


def _proportions_agree(o, sl, t):
    p = ORIG_PROPORTIONS(o, sl, t)
    if p.na:
        return p
    f, on = CUR["facts"], CUR["rules"]
    T_, O, B = o["top"], o["outer"], o["bottom"]
    leg = B.get("leg_shape")
    o_tailored = O is not None and O.get("subcategory") in P.TAILORED
    new = []
    if "F1" in on and o_tailored and f.get("heavy_hem") == "yes" and B.get("hem") != "pooling":
        new.append((-2.0, "the jeans or trousers bunch on the shoes under a tailored jacket", "PF1_heavy_hem_tailored"))
    if "F2" in on and O is None and T_ is not None and T_.get("tucked") in (None, "none", "na") \
            and f.get("long_top") == "yes":
        new.append((-2.0 if leg in R.LOOSE else -1.5, "the top runs long, past the bottom of the fly", "PF2_long_top"))
    if "F3" in on and O is not None and not o_tailored and f.get("long_layer") == "yes" and leg in R.LOOSE:
        new.append((-1.5, "a long loose layer over loose legs shortens the line", "PF3_long_layer_loose_leg"))
    S_ = o["shoes"]
    if ("HH" in on and not o_tailored and f.get("heavy_hem") == "yes" and B.get("subcategory") in ("jeans", "cargos")
            and leg in R.LOOSE and not (S_ is not None and S_.get("subcategory") in P.SLIDES)):
        new.append((-1.0, "the loose jeans bunch on the shoes", "WHATIF_HH_heavy_hem_loose_jeans"))
    if not new and not ("HB" in on and f.get("heavy_hem") == "yes"):
        return p
    old_faults = -sum(r["points"] for r in p.reasons if r["points"] < 0)
    for pts, line, check in new:
        p.add(pts, line, check)
    faults = old_faults - sum(x[0] for x in new)
    if faults >= 1.0 or ("HB" in on and f.get("heavy_hem") == "yes"):
        for r in [r for r in p.reasons if r["points"] > 0 and r["check"].startswith("PR")]:
            p.score -= r["points"]
            p.reasons.remove(r)
    return p


@contextlib.contextmanager
def agreed(facts, rules):
    CUR["facts"], CUR["rules"] = facts, frozenset(rules)
    P._proportions = _proportions_agree
    try:
        yield
    finally:
        P._proportions = ORIG_PROPORTIONS
        CUR["facts"], CUR["rules"] = {}, frozenset()


def score(reading, occ, facts=None, rules=(), look_sl=None):
    """rules=() and look_sl=None: exactly what the app runs today (v7, no second look)."""
    sl = dict(look_sl) if look_sl else None
    if facts is not None:
        sl = {"peek": (facts.get("peek") == "yes") if "F10" in rules else None,
              "rests_on_shoe": (facts.get("rests") == "yes") if "DRAG" in rules else None}
    if facts is None:
        return P.score_parts(reading, occ, Q.PROFILE, sl, Q.BOLD, engine="v7")
    with agreed(facts, rules):
        return P.score_parts(reading, occ, Q.PROFILE, sl, Q.BOLD, engine="v7")


def prop_of(r):
    return ((r.get("parts") or {}).get("proportions") or {}).get("display")


# ============================================================================================ main
def load_pull11():
    import sqlite3
    db = sqlite3.connect(f"file:{PULL11}?mode=ro&immutable=1", uri=True)
    q = ("select f.image_hash, f.occasion, r.reading_json from fit_checks f join readings r on r.id = f.reading_id "
         "where f.status = 'scored' order by f.created_at")
    out = {}
    for h, occ, js in db.execute(q):
        out.setdefault("phone-" + h[:6], {"reading": json.loads(js), "occ": occ, "src": "pull 20261011"})
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    phone = json.loads((OUT / "phone_readers.json").read_text())
    lab = load_labels()
    prim, B1, _B1L, U, L, _Z = Q.load()
    new11 = {k: v for k, v in load_pull11().items() if k not in prim}
    prim.update(new11)
    def who(k):                                       # af7e93 = the founder's Oct 11 check (parts7_test.py)
        return "founder" if k == "phone-af7e93" else T.who(k)
    photos = sorted(B1)
    res = {"profile": "test profile: picks Minimal + Smart casual (0.5 each), boldness a little, no age",
           "hem_cut": HEM_CUT, "phone_variants": VARS}
    say("AGREEMENT TEST (Oct 11): a proportion fact moves points only when independent readers agree")
    say("  readers: (a) scoring call, batch 1 arm A, 3 runs · (b) second look look1 U/L, 3 runs · (c) phone: fit ruler "
        f"(hem: hem probe shoeVisToW < {HEM_CUT}), variants {'/'.join(VARS)}")
    say(f"  {len(photos)} photos; phone readings on {sum(1 for p in photos if p in phone)}; real corpus {len(prim)} "
        f"(+{len(new11)} from the Oct 11 pull: {', '.join(new11)})")
    say("  Rule 7: founder profile pending; friends profile unknown; 703a8b/ebe23f unknown (ask the founder); stock/web "
        "profile unknown; one test profile (Minimal + Smart casual), so no age-band or picked-look split.")

    def runs_of_fact(fact):
        def f(p):
            out = []
            for i in range(3):
                a = B1[p][i] if p in B1 and len(B1[p]) > i else None
                u = U[p][i] if p in U and len(U[p]) > i else None
                l_ = L[p][i] if p in L and len(L[p]) > i else None
                out.append({"a": read_a(fact, a), "b": read_b(fact, u, l_), "c": read_c(fact, phone.get(p), VARS[i])})
            return out
        return f

    # ---------------------------------------------------------------- (1) per fact, per reader and rule
    say("\n(1) EACH FACT: precision when it fires (every run), 'no' precision, 3-run steadiness, coverage")
    say("    bars: >= 90% right when it fires, >= 90% steady in the grouping the rule uses (fires or not), fires on >= 3 photos."
        "\n    Steadiness = the same answer on all 3 paired runs (scoring call run i, second look run i, phone variant i).")
    res["facts"], facts_raw, passed = {}, {}, {}
    for fact, text in FACTS.items():
        rf = runs_of_fact(fact)
        labelled = [p for p in photos if lab.get(p, {}).get(fact)]
        lc = Counter(lab[p][fact] for p in labelled)
        say(f"\n  {fact}: {text}")
        say(f"    labels on {len(labelled)} photos: yes {lc['yes']} · either {lc['either']} · no {lc['no']}")
        m = fact_metrics(fact, labelled, rf, lab, who)
        res["facts"][fact] = {"labels": dict(lc), "rules": m}
        facts_raw[fact] = {p: rf(p) for p in photos}
        for rule in RULES:
            ok = passes(m[rule])
            say(f"    {RULE_TEXT[rule]:27s} {fmt_rule(m[rule])}{'  PASS' if ok else ''}")
            if ok:
                passed.setdefault(fact, []).append(rule)
        for rule in ("2of3", "all"):
            fp = m[rule]["photos_fired"]
            if fp:
                say(f"      {rule} fires on: " + ", ".join(f"{p} [{lab[p][fact]}]" for p in fp))
    res["passed"] = passed
    say("\n  PASSED (fires): " + (", ".join(f"{k}: {v}" for k, v in passed.items()) or "none"))
    dpass = {fact: [r for r in RULES if deny_passes(res["facts"][fact]["rules"][r])] for fact in FACTS}
    res["deny_passed"] = dpass
    say("  'no' side >= 90% right and steady: " + ", ".join(f"{k}: {v}" for k, v in dpass.items() if v))
    (OUT / "facts.json").write_text(json.dumps({"labels": {p: lab.get(p, {}) for p in photos}, "votes": facts_raw}, indent=1))

    # ---------------------------------------------------------------- (1b) the hem facts on the wider labelled set
    say("\n(1b) THE HEM FACTS ON EVERY HEM-LABELLED PHOTO (not only the 50): (a) = batch 1 arm A where it exists, else "
        "zoom1 / zoom1-stock arm B (the app's config, 3 runs); (b) only on the 50; labels: hem_labels.csv (heavy), "
        "ruler_labels.csv hem_pos (rests: covers vs meets/gap)")
    wide = defaultdict(dict)
    for r in csv.DictReader(open(HERE / "hem_labels.csv")):
        wide[r["photo"]]["heavy_hem"] = {"heavy": "yes", "light": "no"}.get(r["heavy"])
    for r in csv.DictReader(open(HERE / "ruler_labels.csv")):
        wide[r["photo"]]["rests"] = tri(r["hem_pos"], {"covers"}, {"meets", "gap"})
    res["wide"] = {}
    for fact in ("heavy_hem", "rests"):
        def rf(p, fact=fact):
            runs = B1.get(p) or _Z.get(p) or []
            out = []
            for i in range(3):
                a = runs[i] if len(runs) > i else None
                u = U[p][i] if p in U and len(U[p]) > i else None
                l_ = L[p][i] if p in L and len(L[p]) > i else None
                out.append({"a": read_a(fact, a), "b": read_b(fact, u, l_), "c": read_c(fact, phone.get(p), VARS[i])})
            return out
        ps = sorted(p for p in wide if wide[p].get(fact) and (p in B1 or p in _Z or p in phone))
        lc = Counter(wide[p][fact] for p in ps)
        m = fact_metrics(fact, ps, rf, wide, who)
        res["wide"][fact] = {"labels": dict(lc), "rules": m}
        say(f"\n  {fact} on {len(ps)} photos (yes {lc['yes']} · either {lc['either']} · no {lc['no']})")
        for rule in RULES:
            say(f"    {RULE_TEXT[rule]:27s} {fmt_rule(m[rule])}{'  PASS' if passes(m[rule]) else ''}")
        wrong = sorted({p for p in ps for v in rf(p) if combine(v, "c") == "yes" and wide[p][fact] == "no"})
        say(f"      the phone fires on a 'no' label: {', '.join(wrong) or 'none'}")

    # ---------------------------------------------------------------- (2) rescoring the real corpus
    say("\n(2) RESCORING (scratch wrapper around parts v7; the engine file is unchanged)")
    for k, v in RULE_SIZES.items():
        say(f"    {k}: {v}")

    def votes_real(fact, k, reading):
        """One reading per real photo: (a) its own reading, (b) the look1 majority over 3 runs, (c) the phone's base."""
        b = None
        if k in U and k in L:
            b = majority([read_b(fact, U[k][i], L[k][i]) for i in range(3)])
        return {"a": read_a(fact, reading), "b": b, "c": read_c(fact, phone.get(k), "base")}

    def rule_for(mode, f):
        return mode.get(f) if isinstance(mode, dict) else mode

    def facts_real(k, reading, mode):
        if mode == "labels":                          # the label ceiling: Claude's blind labels as the facts
            return {f: {"yes": "yes", "no": "no"}.get(lab.get(k, {}).get(f)) for f in FACTS}
        return {f: (combine(votes_real(f, k, reading), rule_for(mode, f)) if rule_for(mode, f) else None) for f in FACTS}

    def facts_run(k, i, mode):
        if mode == "labels":
            return facts_real(k, None, mode)
        a = B1[k][i]
        return {f: (combine({"a": read_a(f, a), "b": read_b(f, U[k][i] if k in U else None, L[k][i] if k in L else None),
                             "c": read_c(f, phone.get(k), VARS[i])}, rule_for(mode, f)) if rule_for(mode, f) else None)
                for f in FACTS}

    SETS = {
        "today (app: v7, no second look)": (None, ()),
        "v7 + look1 alone (the earlier paper tests)": ("look", ()),
        "all-agree: F1 heavy hem under tailoring": ("all", ("F1",)),
        "all-agree: F2 long top": ("all", ("F2",)),
        "all-agree: F3 long loose layer": ("all", ("F3",)),
        "all-agree: F10 peek": ("all", ("F10",)),
        "all-agree: HB heavy hem blocks rewards": ("all", ("HB",)),
        "all-agree: DRAG rests on the shoe (slides)": ("all", ("DRAG",)),
        "2of3: F1+F2+F3+F10+HB+DRAG": ("2of3", ("F1", "F2", "F3", "F10", "HB", "DRAG")),
        "all-agree: F1+F2+F3+F10+HB+DRAG": ("all", ("F1", "F2", "F3", "F10", "HB", "DRAG")),
        "one-yes-no-veto: F1+F2+F3+F10+HB+DRAG": ("any", ("F1", "F2", "F3", "F10", "HB", "DRAG")),
        "passing readers: hem probe heavy (F1+HB), look rests (DRAG)": ({"heavy_hem": "c", "rests": "b"}, ("F1", "HB", "DRAG")),
        "label ceiling: F1+F2+F3+F10+HB+DRAG": ("labels", ("F1", "F2", "F3", "F10", "HB", "DRAG")),
        "what-if HH, label facts": ("labels", ("F1", "F2", "F3", "F10", "HB", "DRAG", "HH")),
        "what-if HH, (a) alone": ({"heavy_hem": "a"}, ("HB", "HH")),
    }

    def score_set(k, rd, occ, name):
        mode, rules = SETS[name]
        if mode is None:
            return score(rd, occ)
        if mode == "look":
            return score(rd, occ, look_sl=T.second_look_for(k, U, L))
        return score(rd, occ, facts_real(k, rd, mode), rules)

    rows = {}
    for k, v in prim.items():
        rows[k] = {name: score_set(k, v["reading"], v["occ"], name) for name in SETS}
    sel = [k for k in rows if all(rows[k][n]["overall"] is not None for n in SETS)]
    res["rescore"] = {}
    for name in SETS:
        props = [prop_of(rows[k][name]) for k in sel if prop_of(rows[k][name]) is not None]
        pc = Counter(props)
        line, bands = Q.band_line(name[:34], [rows[k][name]["overall"] for k in sel])
        mv = [k for k in sel if rows[k][name]["overall"] != rows[k]["today (app: v7, no second look)"]["overall"]]
        pmv = [k for k in sel if prop_of(rows[k][name]) != prop_of(rows[k]["today (app: v7, no second look)"])]
        res["rescore"][name] = {"prop_spread": dict(sorted(pc.items())), "prop_at_7": [pc.get(7.0, 0), len(props)],
                                "score_bands": bands, "score_moved": mv, "prop_moved": pmv}
        say(f"\n  {name}")
        say(f"    Proportions on {len(props)} photos with the part: exactly 7 on {pct(pc.get(7.0, 0), len(props))}; spread "
            + " · ".join(f"{x:g}: {n}" for x, n in sorted(pc.items())))
        say("  " + line)
        say(f"    Proportions moves on {len(pmv)}, the shown score on {len(mv)} (vs today)")
        for k in pmv:
            a, b = rows[k]["today (app: v7, no second look)"], rows[k][name]
            fired = [r["check"] for r in b["parts"]["proportions"]["reasons"] if r["check"] not in
                     {x["check"] for x in a["parts"]["proportions"]["reasons"]}]
            gone = [r["check"] for r in a["parts"]["proportions"]["reasons"] if r["check"] not in
                    {x["check"] for x in b["parts"]["proportions"]["reasons"]}]
            say(f"      {k:26s} [{T.WHO_TEXT[who(k)]}; {prim[k]['occ']}] Proportions {prop_of(a):g} -> {prop_of(b):g}, "
                f"score {a['overall']} -> {b['overall']}" + (f" · + {','.join(fired)}" if fired else "")
                + (f" · - {','.join(gone)}" if gone else ""))
        for k in [k for k in mv if k not in pmv]:
            a, b = rows[k]["today (app: v7, no second look)"], rows[k][name]
            say(f"      {k:26s} [{T.WHO_TEXT[who(k)]}; {prim[k]['occ']}] score {a['overall']} -> {b['overall']} "
                f"(Shoes {a['parts']['shoes']['display']} -> {b['parts']['shoes']['display']})")

    # his and his friends' checks
    say("\n  THE FOUNDER, HIS FRIENDS AND THE TWO UNKNOWNS: Proportions / score per set")
    mine = sorted([k for k in sel if who(k) in ("founder", "friend", "unknown")], key=lambda k: (who(k), k))
    res["his"] = {}
    tags = {"today (app: v7, no second look)": "today", "v7 + look1 alone (the earlier paper tests)": "look1",
            "2of3: F1+F2+F3+F10+HB+DRAG": "2of3", "all-agree: F1+F2+F3+F10+HB+DRAG": "all",
            "passing readers: hem probe heavy (F1+HB), look rests (DRAG)": "passing",
            "label ceiling: F1+F2+F3+F10+HB+DRAG": "labels", "what-if HH, label facts": "HH-labels",
            "what-if HH, (a) alone": "HH-a"}
    say("    (Proportions/score) " + " | ".join(tags.values()))
    for k in mine:
        res["his"][k] = {n: [prop_of(rows[k][n]), rows[k][n]["overall"]] for n in SETS}
        say(f"    {k:14s} [{T.WHO_TEXT[who(k)][:26]:26s}; {prim[k]['occ']:9s}] " + " | ".join(
            f"{t} {prop_of(rows[k][n])}/{rows[k][n]['overall']}" for n, t in tags.items()))
    for k in ("phone-d1967f", "phone-e438d4", "phone-f4870b", "phone-fb0b17"):
        say(f"    facts {k}: " + " · ".join(f"{f}={json.dumps(votes_real(f, k, prim[k]['reading']))}" for f in
                                            ("long_layer", "heavy_hem", "rests", "peek")))

    # ---------------------------------------------------------------- (3) steadiness on batch 1 arm A
    say("\n(3) 3-RUN STEADINESS (batch 1 arm A, Everyday; run i paired with look1 run i and phone variant i)")
    res["steady"] = {}
    for name, (mode, rules) in SETS.items():
        per = {}
        for k in photos:
            vals = []
            for i in range(3):
                rd = B1[k][i]
                if mode is None:
                    r = score(rd, "everyday")
                elif mode == "look":
                    r = score(rd, "everyday", look_sl=T.second_look_for(k, U, L, i))
                else:
                    r = score(rd, "everyday", facts_run(k, i, mode), rules)
                vals.append((r["overall"], prop_of(r)))
            per[k] = vals
        ok = [v for v in per.values() if None not in [x[0] for x in v]]
        w = sum(1 for v in ok if all(abs(x[0] - st.median([y[0] for y in v])) <= 0.5 for x in v))
        ex = sum(1 for v in ok if len({x[0] for x in v}) == 1)
        pex = sum(1 for v in ok if len({x[1] for x in v}) == 1)
        res["steady"][name] = {"within_0.5": [w, len(ok)], "exact": [ex, len(ok)], "prop_exact": [pex, len(ok)],
                               "unsteady": {k: v for k, v in per.items() if len({x[0] for x in v}) > 1}}
        say(f"  {name:44s} within 0.5 {pct(w, len(ok))} · score exact {pct(ex, len(ok))} · Proportions exact {pct(pex, len(ok))}")
        uns = [k for k, v in per.items() if len({x[1] for x in v}) > 1 and len({x[1] for x in per_today[k]}) == 1] \
            if name != "today (app: v7, no second look)" else []
        for k in uns:
            say(f"      Proportions flips that today doesn't have: {k} {per[k]}")
        if name == "today (app: v7, no second look)":
            per_today = per  # noqa: F841 (used by the later sets)

    # ---------------------------------------------------------------- (4) the judge panel
    say("\n(4) AGAINST THE JUDGE PILOT (panel = median of 5 judges' weighted totals; split = results/parts2/split.json)")
    jp = [x for x in Q.load_panel() if x["key"] in rows]
    pp = panel_proportion()
    saved = json.load(open(HERE / "results/parts2/split.json"))
    half = {pid: v["half"] for pid, v in saved["photos"].items()}
    res["judge"] = {}
    for side, label in (("all", "all"), ("held", "held-out half")):
        xs = [x for x in jp if side == "all" or half.get(x["id"]) == side]
        res["judge"][side] = {}
        for name in SETS:
            o = Q.cmp_stats([(rows[x["key"]][name]["overall"], x["panel"]) for x in xs])
            pr = [(prop_of(rows[x["key"]][name]), pp[x["id"]]) for x in xs
                  if prop_of(rows[x["key"]][name]) is not None and pp.get(x["id"]) is not None]
            op = Q.cmp_stats(pr)
            res["judge"][side][name] = {"score": o, "proportions_vs_panel_proportion": op}
            say(f"  {label:13s} {name:44s} score: {Q.fmt_cmp(o)}")
            say(f"  {'':13s} {'':44s} Proportions vs the judges' proportion: {Q.fmt_cmp(op)}")

    say("\n  Proportions vs the judges' proportion part, by whose photo (all pilot photos)")
    res["judge_by_group"] = {}
    for name in ("today (app: v7, no second look)", "v7 + look1 alone (the earlier paper tests)",
                 "label ceiling: F1+F2+F3+F10+HB+DRAG", "what-if HH, label facts", "what-if HH, (a) alone"):
        for grp, members in (("his + friends + unknowns", ("founder", "friend", "unknown")), ("stock + web", ("stock", "web"))):
            pr = [(prop_of(rows[x["key"]][name]), pp[x["id"]]) for x in jp if who(x["key"]) in members
                  and prop_of(rows[x["key"]][name]) is not None and pp.get(x["id"]) is not None]
            o = Q.cmp_stats(pr)
            res["judge_by_group"][f"{name} · {grp}"] = o
            say(f"    {name[:40]:40s} {grp:25s} {Q.fmt_cmp(o)}")
    (OUT / "analysis.txt").write_text("\n".join(LINES) + "\n")
    json.dump(res, open(OUT / "analysis.json", "w"), indent=1, default=lambda o: sorted(o) if isinstance(o, (set, frozenset)) else str(o))


def panel_proportion():
    """{pilot id: median of the 5 judges' proportion part}."""
    import os
    d = K / "inputs/judge-pilot"
    vals = defaultdict(list)
    for f in sorted(os.listdir(d)):
        if f.startswith("judge-") and f.endswith(".csv"):
            for r in csv.DictReader(open(d / f)):
                try:
                    vals[r["id"]].append(float(r["proportion"]))
                except (TypeError, ValueError, KeyError):
                    pass
    return {k: st.median(v) for k, v in vals.items() if v}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--collect", action="store_true")
    a = ap.parse_args()
    if a.collect:
        collect()
    else:
        main()
