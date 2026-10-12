#!/usr/bin/env python3
"""Gold set, step 2 (DECISIONS-LOG #224): the judge panel against itself and against the app.

  /usr/bin/python3 gold_compare.py          (reads inputs/gold-judge/judge-*-b*.csv + results/gold1/scores.json)

Panel score per photo and judge: the six parts weighted fit 25, proportions 25, color 15, shoes 15, cohesion 15,
condition 5 (NA parts dropped and the rest re-weighted), rounded to the half, as in the Oct 10 pilot (#194).
The panel target is the median of the judges. The 15 hidden repeats (manifest "repeat") test each judge.
Rule 7: every photo is "profile unknown"; the app side used one stated test profile at Everyday.
"""
import csv, json, statistics
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
J = Path("/Users/eyu/Desktop/files/Kitted/inputs/gold-judge")
OUT = HERE / "results" / "gold1"
W = {"fit": 25, "proportion": 25, "color": 15, "shoes": 15, "cohesion": 15, "condition": 5}
LINES = []


def say(s=""):
    LINES.append(s); print(s)


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def half(x):
    return round(x * 2) / 2


def judge_rows():
    """{judge: {gid: row}} from every batch file."""
    out = defaultdict(dict)
    for f in sorted(J.glob("judge-*-b*.csv")):
        name = f.stem.split("-")[1]
        for r in csv.DictReader(f.open()):
            if r.get("id"):
                out[name][r["id"].strip()] = r
    return out


def parts_score(r):
    got = {k: num(r.get(k)) for k in W}
    got = {k: v for k, v in got.items() if v is not None}
    if not got:
        return None
    return sum(v * W[k] for k, v in got.items()) / sum(W[k] for k in got)


def bucket(x):
    return "≤5.5" if x <= 5.5 else "6–6.5" if x <= 6.5 else "7–7.5" if x <= 7.5 else "8–8.5" if x <= 8.5 else "9+"


def pearson(a, b):
    if len(a) < 3:
        return float("nan")
    ma, mb = statistics.mean(a), statistics.mean(b)
    num_ = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5
    return num_ / den if den else float("nan")


def main():
    man = json.loads((J / "manifest.json").read_text())
    by_gid = {m["gid"]: m for m in man}
    rows = judge_rows()
    judges = sorted(rows)
    say(f"judges: {', '.join(f'{j} ({len(rows[j])} rows)' for j in judges)}")

    # per judge, per gid: parts score (unrounded) and gut
    S = {j: {g: parts_score(r) for g, r in rows[j].items()} for j in judges}
    G = {j: {g: num(r.get("gut")) for g, r in rows[j].items()} for j in judges}

    # 1. repeats: the same photo under two ids
    say("\n## 1. Same photo twice (15 hidden repeats)")
    pairs = defaultdict(list)
    for m in man:
        pairs[m["photo"]].append(m["gid"])
    reps = [v for v in pairs.values() if len(v) == 2]
    for j in judges:
        d = [abs(S[j][a] - S[j][b]) for a, b in reps if S[j].get(a) is not None and S[j].get(b) is not None]
        if d:
            say(f"  {j:10s} {len(d)} pairs · within 0.5: {sum(x <= 0.5 for x in d)} · mean gap {statistics.mean(d):.2f} · max {max(d):.2f}")

    # 2. one score per photo per judge (repeats averaged), then the panel median
    photo_j = defaultdict(dict)
    for j in judges:
        acc = defaultdict(list)
        for g, s in S[j].items():
            if s is not None and g in by_gid:
                acc[by_gid[g]["photo"]].append(s)
        for p, v in acc.items():
            photo_j[p][j] = statistics.mean(v)
    full = {p: v for p, v in photo_j.items() if len(v) == len(judges)}
    panel = {p: half(statistics.median(v.values())) for p, v in full.items()}
    say(f"\n## 2. The panel ({len(full)} photos rated by all {len(judges)} judges)")
    for j in judges:
        xs = [half(photo_j[p][j]) for p in full]
        c = Counter(bucket(x) for x in xs)
        say(f"  {j:10s} mean {statistics.mean(xs):.2f} sd {statistics.pstdev(xs):.2f} · " + " · ".join(f"{k} {c.get(k, 0)}" for k in ("≤5.5", "6–6.5", "7–7.5", "8–8.5", "9+")))
    c = Counter(bucket(x) for x in panel.values())
    say(f"  PANEL      mean {statistics.mean(panel.values()):.2f} sd {statistics.pstdev(panel.values()):.2f} · " + " · ".join(f"{k} {c.get(k, 0)}" for k in ("≤5.5", "6–6.5", "7–7.5", "8–8.5", "9+")))
    spread = [max(v.values()) - min(v.values()) for v in full.values()]
    say(f"  judges' spread per photo: median {statistics.median(spread):.2f} · >1.0 apart on {sum(s > 1.0 for s in spread)} · >2.0 on {sum(s > 2.0 for s in spread)}")
    for i, a in enumerate(judges):
        for b in judges[i + 1:]:
            say(f"  r({a},{b}) = {pearson([full[p][a] for p in full], [full[p][b] for p in full]):.2f}")

    # 3. app vs panel
    scores = json.loads((OUT / "scores.json").read_text()) if (OUT / "scores.json").exists() else {}
    app = {p: v[0]["score"] for p, v in scores.items() if v and isinstance(v[0].get("score"), (int, float))}
    common = [p for p in panel if p in app]
    if common:
        say(f"\n## 3. The app (parts v7, run 0, test profile, Everyday) against the panel ({len(common)} photos)")
        d = [app[p] - panel[p] for p in common]
        say(f"  app − panel: mean {statistics.mean(d):+.2f} · within 0.5 on {sum(abs(x) <= 0.5 for x in d)} · off by 1.5+ on {sum(abs(x) >= 1.5 for x in d)} · r {pearson([app[p] for p in common], [panel[p] for p in common]):.2f}")
        ca = Counter(bucket(app[p]) for p in common)
        say("  app spread: " + " · ".join(f"{k} {ca.get(k, 0)}" for k in ("≤5.5", "6–6.5", "7–7.5", "8–8.5", "9+")) + f" · sd {statistics.pstdev([app[p] for p in common]):.2f}")
        for src in ("ig", "pin", "rd"):
            dd = [app[p] - panel[p] for p in common if p.startswith(src)]
            if dd:
                say(f"  {src:4s} n {len(dd)} · app − panel {statistics.mean(dd):+.2f} · panel mean {statistics.mean(panel[p] for p in common if p.startswith(src)):.2f} · app mean {statistics.mean(app[p] for p in common if p.startswith(src)):.2f}")
        # by panel band: does the app separate good from bad?
        say("  app mean by panel band:")
        for k in ("≤5.5", "6–6.5", "7–7.5", "8–8.5", "9+"):
            ps = [p for p in common if bucket(panel[p]) == k]
            if ps:
                say(f"    panel {k:6s} n {len(ps):3d} · app mean {statistics.mean(app[p] for p in ps):.2f}")
        # parts: app part vs judges' median part
        say("  parts, app vs panel median (mean app − panel):")
        pmap = {"fit": "fit", "proportions": "proportion", "color": "color", "shoes": "shoes", "cohesion": "cohesion"}
        for ap, jp in pmap.items():
            dd, aa, jj = [], [], []
            for p in common:
                a = (scores[p][0].get("parts") or {}).get(ap)
                gids = [m["gid"] for m in man if m["photo"] == p]
                vals = [num(rows[j][g].get(jp)) for j in judges for g in gids if g in rows[j]]
                vals = [v for v in vals if v is not None]
                if isinstance(a, (int, float)) and vals:
                    m_ = statistics.median(vals); dd.append(a - m_); aa.append(a); jj.append(m_)
            if dd:
                say(f"    {ap:12s} n {len(dd)} · app − panel {statistics.mean(dd):+.2f} · app sd {statistics.pstdev(aa):.2f} vs panel sd {statistics.pstdev(jj):.2f} · r {pearson(aa, jj):.2f}")
        worst = sorted(common, key=lambda p: -abs(app[p] - panel[p]))[:15]
        say("  biggest disagreements: " + ", ".join(f"{p} app {app[p]} / panel {panel[p]}" for p in worst))
        json.dump({"panel": panel, "app": app, "per_judge": photo_j}, (OUT / "compare.json").open("w"), indent=1)
    (OUT / "compare.txt").write_text("\n".join(LINES) + "\n")


if __name__ == "__main__":
    main()
