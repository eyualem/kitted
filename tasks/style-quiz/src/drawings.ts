import { LOOKS } from '../../../app/src/features/onboarding/looks';
import { renderFlat } from '../../../app/src/features/closet/flats';
const out: Record<string, any> = {};
// Tailored (specs/tailored.md TL4): a charcoal suit with black derbies; a navy suit with white leather sneakers.
const tailored = { style: 'tailored', outfits: [
  [{ kind: 'top', type: 'blazer', color: '#3A3D44', fit: 'regular' }, { kind: 'bottom', type: 'trousers', color: '#3A3D44', fit: 'straight', hem: 'no_break' }, { kind: 'shoe', type: 'derby', color: '#1C1B1D' }],
  [{ kind: 'top', type: 'blazer', color: '#1F2A44', fit: 'regular' }, { kind: 'bottom', type: 'trousers', color: '#1F2A44', fit: 'straight', hem: 'slight_break' }, { kind: 'shoe', type: 'sneaker', color: '#F6F5F1', sole: '#F2F1EC' }],
] };
// Mockup-only changes so each look reads as itself and none is much louder than the rest (style-game-fair, Nov 17;
// the app's looks.ts is unchanged; these are recommended for it in the DECISIONS-LOG entry). [look, outfit, piece, change]
const FAIR: [string, number, number, Record<string, any>][] = [
  // Streetwear's 2nd outfit: bright red chunky sneakers were the loudest piece in the ranking; black ones keep the
  // chunky shape that makes it streetwear.
  ['streetwear', 1, 2, { color: '#26272B', sole: '#F2F1EC', laceColor: '#F2F1EC' }],
  // Outdoor's card: a plain olive zip jacket read as a field jacket (workwear's) or a bomber; a slate-blue shell reads
  // as outdoor gear ([OUT-1]: a shell, rain jacket or fleece) without being loud.
  ['outdoor', 0, 0, { color: '#3D5A73' }],
  // Outdoor's 2nd outfit: a plain cream crew sweater was outdoor in nothing; a heather zip pullover reads as a fleece.
  ['outdoor', 1, 0, { type: 'quarter_zip', details: { ribHem: false } }],
];
const looks = [...LOOKS, tailored].map((l: any) => ({ ...l, outfits: l.outfits.map((o: any) => o.map((p: any) => ({ ...p }))) }));
for (const [style, o, p, change] of FAIR) {
  const piece = looks.find((l: any) => l.style === style)!.outfits[o][p];
  Object.assign(piece, change);
}
for (const l of looks as any[]) {
  out[l.style] = l.outfits.map((o: any, i: number) => ['light','dark'].map((sc) => o.map((p: any, j: number) => renderFlat(p, { scheme: sc as any, id: l.style.replace(/_/g,'') + i + j + sc }))));
}
console.log(JSON.stringify(out));
