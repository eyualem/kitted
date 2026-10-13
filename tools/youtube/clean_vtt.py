"""Turn yt-dlp auto-caption VTTs into plain transcripts.

Usage: /usr/bin/python3 tools/youtube/clean_vtt.py inputs/youtube
Writes <dir>/clean/<id>.txt (a [mm:ss] stamp about every 30 s) and
<dir>/clean/index.tsv (id, words, minutes, title).
"""
import re
import sys
from pathlib import Path

CUE = re.compile(r"^(\d\d):(\d\d):(\d\d)\.\d+ --> ")
TAG = re.compile(r"<[^>]+>")
NAME = re.compile(r"^(.*) \[([A-Za-z0-9_-]{11})\]\.(en|en-orig)\.vtt$")


def cues(path):
    """Yield (seconds, new_text) per cue, dropping the rolling repeats."""
    start, lines = None, []
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines() + [""]:
        m = CUE.match(raw)
        if m:
            start = int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3])
            lines = []
        elif raw == "" and start is not None:
            yield start, lines
            start, lines = None, []
        elif start is not None:
            lines.append(raw)


def transcript(path):
    out, prev = [], ""
    word_tagged = "<c>" in path.read_text(encoding="utf-8", errors="replace")
    for t, lines in cues(path):
        if word_tagged:
            # Auto-captions: only the line carrying word timings is new text.
            new = [TAG.sub("", l).strip() for l in lines if "<c>" in l or re.search(r"<\d\d:", l)]
        else:
            new = [TAG.sub("", l).strip() for l in lines]
            new = [l for l in new if l and l != prev]
        for l in new:
            l = re.sub(r"\s+", " ", l).strip()
            if l and l != prev:
                out.append((t, l))
                prev = l
    return out


def main(root):
    root = Path(root)
    clean = root / "clean"
    clean.mkdir(exist_ok=True)
    videos = {}
    for p in sorted(root.glob("*.vtt")):
        m = NAME.match(p.name)
        if not m:
            print("skip", p.name)
            continue
        title, vid, kind = m[1], m[2], m[3]
        if kind == "en" or vid not in videos:
            videos[vid] = (title, p)
    rows = []
    for vid, (title, p) in sorted(videos.items(), key=lambda kv: kv[1][0].lower()):
        parts, last_stamp, words, end = [], -999, 0, 0
        for t, line in transcript(p):
            if t - last_stamp >= 30:
                parts.append(f"\n[{t // 60:02d}:{t % 60:02d}] ")
                last_stamp = t
            parts.append(line + " ")
            words += len(line.split())
            end = t
        body = f"# {title}\n# id {vid} · {words} words · {end // 60} min\n" + "".join(parts).replace(" \n", "\n").strip() + "\n"
        (clean / f"{vid}.txt").write_text(body, encoding="utf-8")
        rows.append(f"{vid}\t{words}\t{end // 60}\t{title}")
    (clean / "index.tsv").write_text("id\twords\tminutes\ttitle\n" + "\n".join(rows) + "\n", encoding="utf-8")
    print(f"{len(rows)} videos -> {clean}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "inputs/youtube")
