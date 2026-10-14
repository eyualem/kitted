#!/usr/bin/env python3
"""Review the founder's real fit checks from a phone pull: what the AI read, and how each part was scored.

  /usr/bin/python3 tools/phone/review.py screenshots/phone/<pull> [--since 2026-10-14]

Re-scores each stored reading with the live parts engine (extraction-test/rubrics/parts_proto.py, the Python twin of the
app's @kitted/core, in exact parity) with his stored occasion and second look, and writes <pull>/review.md and
<pull>/review.html (photos inline; git-ignored like the rest of screenshots/). Internal only.
"""
import argparse, base64, json, sqlite3, subprocess, sys, tempfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "extraction-test" / "rubrics")); sys.path.insert(0, str(ROOT / "extraction-test"))
import parts_proto as P  # noqa: E402


def piece(g):
    bits = [g.get("color_family"), g.get("subcategory")]
    for k, label in (("pattern", "pattern"), ("volume", "roominess"), ("leg_shape", "leg"), ("hem", "hem"),
                     ("tucked", "tucked"), ("top_length", "ends"), ("saturation", "sat"), ("logo_size", "logo")):
        v = g.get(k)
        if v not in (None, "", "na", "solid", False, "none"):
            bits.append(f"{label} {v}")
    if g.get("confidence") not in (None, "clear"):
        bits.append(f"({g.get('confidence')})")
    return " · ".join(str(b) for b in bits if b)


def lines_of(part):
    out = []
    for r in (part or {}).get("reasons") or []:
        pts = r.get("points")
        out.append(f"{'+' if pts and pts > 0 else ''}{pts:g} {r.get('line')}" if isinstance(pts, (int, float)) else str(r.get("line")))
    for tip in (part or {}).get("tips") or []:
        out.append(f"tip: {tip.get('line') if isinstance(tip, dict) else tip}")
    return out


def thumb(path):
    if not path.exists():
        return ""
    tmp = Path(tempfile.mkdtemp()) / "t.jpg"
    subprocess.run(["sips", "-Z", "520", "-s", "format", "jpeg", str(path), "--out", str(tmp)], capture_output=True)
    return base64.b64encode(tmp.read_bytes()).decode() if tmp.exists() else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pull")
    ap.add_argument("--since", default=None, help="local date, e.g. 2026-10-14")
    a = ap.parse_args()
    pull = Path(a.pull)
    db = next(pull.rglob("kitted.db"))
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    since = int(datetime.fromisoformat(a.since).timestamp() * 1000) if a.since else 0
    rows = con.execute("select * from fit_checks where status = 'scored' and created_at >= ? and photo_file is not null order by created_at", (since,)).fetchall()
    md, html = [f"# Fit checks from {pull.name} ({len(rows)})\n", "Profile: his birth year and picks are still pending (rule 7), so picks don't move a score anyway.\n"], []
    for row in rows:
        rd = con.execute("select reading_json from readings where id = ?", (row["reading_id"],)).fetchone()
        if not rd:
            continue
        reading = json.loads(rd["reading_json"])
        details = json.loads(row["details"] or "{}")
        sl = details.get("secondLook")
        try:
            s = P.score_parts(reading, row["occasion"], None, sl if isinstance(sl, dict) else None)
        except Exception as e:  # noqa: BLE001
            s = {"overall": None, "error": repr(e)}
        when = datetime.fromtimestamp(row["created_at"] / 1000).strftime("%b %d %H:%M")
        kind = "re-check" if row["parent_id"] else "check"
        head = f"## {when} · {kind} · {row['occasion']} · app {row['score']} · engine now {s.get('overall')} · reads as {', '.join(s.get('detected_styles') or []) or 'no clear style'}"
        body = ["**Read:** " + "; ".join(piece(g) for g in reading.get("garments") or [])]
        for name, part in (s.get("parts") or {}).items():
            if not part:
                continue
            ls = lines_of(part)
            body.append(f"- **{name} {part.get('display')}**" + (": " + " · ".join(ls) if ls else ""))
        for k in ("condition", "occasion"):
            v = s.get(k)
            if v:
                body.append(f"- {k}: {json.dumps(v)[:300]}")
        md += [head, *body, ""]
        img = thumb(pull / "photos" / Path(row["photo_file"]).name) or thumb(next(pull.rglob(Path(row["photo_file"]).name), Path("/nonexistent")))
        html.append(f"<section><img src='data:image/jpeg;base64,{img}'><div><h2>{head[3:]}</h2>" + "".join(f"<p>{b}</p>" for b in body) + "</div></section>")
    (pull / "review.md").write_text("\n".join(md))
    (pull / "review.html").write_text("<!doctype html><meta charset=utf-8><title>Fit check review</title><style>body{font:14px -apple-system,sans-serif;margin:16px;background:#f5f3ef;color:#222}section{display:flex;gap:16px;margin:0 0 24px;align-items:flex-start}img{width:260px;border-radius:8px;flex:none}h2{font-size:15px;margin:0 0 6px}p{margin:3px 0}@media(prefers-color-scheme:dark){body{background:#151515;color:#eee}}</style>" + "".join(html))
    print(f"{len(rows)} checks → {pull / 'review.md'}")


if __name__ == "__main__":
    main()
