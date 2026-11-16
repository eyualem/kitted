#!/usr/bin/env python3
"""Do his taste rules hold inside each look? (rules-by-style, Nov 16, $0; no engine change.)

The founder (Nov 16): "make sure u make the rules specific to what preferences the user has like streetwear or a
combination like streetwear and formal." Round 3 (T68) found his taste rules on all 164 rated photos pooled. This
splits the same photos by the look the outfit reads as ON ITS OWN (the pick-free detection, R.detect_styles with no
picks) and checks each rule inside each look.

  KITTED_DATA=<main checkout> /usr/bin/python3 rules_by_style.py      -> results/taste1/by_style.txt

Two views of a look:
  - "label": the single pick-free "Reads as" name (look-alike rules, then the fixed order); every photo in one group.
  - "detected": every look the outfit passes (a photo can be in two); this is where mixes show.
Each rule is measured as his score against his own average for that leg shape (all 164), so a rule isn't credited
with what the leg already explains (wide legs come with trousers and longer hems). The leg rule itself is raw means.
Groups under 5 photos are counts only. His ratings are gut taste and drift (Nov 16): direction, not targets.
"""
import statistics as st
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import rubric as R  # noqa: E402
import parts_proto as P  # noqa: E402
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402

OUT = HERE / "results" / "taste1" / "by_style.txt"
NAMES = dict(R.STYLE_NAMES)


def leg_class(rd):
    B = next((g for g in rd.get("garments", []) if g.get("category") == "bottom"), None)
    if not B:
        return None
    if B.get("subcategory") in P.SHORTS:
        return "shorts"
    leg = R.LEG_ALIAS.get(B.get("leg_shape"), B.get("leg_shape"))
    return {"skinny": "skinny", "slim": "slim", "straight": "straight", "relaxed": "wide", "wide": "wide"}.get(leg)


TL_JACKET = {"suit_jacket", "blazer", "sport_coat", "unstructured_blazer"}
TL_NEVER = {"jeans", "chinos", "cargos", "sweatpants", "joggers", "shorts", "athletic_shorts", "track_pants",
            "chunky_sneaker", "performance_runner", "basketball_sneaker", "slides_sandals", "work_boot", "hoodie",
            "sweatshirt", "graphic_tee", "tank_top", "jersey", "fleece"}


def tailored(rd):
    """specs/tailored.md TL1's extra condition and its 'never' list, by hand (T94 isn't built): a tailored jacket
    and dress trousers, nothing from the never list, nothing at roominess 5."""
    gs = R.scored_garments(rd)
    subs = {g.get("subcategory") for g in gs}
    return (bool(subs & TL_JACKET) and bool(subs & {"suit_trousers", "trousers"}) and not subs & TL_NEVER
            and all((g.get("volume") or 3) < 5 for g in gs))


def facts(rd, lk, r16):
    gs = rd.get("garments", [])
    tops = [g for g in gs if g.get("category") == "top"]
    outs = [g for g in gs if g.get("category") == "outerwear"]
    bots = [g for g in gs if g.get("category") == "bottom"]
    leg = leg_class(rd)
    cols = {g.get("color_family") for g in tops + outs + bots}
    ncol = len({c for c in cols if c and c not in R.NEUTRALS and not str(c).startswith("denim")})
    lifts = {x["id"] for x in r16["v16"]["lifts"]}
    ruler = (lk or {}).get("long_top")
    long_top = (not outs and bool(tops) and tops[0].get("tucked") not in ("full", "front", "half")
                and (ruler if ruler is not None else tops[0].get("length") == "below_crotch"))
    return {
        "leg": leg,
        "shorts": leg == "shorts",
        "a color beside the neutrals": ncol >= 1,
        "two colors or more": ncol >= 2,
        "hem over the shoe (full leg)": leg in ("straight", "wide") and (lk or {}).get("covers_shoe") == "mostly",
        "open layer over a tee (L3)": "L3" in lifts,
        "one accent (L5)": "L5" in lifts,
        "one smart piece (L7b)": "L7b" in lifts,
        "exactly one lift": len(lifts) == 1,
        "no lift": not lifts,
        "two or more lifts": len(lifts) >= 2,
        "long top": bool(long_top),
        "layered": bool(outs) and bool(tops),
        "trousers or suit trousers": any(b.get("subcategory") in ("trousers", "suit_trousers") for b in bots),
        "a tailored jacket": any(o.get("subcategory") in P.TAILORED for o in outs),
    }


def main():
    runs, panel, founder, _ = H.load_gold()
    f4, rows = V.load_founder4()
    pool = V.rated_pool(runs, founder, f4, rows)
    lines = []

    def say(s=""):
        print(s)
        lines.append(s)

    D = {}
    for k, (h, grp, rd, lk) in pool.items():
        r = V.sc(rd, "everyday", {})                                   # no picks: the outfit's own look
        if r["overall"] is None:
            continue
        gs = R.scored_garments(rd)
        d = R.detect_styles(gs, {})
        D[k] = dict(his=h, v16=r["overall"], det=d["detected"], label=d["label"], f=facts(rd, lk, r), desc=H.desc(rd))
    ks = sorted(D)
    legmean = {}
    for lc in ("skinny", "slim", "straight", "wide", "shorts"):
        xs = [D[k]["his"] for k in ks if D[k]["f"]["leg"] == lc]
        if xs:
            legmean[lc] = st.mean(xs)
    allmean = st.mean(D[k]["his"] for k in ks)
    for k in ks:
        D[k]["res"] = D[k]["his"] - legmean.get(D[k]["f"]["leg"], allmean)

    say(f"His taste rules, look by look ({len(ks)} rated photos with a reading; his mean {allmean:.2f}; the look is "
        f"the outfit's own, detected with no picks)")
    say("His average by leg, all photos: " + ", ".join(f"{lc} {m:.2f} ({sum(1 for k in ks if D[k]['f']['leg'] == lc)})"
                                                   for lc, m in legmean.items()))
    say()
    say("== How the 164 read (pick-free label) ==")
    lab = Counter(D[k]["label"] or "no look" for k in ks)
    for s, n in lab.most_common():
        say(f"  {NAMES.get(s, s):14s} {n:3d}   his mean {st.mean(D[k]['his'] for k in ks if (D[k]['label'] or 'no look') == s):.2f}")
    say("== Detected sets (a photo passes every look listed; mixes are the sets with 2+) ==")
    sets = Counter(" + ".join(NAMES[s] for s in D[k]["det"]) or "no look" for k in ks)
    for s, n in sets.most_common():
        say(f"  {s:40s} {n:3d}")
    say()

    groups = {}
    for s in R.STYLE_ORDER + [None]:
        groups[f"label {NAMES.get(s, 'no look')}"] = [k for k in ks if D[k]["label"] == s]
    for s in R.STYLE_ORDER:
        groups[f"detected {NAMES[s]}"] = [k for k in ks if s in D[k]["det"]]
    groups["street-led (street/work/vintage/outdoor label)"] = [k for k in ks if D[k]["label"] in P.LOUD_NATIVE]
    groups["clean-led (minimal/prep/smart casual label)"] = [k for k in ks if D[k]["label"] in P.WR_CLEAN]
    groups["any tailored jacket or trousers (no look today)"] = [
        k for k in ks if D[k]["f"]["a tailored jacket"] or D[k]["f"]["trousers or suit trousers"]]
    groups["tailored (the T94 spec's test, by hand)"] = [k for k in ks if tailored(pool[k][2])]
    groups["all"] = ks

    say("== The leg rule: his raw average by leg shape, inside each group (n in brackets) ==")
    for g, mem in groups.items():
        if len(mem) < 5:
            continue
        cells = []
        for lc in ("skinny", "slim", "straight", "wide", "shorts"):
            xs = [D[k]["his"] for k in mem if D[k]["f"]["leg"] == lc]
            cells.append(f"{lc} {st.mean(xs):.2f} ({len(xs)})" if xs else f"{lc} - (0)")
        say(f"  {g:48s} " + "  ".join(cells))
    say()
    say("== Shorts: his raw average with shorts vs every other bottom, inside each group ==")
    for g, mem in groups.items():
        yes = [D[k]["his"] for k in mem if D[k]["f"]["shorts"]]
        no = [D[k]["his"] for k in mem if not D[k]["f"]["shorts"]]
        if yes and no:
            wide = [D[k]["his"] for k in mem if D[k]["f"]["leg"] == "wide"]
            say(f"  {g:48s} shorts {st.mean(yes):.2f} ({len(yes)})  others {st.mean(no):.2f} ({len(no)})"
                + (f"  wide legs {st.mean(wide):.2f} ({len(wide)})" if wide else ""))
    say()
    say("== One lift against none (both against his leg average) ==")
    for g, mem in groups.items():
        one = [D[k]["res"] for k in mem if D[k]["f"]["exactly one lift"]]
        zero = [D[k]["res"] for k in mem if D[k]["f"]["no lift"]]
        two = [D[k]["res"] for k in mem if D[k]["f"]["two or more lifts"]]
        if len(one) >= 3 and len(zero) >= 3:
            say(f"  {g:48s} none {st.mean(zero):+.2f} ({len(zero)})  one {st.mean(one):+.2f} ({len(one)})"
                + (f"  two+ {st.mean(two):+.2f} ({len(two)})" if len(two) >= 3 else f"  two+ ({len(two)})"))
    say()
    say("== Every other rule: his score against his own leg average, with vs without, inside each group ==")
    say("   (diff = with minus without; n = photos with the rule; '-' = under 3 with or without)")
    rules = [r for r in D[ks[0]]["f"] if r not in ("leg", "shorts", "no lift")]
    for rule in rules:
        say(f"-- {rule}")
        for g, mem in groups.items():
            yes = [D[k]["res"] for k in mem if D[k]["f"][rule]]
            no = [D[k]["res"] for k in mem if not D[k]["f"][rule]]
            if len(yes) < 1:
                continue
            if len(yes) < 3 or len(no) < 3:
                say(f"   {g:48s} n {len(yes):3d}  -")
                continue
            say(f"   {g:48s} n {len(yes):3d}  with {st.mean(yes):+.2f}  without {st.mean(no):+.2f}  "
                f"diff {st.mean(yes) - st.mean(no):+.2f}")
    say()
    say("== The photos in the clean-led and tailored groups (for reading by eye) ==")
    for k in ks:
        if D[k]["label"] in P.WR_CLEAN or D[k]["f"]["a tailored jacket"] or tailored(pool[k][2]):
            f = D[k]["f"]
            tags = [r for r in rules if f[r]]
            tl = " TAILORED" if tailored(pool[k][2]) else ""
            say(f"  {k:9s}{tl} his {D[k]['his']:g} v16 {D[k]['v16']:g}  {NAMES.get(D[k]['label'], 'no look'):12s} "
                f"leg {f['leg']}  [{'; '.join(tags)}]  {D[k]['desc'][:110]}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
