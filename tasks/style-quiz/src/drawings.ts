import { LOOKS } from '../../../app/src/features/onboarding/looks';
import { renderFlat } from '../../../app/src/features/closet/flats';
const out: Record<string, any> = {};
// Tailored (specs/tailored.md TL4): a charcoal suit with black derbies; a navy suit with white leather sneakers.
const tailored = { style: 'tailored', outfits: [
  [{ kind: 'top', type: 'blazer', color: '#3A3D44', fit: 'regular' }, { kind: 'bottom', type: 'trousers', color: '#3A3D44', fit: 'straight', hem: 'no_break' }, { kind: 'shoe', type: 'derby', color: '#1C1B1D' }],
  [{ kind: 'top', type: 'blazer', color: '#1F2A44', fit: 'regular' }, { kind: 'bottom', type: 'trousers', color: '#1F2A44', fit: 'straight', hem: 'slight_break' }, { kind: 'shoe', type: 'sneaker', color: '#F6F5F1', sole: '#F2F1EC' }],
] };
for (const l of [...LOOKS, tailored] as any[]) {
  out[l.style] = l.outfits.map((o: any, i: number) => ['light','dark'].map((sc) => o.map((p: any, j: number) => renderFlat(p, { scheme: sc as any, id: l.style.replace(/_/g,'') + i + j + sc }))));
}
console.log(JSON.stringify(out));
