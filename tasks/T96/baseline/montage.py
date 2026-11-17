import json, sys, os
from PIL import Image, ImageDraw
prep = sys.argv[1]; L = json.load(open(f'{prep}/leaks.json'))
tiles = []
for n, v in L.items():
    if 'sheet' in v['photo']: continue
    for f in sorted(os.listdir(f'{prep}/suspects')):
        if f.startswith(f'{n}-'): tiles.append((f[:-4] + ' ' + v['photo'].split('/inputs/')[-1].split('/')[0][:10], f'{prep}/suspects/{f}'))
T = 200; cols = 6; rows_per = 5; per = cols * rows_per
for page in range(0, len(tiles), per):
    sheet = Image.new('RGB', (cols * T, rows_per * (T + 16)), 'white'); d = ImageDraw.Draw(sheet)
    for i, (lab, p) in enumerate(tiles[page:page + per]):
        im = Image.open(p); im.thumbnail((T, T)); x, y = (i % cols) * T, (i // cols) * (T + 16)
        sheet.paste(im, (x, y + 16)); d.text((x + 2, y + 2), lab, fill='black')
    sheet.save(f'{prep}/sheet{page // per:02d}.jpg', quality=85)
print(len(tiles), 'tiles')
