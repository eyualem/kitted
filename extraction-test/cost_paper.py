#!/usr/bin/env python3
"""The cost of one fit check, on paper (Nov 12, 2026; DECISIONS-LOG #455, market/ai-costs.md §7). No API calls.

  /usr/bin/python3 cost_paper.py [live-calls.json]

Three free measurements:
  1. The second look on today's engine: every saved phone check with a stored second look (the founder's profile and
     occasion, rule 7) and batch 1's 50 photos x 3 runs with look1's U and L answers for the same runs (the founder's
     photos with his profile, the rest "profile unknown" with the gold set's stated test profile), each scored with and
     without the look. Counts the shown scores that move.
  2. What the scoring read's 764 output tokens are made of (gold1's 450 answers): key names, "na" fields, per field.
  3. Optional: the live server's own call log (export it with
       gcloud logging read 'jsonPayload.route="read" OR jsonPayload.route="look" OR jsonPayload.route="closet"' \\
         --project kitted-a5b45 --freshness=60d --limit 2000 --format=json > live-calls.json
     ). Groups calls into checks (a gap over 25 s starts a new one) and counts the reads per check, the thinking tokens
     on each route and the cents per check. Uids are never printed.

Data (git-ignored) is read from KITTED_DATA (default: this checkout): results/gold1, b1, look1 and screenshots/phone.
"""
import csv
import json
import os
import statistics as st
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("KITTED_DATA", HERE.parent))
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "rubrics"))
import hoodie_layer_paper as H  # noqa: E402  (its loaders read KITTED_DATA too)
import parts_proto as P  # noqa: E402

RES = DATA / "extraction-test/results"


def checks_of(r):
    return {x["check"] for v in (r.get("parts") or {}).values() for x in v["reasons"]}


def score(rd, occ, styles, sl):
    return P.score_parts(rd, occ or "everyday", dict(styles), sl, "a_little")     # today's default engine


def load_runs(path, arm):
    by = defaultdict(list)
    for x in json.load(open(path)):
        if x.get("arm") == arm and x.get("json"):
            by[x["photo"]].append(x)
    return {p: [x["json"] for x in sorted(v, key=lambda x: x["run"])] for p, v in by.items()}


def second_look():
    print("== 1. The second look on today's engine ==")
    ph = H.load_phone()
    n = moved = 0
    deltas, why = Counter(), Counter()
    for c in ph.values():
        if not c["sl"]:
            continue
        a, b = score(c["reading"], c["occ"], H.FOUNDER, c["sl"]), score(c["reading"], c["occ"], H.FOUNDER, None)
        n += 1
        if a["overall"] != b["overall"]:
            moved += 1
            deltas[round(a["overall"] - b["overall"], 2)] += 1
            why.update(checks_of(a) ^ checks_of(b))
    print(f"  his phone checks: {len(ph)} scored, {n} with a stored look; shown score moves on {moved} of {n} "
          f"{dict(deltas)} {dict(why)}")
    B1 = load_runs(RES / "b1/raw.json", "A")
    U, L = load_runs(RES / "look1/raw.json", "U"), load_runs(RES / "look1/raw.json", "L")
    person = {r["photo"]: r["person"] for r in csv.DictReader(open(HERE / "b1_labels.csv"))}
    n = moved = 0
    deltas, why, photos = Counter(), Counter(), set()
    for p, rs in B1.items():
        if p not in U or p not in L:
            continue
        styles = H.FOUNDER if person.get(p) == "founder" else H.PROFILE
        for i, rd in enumerate(rs[:min(len(U[p]), len(L[p]))]):
            sl = {"under_present": U[p][i].get("under_present"), "under_shows": U[p][i].get("under_shows"),
                  "covers_shoe": L[p][i].get("covers_shoe")}
            a, b = score(rd, "everyday", styles, sl), score(rd, "everyday", styles, None)
            n += 1
            if a["overall"] != b["overall"]:
                moved += 1
                photos.add(p)
                deltas[round(a["overall"] - b["overall"], 2)] += 1
                why.update(checks_of(a) ^ checks_of(b))
    print(f"  batch 1 + look1: {len(B1)} photos, {n} photo-runs; shown score moves on {moved} "
          f"({len(photos)} photos) {dict(deltas)} {dict(why)}")


def output_tokens():
    print("\n== 2. The scoring read's output (gold1) ==")
    rows = [x for x in json.load(open(RES / "gold1/raw.json")) if x.get("json") and x.get("usage")]
    u = [x["usage"] for x in rows]
    img = [sum(p["tokenCount"] for p in x.get("promptTokensDetails", []) if p["modality"] == "IMAGE") for x in u]
    txt = [sum(p["tokenCount"] for p in x.get("promptTokensDetails", []) if p["modality"] == "TEXT") for x in u]
    print(f"  {len(rows)} answers · in {st.median(x['promptTokenCount'] for x in u):.0f} (text {st.median(txt):.0f}, "
          f"images {st.median(img):.0f} for 3) · out {st.median(x['candidatesTokenCount'] for x in u):.0f} · "
          f"{st.mean(len(x['json']['garments']) for x in rows):.1f} garments")
    compact = lambda j: len(json.dumps(j, separators=(",", ":")))  # noqa: E731
    total = sum(compact(x["json"]) for x in rows)
    keys = sum(len(k) + 3 for x in rows for g in x["json"]["garments"] for k in g)
    na = sum(len(json.dumps({k: v}, separators=(",", ":"))) - 1 for x in rows for g in x["json"]["garments"]
             for k, v in g.items() if v == "na")

    def short(j, drop_na):
        return compact({"s": {k[:2]: v for k, v in j["scene"].items()},
                        "g": [{k[:2]: v for k, v in g.items() if not (drop_na and v == "na")} for g in j["garments"]]})
    print(f"  {total / sum(x['candidatesTokenCount'] for x in u):.2f} characters a token · key names "
          f"{keys / total:.0%} of the characters · 'na' fields {na / total:.0%}")
    print(f"  two-letter keys: {sum(short(x['json'], False) for x in rows) / total:.0%} of the characters; "
          f"two-letter keys and no 'na' fields: {sum(short(x['json'], True) for x in rows) / total:.0%}")


def live(path):
    print("\n== 3. The live server's calls ==")
    d = json.load(open(path))
    rows = [{**x["jsonPayload"], "t": x["timestamp"]} for x in d if (x.get("jsonPayload") or {}).get("outcome") == "ok"]
    for r in rows:
        r["s"] = datetime.fromisoformat(r["t"].replace("Z", "+00:00")).timestamp() - (r.get("ms") or 0) / 1000
    rows.sort(key=lambda r: (r.get("uid"), r["s"]))
    print(f"  {len(rows)} finished calls, {rows and min(r['t'] for r in rows)[:10]} to {rows and max(r['t'] for r in rows)[:10]}")
    for route in ("read", "look", "closet"):
        rr = [r for r in rows if r["route"] == route]
        if rr:
            th = [r.get("thinking") or 0 for r in rr]
            print(f"  {route:6s} {len(rr):3d} calls · in {st.median(r.get('tokensIn') or 0 for r in rr):.0f} · out "
                  f"{st.median(r.get('tokensOut') or 0 for r in rr):.0f} · thinking on {sum(t > 0 for t in th)} "
                  f"(median {st.median(th):.0f}) · {st.mean(r['cents'] for r in rr):.3f}¢ a call")
    groups, cur = [], []
    for r in rows:
        if cur and (r.get("uid") != cur[-1].get("uid") or r["s"] - cur[-1]["s"] > 25):
            groups.append(cur)
            cur = []
        cur.append(r)
    if cur:
        groups.append(cur)
    checks = [g for g in groups if any(r["route"] == "read" for r in g)]
    reads = Counter(sum(r["route"] == "read" for r in g) for g in checks)
    same = sum(1 for g in checks if len({r.get("tokensIn") for r in g if r["route"] == "read"}) == 1
               and sum(r["route"] == "read" for r in g) > 1)
    cents = [sum(r["cents"] for r in g) for g in checks]
    print(f"  {len(checks)} checks · reads per check {dict(sorted(reads.items()))} · {same} with every read the same "
          f"photo (same tokens in) · {st.mean(cents):.2f}¢ a check (median {st.median(cents):.2f}¢)")


if __name__ == "__main__":
    second_look()
    output_tokens()
    if len(sys.argv) > 1:
        live(sys.argv[1])
