"""Port check: extraction-test/rubric.py (v4.0, live) must equal rubric_v4_proto.score(..., F=BEFORE_BETA) and
rubric_v4_proto.ask_question(..., F=BEFORE_BETA) on every reading we have, under every occasion key, several style
mixes (none, new keys, old onboarding keys) and every boldness level.

Run:  /usr/bin/python3 /Users/eyu/Desktop/files/Kitted/rubric/research/style-council/check_port.py
Compares: overall, raw (unrounded, to 1e-9), every v3.1 output key (rules_fired, credits, advice, subscores, ...),
the detected styles and the card label, and the whole ask_question() result. Exit code 1 on any mismatch.

Readings: every extraction-test/results/**/raw_results.json, the demo readings + variants, cases.json,
phone-checks-oct7.json and the readings in handoff/fixtures/rubric_parity.json (incl. the edge and fuzz sets).
Phase-2 markers (reading["schema"] == "v4") are dropped first: v4.0 scores today's reading format only.
"""
import sys as _sys; _sys.dont_write_bytecode = True
import copy, glob, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "extraction-test"))
import rubric as LIVE            # noqa: E402
import rubric_v4_proto as PROTO  # noqa: E402

# capture the unrounded raw score: the first round() call in score() is round(raw, 3) in both files
_cap = []
_round = round


def _capturing(x, n=None):
    _cap.append(x)
    return _round(x, n) if n is not None else _round(x)


LIVE.round = _capturing
PROTO.round = _capturing

OCCASIONS = list(LIVE.OCCASION_TARGET) + ["brunch"]          # + an unknown key
STYLE_MIXES = [None, {}, {"streetwear": 1.0}, {"minimalist": 0.5, "smart_casual": 0.5}, {"preppy": 1.0},
               {"old_money": 0.5, "gorpcore": 0.5}, {"workwear": 0.5, "vintage_sport": 0.3, "classic_prep": 0.2},
               {"outdoor": 1.0, "streetwear": 1.0, "minimalist": 1.0}]
BOLD = ["a_little", "bold", "subtle"]
V31_KEYS = ("overall", "reason", "partial", "rules_fired", "raw_score", "subscores", "occasion_adj", "credits",
            "credit_points", "mistake_points", "advice", "not_rated")


def canon(r):
    return json.dumps({"scene": r.get("scene"), "garments": r.get("garments")}, sort_keys=True)


def readings():
    out, seen = [], set()

    def put(r, src):
        if not isinstance(r, dict) or "garments" not in r:
            return
        r = {k: v for k, v in r.items() if k != "schema"}
        k = canon(r)
        if k not in seen:
            seen.add(k); out.append((src, r))
    for f in sorted(glob.glob(os.path.join(ROOT, "extraction-test/results/**/raw_results.json"), recursive=True)):
        try:
            data = json.load(open(f))
        except (ValueError, OSError):
            continue                     # a run still writing its file
        for x in data:
            if x.get("extraction"):
                put(x["extraction"], os.path.relpath(f, ROOT))
    fx = os.path.join(ROOT, "handoff/fixtures")
    for p in sorted(glob.glob(os.path.join(fx, "readings/*.json")) + glob.glob(os.path.join(fx, "readings/variants/*.json"))):
        if not p.endswith("INDEX.json"):
            put(json.load(open(p)), "demo")
    for c in json.load(open(os.path.join(HERE, "cases.json"))):
        put(c["reading"], "cases.json")
    for c in json.load(open(os.path.join(HERE, "phone-checks-oct7.json"))):
        put(c["reading"], "phone-checks")
    pp = os.path.join(fx, "rubric_parity.json")
    if os.path.exists(pp):
        for r in json.load(open(pp))["readings"].values():
            put(r, "parity fixture")
    return out


def run(mod, r, occ, st, bold, **kw):
    _cap.clear()
    if mod is PROTO:
        s = PROTO.score(copy.deepcopy(r), occ, None if st is None else dict(st), bold, F=PROTO.BEFORE_BETA)
    else:
        s = LIVE.score(copy.deepcopy(r), occ, None if st is None else dict(st), bold)
    raw = _cap[0] if s.get("overall") is not None else None
    return s, raw


def main():
    rs = readings()
    n = bad = asks = ask_bad = asked = 0
    fails = []
    by_src = {}
    for src, r in rs:
        by_src[src.split("/")[0] if "/" in src else src] = by_src.get(src.split("/")[0] if "/" in src else src, 0) + 1
        for occ in OCCASIONS:
            for st in STYLE_MIXES:
                for bold in BOLD:
                    a, ra = run(LIVE, r, occ, st, bold)
                    b, rb = run(PROTO, r, occ, st, bold)
                    n += 1
                    diff = [k for k in V31_KEYS if a.get(k) != b.get(k)]
                    if (ra is None) != (rb is None) or (ra is not None and abs(ra - rb) > 1e-9):
                        diff.append("raw")
                    if a.get("overall") is not None:
                        if a.get("detected_styles") != [s for s in LIVE.STYLE_ORDER if s in set(b.get("detected", []))]:
                            diff.append("detected")
                        if a.get("style_label") != b.get("label"):
                            diff.append("label")
                    if diff:
                        bad += 1
                        if len(fails) < 20:
                            fails.append((src, occ, st, bold, diff, {k: (a.get(k), b.get(k)) for k in diff if k not in ("raw", "detected", "label")}))
                # the tap: boldness never enters ask_question in the prototype (it scores at a_little)
                qa = LIVE.ask_question(copy.deepcopy(r), occ, None if st is None else dict(st))
                qb = PROTO.ask_question(copy.deepcopy(r), occ, None if st is None else dict(st), F=PROTO.BEFORE_BETA)
                asks += 1
                asked += qa is not None
                if qa != qb:
                    ask_bad += 1
                    if len(fails) < 20:
                        fails.append((src, occ, st, "ask", qa, qb))
    print(f"readings: {len(rs)} unique ({json.dumps(by_src)})")
    print(f"score():        {n - bad}/{n} identical (overall, raw to 1e-9, every v3.1 key, detected styles, label)")
    print(f"ask_question(): {asks - ask_bad}/{asks} identical ({asked} asked)")
    for f in fails:
        print("  FAIL", f)
    if bad or ask_bad:
        sys.exit(1)
    print("PORT CHECK PASSED (100%)")


if __name__ == "__main__":
    main()
