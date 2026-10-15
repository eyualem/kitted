#!/usr/bin/env python3
"""The report for model_test.py (DECISIONS-LOG #278): per arm and per multi-call system.

  /usr/bin/python3 model_test.py report      → results/models1/report.md

Systems built from the luna runs (no extra calls):
  vote3     read 3 times; keep the medoid reading (the one agreeing most with the other two on the key fields)
  cascade   read twice; if the two agree (score within 0.5 and the waist/leg/shoe fields equal) keep the first, else
            read a third time and keep the medoid (cost = 2 reads, + 1 when they disagree)
Steadiness of a system = run it twice on independent reads (runs 0–2 vs 3–5) and compare.
"""
import csv, json, statistics as st, sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "rubrics"))
import gold_tune as G  # noqa: E402
import parts_proto as P  # noqa: E402
import parts2_test as Q  # noqa: E402
import waist_test as WT  # noqa: E402
import zoom_test as Z  # noqa: E402

OUT = HERE / "results" / "models1"
ENGINE = "v13"
GEM_PRICE = (0.75 / 1e6, 3.75 / 1e6)


def load():
    """{arm: {(set, photo): {run: record}}}, the control from the earlier runs."""
    arms = defaultdict(lambda: defaultdict(dict))
    for r in json.loads((HERE / "results" / "gold1" / "raw.json").read_text()):
        if r.get("json"):
            u = r.get("usage") or {}
            r["cost"] = u.get("promptTokenCount", 0) * GEM_PRICE[0] + u.get("candidatesTokenCount", 0) * GEM_PRICE[1]
            arms["gem38"][("gold", r["photo"])][r["run"]] = r
    for s, name in (("phone", "zoom1"), ("stock", "zoom1-stock")):
        for r in json.loads((HERE / "results" / name / "raw.json").read_text()):
            if r.get("arm") == "B" and r.get("json"):
                u = r.get("usage") or {}
                r["cost"] = u.get("promptTokenCount", 0) * GEM_PRICE[0] + u.get("candidatesTokenCount", 0) * GEM_PRICE[1]
                arms["gem38"][(s, r["photo"])][r["run"]] = r
    for f in sorted(OUT.glob("*/raw.json")):
        for r in json.loads(f.read_text()):
            if r.get("json"):
                arms[r["arm"]][(r["set"], r["photo"])][r["run"]] = r
    return arms


def score(reading):
    try:
        return P.score_parts(reading, "everyday", Q.PROFILE, None, Q.BOLD, engine=ENGINE).get("overall")
    except Exception:
        return None


# ---------- key fields, agreement, the medoid

def first(gs, cat):
    return next((g for g in gs if g.get("category") == cat), None)


def keyf(reading):
    gs = reading.get("garments") or []
    T, O, B, S = first(gs, "top"), first(gs, "outerwear"), first(gs, "bottom"), first(gs, "footwear")
    g = lambda x, k: (x or {}).get(k)
    return {"top": g(T, "subcategory"), "top_len": g(T, "length"), "tuck": g(T, "tucked"), "top_vol": g(T, "volume"),
            "outer": g(O, "subcategory"), "bottom": g(B, "subcategory"), "leg": g(B, "leg_shape"), "hem": g(B, "hem"),
            "shoes": g(S, "subcategory"), "top_color": g(T, "color_family"), "bottom_color": g(B, "color_family")}


def agree(a, b):
    ka, kb = keyf(a), keyf(b)
    return sum(ka[k] == kb[k] for k in ka)


def medoid(readings):
    if len(readings) == 1:
        return readings[0]
    best = max(range(len(readings)), key=lambda i: (sum(agree(readings[i], readings[j]) for j in range(len(readings)) if j != i), -i))
    return readings[best]


def with_waist(reading, spec, call):
    """The reading with the first top's tuck and length set from the waist specialist's answer."""
    r = json.loads(json.dumps(reading))
    T = first(r.get("garments") or [], "top")
    if T is None or call is None:
        return r
    T["tucked"] = spec.get("tucked") or T.get("tucked")
    if T["tucked"] == "full":
        return r
    if call == "waist_shows":
        if T.get("length") not in ("cropped", "at_belt"):
            T["length"] = "cropped" if spec.get("top_end") == "above_waistband" else "at_belt"
    else:
        T["length"] = "below_crotch" if spec.get("top_end") == "below_crotch" else "mid_fly"
    return r


def waist_call(r):
    c = WT.ai_call(r)[0]
    return c[0] if c else None


def cascade(runs):
    """runs: readings in order. Returns (reading, reads used)."""
    a, b = runs[0], runs[1]
    sa, sb = score(a), score(b)
    ka, kb = keyf(a), keyf(b)
    same = sa is not None and sb is not None and abs(sa - sb) <= 0.5 and all(ka[k] == kb[k] for k in ("top_len", "tuck", "leg", "shoes"))
    if same or len(runs) < 3:
        return a, 2
    return medoid(runs[:3]), 3


# ---------- the report

def main():
    arms = load()
    D = G.load()
    sp = G.get_split()
    labels = WT.load_labels(); WT.SECOND.clear(); WT.SECOND.update(WT.load_second())
    truth = Z.load_truth()
    L = ["# Which model reads the outfit", "", "Control: gemini-3.8-flash (the live config). Score: parts engine v13, Everyday, "
         "the stated test profile (rule 7: gold and stock are profile unknown; his profile is pending). "
         "Panel = the 5-judge gold-set panel; tune/test = gold_tune's split (test scored once).", ""]
    systems = {}
    for arm, by in arms.items():
        systems[arm] = {k: [v[i]["json"] for i in sorted(v)] for k, v in by.items()}
    # Multi-call systems from luna (needs ≥ 3 runs; steadiness needs 6).
    if "luna" in systems:
        lu = systems["luna"]
        systems["luna_vote3"] = {k: [medoid(v[:3])] + ([medoid(v[3:6])] if len(v) >= 6 else []) for k, v in lu.items() if len(v) >= 3}
        cas, used = {}, []
        for k, v in lu.items():
            if len(v) >= 3:
                r1, n1 = cascade(v[:3]); out = [r1]; used.append(n1)
                if len(v) >= 6:
                    r2, n2 = cascade(v[3:6]); out.append(r2); used.append(n2)
                cas[k] = out
        systems["luna_cascade"] = cas
        cascade_reads = st.mean(used) if used else None
    else:
        cascade_reads = None
    # luna + the waist specialist (waist_specialist.py, mapping B): the top's tuck and length from the narrow call.
    spec_f = HERE / "results" / "waist-specialist" / "luna_none.json"
    if "luna" in systems and spec_f.exists():
        import waist_specialist as WS
        spec = {}
        for r in json.loads(spec_f.read_text()):
            if r.get("json"):
                spec[(r["set"], r["photo"], r["run"])] = r["json"]
        combo = {}
        for k, v in systems["luna"].items():
            out = []
            for i, rd in enumerate(v[:2]):
                sj = spec.get((k[0], k[1], i))
                out.append(with_waist(rd, sj, WS.call_of_visible(sj)) if sj else rd)
            combo[k] = out
        systems["luna_waist"] = combo
    reads_per = {"luna_vote3": 3, "luna_cascade": cascade_reads, "luna_waist": 1.4}  # the specialist ≈ 0.4 of a main read

    def cost_of(arm):
        base = arm.split("_")[0] if arm.startswith("luna_") and arm not in ("luna_low",) else arm
        recs = [r for v in arms.get(base, {}).values() for r in v.values()]
        c = st.mean(r.get("cost", 0) for r in recs) if recs else 0
        return c * (reads_per.get(arm) or 1)

    def secs_of(arm):
        base = arm.split("_")[0] if arm.startswith("luna_") and arm not in ("luna_low",) else arm
        s = sorted(r.get("seconds", 0) for v in arms.get(base, {}).values() for r in v.values() if r.get("seconds"))
        return (st.median(s), s[int(0.9 * len(s)) - 1]) if s else (None, None)

    L += ["## The headline", "", "| System | ¢ per check (read only) | Median s · p90 | Same photo, same score (within 0.5 · identical) | Gold test r with the panel | Proportions r (test) | His 20 | 8+ share (test) |",
          "|---|---|---|---|---|---|---|---|"]
    detail = []
    for arm in ["gem38", "fl35", "luna", "luna_low", "luna56", "mini54", "sol6", "haiku55", "sonnet55", "luna_waist", "luna_vote3", "luna_cascade"]:
        if arm not in systems:
            continue
        S = systems[arm]
        gold = {p: v for (s, p), v in S.items() if s == "gold"}
        # steadiness: runs 0 vs 1 on every set
        pairs = [(score(v[0]), score(v[1])) for v in S.values() if len(v) >= 2]
        pairs = [(a, b) for a, b in pairs if a is not None and b is not None]
        steady = f"{sum(abs(a - b) <= 0.5 for a, b in pairs)}/{len(pairs)} · {sum(a == b for a, b in pairs)}/{len(pairs)}" if pairs else "–"
        D2 = dict(D); D2["runs"] = {p: v[:2] for p, v in gold.items()}
        Sc = {p: [P.score_parts(rd, "everyday", Q.PROFILE, None, Q.BOLD, engine=ENGINE) for rd in v[:2]] for p, v in gold.items()}
        tp = [p for p in sp["test"] if p in Sc and Sc[p] and Sc[p][0].get("overall") is not None and p in D["panel"]]
        ok_gold = len(tp) >= 20
        mt = G.metrics(D2, Sc, [p for p in sp["test"] if p in Sc]) if ok_gold else None
        ma = G.metrics(D2, Sc, [p for p in sp["tune"] + sp["test"] if p in Sc]) if ok_gold else None
        med, p90 = secs_of(arm)
        if mt:
            L.append(f"| {arm} | {cost_of(arm) * 100:.3f} | {med} · {p90} | {steady} | {mt['r']:.2f} (all {ma['r']:.2f}) | {mt['parts'].get('proportions', (0, float('nan')))[1]:.2f} | "
                     f"{mt['founder'][1]:.2f} ({mt['founder'][2]}/{mt['founder'][0]} within 0.5) | {100 * mt['share_8']:.0f}% |" if "founder" in mt else
                     f"| {arm} | {cost_of(arm) * 100:.3f} | {med} · {p90} | {steady} | {mt['r']:.2f} | | | |")
            detail.append((arm, mt, ma))
    L += ["", "## Accuracy against truth", "",
          "His Oct 8 photos: `inputs/phone-oct8/truth.csv` (every run counts). Waist: the two blind label passes where they agree. Leg: pass-1 labels.", "",
          "| System | top type | bottom type | footwear type | color | leg (truth.csv) | hem | sleeve | waist shows (agreed labels) | leg (labels, all sets) |",
          "|---|---|---|---|---|---|---|---|---|---|"]
    for arm in systems:
        S = systems[arm]
        hits = defaultdict(lambda: [0, 0])
        for (s, p), v in S.items():
            for rd in v:
                for t in truth.get(p, []):
                    g = Z.primary(rd.get("garments"), Z.SLOT_CAT[t["slot"]])
                    ok_types = {t["truth_type"], *filter(None, t["also_ok"].split("|"))}
                    hits[t["slot"]][0] += bool(g and g.get("subcategory") in ok_types); hits[t["slot"]][1] += 1
                    if t["truth_color"]:
                        ok_c = {t["truth_color"], *filter(None, t["also_ok_color"].split("|"))}
                        hits["color"][0] += bool(g and g.get("color_family") in ok_c); hits["color"][1] += 1
                    for fld in ("leg_shape", "hem", "sleeve_end"):
                        if t.get(fld):
                            hits[fld][0] += bool(g and g.get(fld) == t[fld]); hits[fld][1] += 1
                lab = labels.get(p)
                if lab:
                    tr = WT.truth(dict(lab, photo=p))
                    wc = waist_call(rd)
                    if tr and wc:
                        hits["waist"][0] += wc == tr; hits["waist"][1] += 1
                    if lab.get("leg") in ("slim", "straight", "wide"):
                        b = first(rd.get("garments") or [], "bottom")
                        ls = {"skinny": "slim", "relaxed": "wide"}.get((b or {}).get("leg_shape"), (b or {}).get("leg_shape"))
                        if ls in ("slim", "straight", "wide"):
                            hits["leg_lab"][0] += ls == lab["leg"]; hits["leg_lab"][1] += 1
        f = lambda k: f"{100 * hits[k][0] // max(1, hits[k][1])}% ({hits[k][1]})" if hits[k][1] else "–"
        L.append(f"| {arm} | {f('top')} | {f('bottom')} | {f('footwear')} | {f('color')} | {f('leg_shape')} | {f('hem')} | {f('sleeve_end')} | {f('waist')} | {f('leg_lab')} |")
    # Agreement with the control, field by field (run 0 vs run 0).
    L += ["", "## Same reading as today's Gemini? (run 0 vs run 0, every set)", ""]
    ctrl = systems.get("gem38", {})
    fields = list(keyf({"garments": []}))
    L.append("| System | " + " | ".join(fields) + " | score within 0.5 |")
    L.append("|---|" + "---|" * (len(fields) + 1))
    for arm in systems:
        if arm == "gem38":
            continue
        S = systems[arm]
        both = [k for k in S if k in ctrl and S[k] and ctrl[k]]
        if not both:
            continue
        cells = []
        for fl in fields:
            cells.append(f"{100 * sum(keyf(S[k][0])[fl] == keyf(ctrl[k][0])[fl] for k in both) // len(both)}%")
        sc = [(score(S[k][0]), score(ctrl[k][0])) for k in both]
        sc = [(a, b) for a, b in sc if a is not None and b is not None]
        L.append(f"| {arm} | " + " | ".join(cells) + f" | {100 * sum(abs(a - b) <= 0.5 for a, b in sc) // max(1, len(sc))}% |")
    # Self-agreement per field (does the model give the same answer twice?).
    L += ["", "## Same answer twice? (run 0 vs run 1, per field)", ""]
    L.append("| System | " + " | ".join(fields) + " |")
    L.append("|---|" + "---|" * len(fields))
    for arm in systems:
        S = systems[arm]
        both = [v for v in S.values() if len(v) >= 2]
        if both:
            L.append(f"| {arm} | " + " | ".join(f"{100 * sum(keyf(v[0])[fl] == keyf(v[1])[fl] for v in both) // len(both)}%" for fl in fields) + " |")
    if cascade_reads:
        L += ["", f"The cascade read {cascade_reads:.2f} times per photo on average (2 when the first two agree, 3 when not)."]
    L += ["", "## Gold detail (test half)", ""]
    for arm, mt, ma in detail:
        L.append(G.fmt(arm, mt))
    (OUT / "report.md").write_text("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
