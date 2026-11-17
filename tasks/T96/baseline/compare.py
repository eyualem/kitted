# compare.py <prepdir> <oracle.jsonl> <all.txt>: for each sent copy, every face the thorough hunt found in the original
# that is still visible (barely changed) in the sent copy. Prints one line per photo with suspected leaks; writes
# <prepdir>/leaks.json and crops of each suspect to <prepdir>/suspects/.
import sys, json, os
import numpy as np
from PIL import Image, ImageOps
prep, orc, allf = sys.argv[1:4]
photos = [l.rstrip('\n') for l in open(allf)]
oracle = {}
for l in open(orc):
    try: o = json.loads(l)
    except Exception: continue
    oracle[o['photo']] = o
def iou(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1]); x1, y1 = min(a[0]+a[2], b[0]+b[2]), min(a[1]+a[3], b[1]+b[3])
    i = max(0, x1-x0) * max(0, y1-y0); return i / (a[2]*a[3] + b[2]*b[3] - i + 1e-9)
os.makedirs(f'{prep}/suspects', exist_ok=True)
rows = [json.loads(l) for l in open(f'{prep}/prep.jsonl')]
out = {}; stats = {}
for r in rows:
    stats[r['status']] = stats.get(r['status'], 0) + 1
    if r['status'] != 'ok': continue
    o = oracle.get(r['photo'])
    if not o or 'faces' not in o: continue
    W, H = o['size']
    sent = np.asarray(Image.open(f"{prep}/sent/{r['n']}.jpg").convert('L'), dtype=np.float32)
    sh, sw = sent.shape
    orig = ImageOps.exif_transpose(Image.open(r['photo'])).convert('L').resize((sw, sh), Image.LANCZOS)
    orig = np.asarray(orig, dtype=np.float32)
    s = sw / W
    faces = sorted(o['faces'], key=lambda f: -f[4])
    uniq = []
    for f in faces:
        if f[4] < 0.5: continue
        if all(iou(f, u) < 0.3 for u in uniq): uniq.append(f)
    sus = []
    for k, f in enumerate(uniq):
        x0, y0 = int(f[0]*s), int(f[1]*s); x1, y1 = int((f[0]+f[2])*s)+1, int((f[1]+f[3])*s)+1
        x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(sw, x1), min(sh, y1)
        if x1 - x0 < 3 or y1 - y0 < 3: continue
        a, b = orig[y0:y1, x0:x1], sent[y0:y1, x0:x1]
        diff = float(np.mean(np.abs(a - b)))
        # share of the box that's untouched (pixel diff under 12)
        same = float(np.mean(np.abs(a - b) < 12))
        if same > 0.5:
            sus.append({'box': [round(v) for v in f[:4]], 'conf': round(f[4], 2), 'tile': f[5], 'same': round(same, 2), 'px': [x1-x0, y1-y0]})
            pad = max(x1-x0, y1-y0)
            Image.open(f"{prep}/sent/{r['n']}.jpg").crop((max(0, x0-pad), max(0, y0-pad), min(sw, x1+pad), min(sh, y1+pad))).resize((max(1,(min(sw,x1+pad)-max(0,x0-pad))*3), max(1,(min(sh,y1+pad)-max(0,y0-pad))*3))).save(f"{prep}/suspects/{r['n']}-{k}.png")
    if sus:
        out[r['n']] = {'photo': r['photo'], 'suspects': sus}
        print(r['n'], r['photo'].split('Kitted/')[1], [(x['conf'], x['same'], x['px']) for x in sus])
json.dump(out, open(f'{prep}/leaks.json', 'w'), indent=1)
print('statuses', stats, 'photos with suspects', len(out))
