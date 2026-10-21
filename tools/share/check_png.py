#!/usr/bin/env python3
"""Checks a saved share-card image (handoff/14-share-card.md §5, checks M1–M4). Standard library only.

usage: check_png.py <kind> <file.png>     kind: sticker | solid-dark | solid-light | photo

Reads the PNG itself (8- or 16-bit RGB or RGBA, any filter, no interlace; 16-bit is read by its high byte), so it judges exactly what Photos holds.
  M1  size: sticker and solid 1080 × 600, photo 1080 × 1920
  M2  sticker: has alpha; every grid point outside the overlay's box is alpha 0; some pixels are near-opaque white
  M3  solid: the 4 corners alpha 0; the ground (sampled away from the overlay) is #121628 / #F3F4F6 ±2, alpha 255
  M4  photo: every sampled pixel alpha 255
Prints one line per check and exits 1 on any failure.
"""
import struct
import sys
import zlib

SIZES = {'sticker': (1080, 600), 'solid-dark': (1080, 600), 'solid-light': (1080, 600), 'photo': (1080, 1920)}
GROUND = {'solid-dark': (0x12, 0x16, 0x28), 'solid-light': (0xF3, 0xF4, 0xF6)}


def read_png(path):
    data = open(path, 'rb').read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise SystemExit(f'{path}: not a PNG')
    pos, idat, w = 8, b'', None
    while pos < len(data):
        n, = struct.unpack('>I', data[pos:pos + 4])
        kind = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + n]
        if kind == b'IHDR':
            w, h, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', body)
            if depth not in (8, 16) or ctype not in (2, 6) or interlace:
                raise SystemExit(f'{path}: unsupported PNG (depth {depth}, color type {ctype}, interlace {interlace})')
        elif kind == b'IDAT':
            idat += body
        pos += 12 + n
    chans = 4 if ctype == 6 else 3
    bpc = depth // 8
    bpp = chans * bpc
    raw = zlib.decompress(idat)
    stride = w * bpp
    rows, prev = [], bytearray(stride)
    for y in range(h):
        f = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            b = prev[i]
            c = prev[i - bpp] if i >= bpp else 0
            if f == 1:
                line[i] = (line[i] + a) & 255
            elif f == 2:
                line[i] = (line[i] + b) & 255
            elif f == 3:
                line[i] = (line[i] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[i] = (line[i] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(bytes(line))
        prev = line
    def px(x, y):
        r = rows[y]
        o = x * bpp
        v = [r[o + c * bpc] for c in range(chans)]
        return (v[0], v[1], v[2], v[3] if chans == 4 else 255)
    return w, h, chans == 4, depth, px


def main():
    kind, path = sys.argv[1], sys.argv[2]
    w, h, alpha, depth, px = read_png(path)
    ok = True
    print(f'info: {depth}-bit, {"RGBA" if alpha else "RGB"}')

    def say(name, good, detail):
        nonlocal ok
        ok = ok and good
        print(f'{"PASS" if good else "FAIL"} {name}: {detail}')

    want = SIZES[kind]
    say('M1 size', (w, h) == want, f'{w} × {h} (want {want[0]} × {want[1]})')
    if kind == 'sticker':
        say('M2 alpha channel', alpha, 'RGBA' if alpha else 'no alpha channel')
        # The overlay sits in the middle (stats, tape, wordmark): about x 10–90%, y 15–85% of the image.
        outside = [(x, y) for y in range(0, h, 20) for x in range(0, w, 20)
                   if not (0.10 * w < x < 0.90 * w and 0.15 * h < y < 0.85 * h)]
        opaque = [p for p in outside if px(*p)[3] != 0]
        say('M2 clear outside the overlay', not opaque, f'{len(opaque)} of {len(outside)} grid points not clear')
        inner = [px(x, y) for y in range(int(0.22 * h), int(0.78 * h), 3) for x in range(int(0.15 * w), int(0.85 * w), 3)]
        ink = [p for p in inner if p[3] > 230 and min(p[:3]) > 220]
        say('M2 the white overlay is there', len(ink) > 200, f'{len(ink)} near-opaque white samples')
    elif kind.startswith('solid'):
        corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)]
        say('M3 corners clear', all(c[3] == 0 for c in corners), f'corner alphas {[c[3] for c in corners]}')
        g = GROUND[kind]
        spots = [(int(w * 0.08), int(h * 0.5)), (int(w * 0.92), int(h * 0.5)), (int(w * 0.5), int(h * 0.1)), (int(w * 0.5), int(h * 0.9))]
        bad = [(s, px(*s)) for s in spots if px(*s)[3] != 255 or any(abs(px(*s)[i] - g[i]) > 2 for i in range(3))]
        say('M3 solid ground', not bad, 'ok' if not bad else f'off at {bad}')
    else:
        samples = [px(x, y) for y in range(0, h, 24) for x in range(0, w, 24)]
        clear = [p for p in samples if p[3] != 255]
        say('M4 opaque', not clear, f'{len(clear)} of {len(samples)} samples not opaque')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
