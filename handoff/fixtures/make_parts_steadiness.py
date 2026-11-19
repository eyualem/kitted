"""Writes fixtures/parts_steadiness.json: the B6 steadiness set for parts engine v16 (T69-G5; DECISIONS-LOG #484, #487).

Every gold photo with two stored readings that both score (223): its two readings, each reading's own leg-width look
(look W, run i paired with reading i) and its own looks U and L, and Python's counts, exactly as
extraction-test/steadiness.py makes them: v16, the gold set's stated test profile, Everyday, a cool day; a photo is
steady when its two scores are within half a point. The bar is 218 with each reading's own leg look; with no looks it
is 215; with U, L and the leg look 217 (information only, #487). Garment descriptions only: no photo, no judge text,
no ratings (Q-T5).

Run (the gold readings and looks are git-ignored: KITTED_DATA = the main checkout):
    KITTED_DATA=/Users/eyu/Desktop/files/Kitted /usr/bin/python3 handoff/fixtures/make_parts_steadiness.py
"""
import sys as _sys; _sys.dont_write_bytecode = True
import hashlib, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
KEMPT = os.path.abspath(os.path.join(HERE, "../.."))
ET = os.path.join(KEMPT, "extraction-test")
sys.path.insert(0, ET)
sys.path.insert(0, os.path.join(ET, "rubrics"))
sys.path.insert(0, HERE)
import parts_proto as P  # noqa: E402
import v16_paper as V  # noqa: E402
import hoodie_layer_paper as H  # noqa: E402
import steadiness as S  # noqa: E402
import make_parts_json as MJ  # noqa: E402


def main():
    runs = H.load_gold()[0]
    leg, ul = V.load_leg_look(), V.load_looks()
    profile = [[k, w] for k, w in V.PROFILE.items()]
    photos, scores = [], {}
    counts = {"leg": 0, "none": 0, "all": 0}
    total = 0
    for p, rs in sorted(runs.items()):
        if len(rs) < 2:
            continue
        legs = [leg.get(p, {}).get(i) for i in (0, 1)]
        uls = [ul[p][i] if len(ul.get(p) or []) > i else None for i in (0, 1)]
        looks = {"leg": legs, "none": [None, None],
                 "all": [(dict(uls[i] or {}, **(legs[i] or {})) or None) for i in (0, 1)]}
        got = {k: [V.sc(rs[i], "everyday", V.PROFILE, v[i])["overall"] for i in (0, 1)] for k, v in looks.items()}
        if any(x is None for x in got["leg"]) or any(x is None for x in got["none"]):
            continue
        total += 1
        for k in counts:
            counts[k] += abs(got[k][0] - got[k][1]) <= 0.5
        scores[p] = got["leg"]
        photos.append({"id": p, "readings": [rs[0], rs[1]], "leg": legs, "ul": uls})
    # the same numbers steadiness.py prints (and T68 / #487 recorded)
    for mode, key in (("leg", "leg"), ("none", "none"), ("all", "all")):
        steady, tot, _ = S.steadiness(looks=mode)
        assert (steady, tot) == (counts[key], total), (mode, steady, tot, counts[key], total)
    assert (total, counts["leg"], counts["none"], counts["all"]) == (223, 218, 215, 217), (total, counts)
    base = MJ.data()
    out = {
        "about": "B6 steadiness (T69-G5): the gold photos' two stored readings with each reading's own leg-width look (W) and "
                 "looks U and L; Python's v16 scores and counts (steadiness.py). Written by handoff/fixtures/"
                 "make_parts_steadiness.py from parts_proto.py; read by app/packages/kitted-core/test/v16Steadiness.test.ts. "
                 "Garment descriptions only. Never edit by hand.",
        "parts_version": base["version"], "parts_proto_sha256": base["sourceSha256"],
        "profile": profile, "occasion": "everyday", "boldness": "a_little", "season": None,
        "photos": photos,
        "python": {"steady_leg": counts["leg"], "steady_none": counts["none"], "steady_all": counts["all"], "total": total,
                   "scores_leg": scores},
    }
    path = os.path.join(HERE, "parts_steadiness.json")
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    print(json.dumps(out["python"]["total"]), counts, "MB", round(os.path.getsize(path) / 1e6, 2))


if __name__ == "__main__":
    main()
