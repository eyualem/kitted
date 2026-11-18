# T101 · Pieces drawn without a closet row, and a watch, belt, cap and beanie

**From:** `plan.md` → T101 · **Spec:** `specs/kit-stylist-chat.md` (approved 2026-11-17) → KC9.1, KC9.2, KC9.3, and KC2.2 (the drawing only) · **Drawn in:** `mockups/kit-stylist-chat.html` §7 and §8 (the accessory stand-ins there are rough, viewBox 100; the real ones are drawn in `flats.ts`'s 200 × 200 style) · **Size:** normal · **Lane:** Kit's stylist chat, borrowing Closet's `closet/{flats,artSpec}.ts` and `closet/GarmentArt.tsx`

## Goal
After this, a piece Kit suggests but he doesn't own can be drawn from three plain facts (a kind, a color family, a name) with no closet row, and a watch, a belt, a cap and a beanie draw as real pieces, in light and dark, in any of the 25 colors. A watch can show a gold, silver or black metal. T102 stores the drawn-piece shape on cards and T104 draws it; Closet draws the same four accessories for a piece added from chat (T106 writes the row).

## Files
Only these three. Nothing else under `app/src/features/closet/`, and nothing in `ask/` (T102), `app/packages/kitted-core` (T103), `stylist/cards/`, `demo/` or `i18n/` (T104).
- `app/src/features/closet/flats.ts`: a fourth flat, `AccessoryFlat`, four drawings, the metal tones. Existing drawings stay byte-for-byte identical.
- `app/src/features/closet/artSpec.ts`: the accessory shape, the drawn-piece shape and its helpers.
- `app/src/features/closet/GarmentArt.tsx`: `PieceArt` also takes a drawn piece.

Tests (the builder adds; see TESTING.md): `app/src/__tests__/drawnPieces.test.ts`, `app/src/__tests__/drawnPieceArt.test.tsx`, and the baseline fixture `app/src/__tests__/fixtures/flatsBaseline.json`.

Not touched: `tileArt.ts` (the accessory shape uses its existing top-and-pants rule, see Steps 6), `kinds.ts` (see technical default 1), `itemName.ts`, `i18n/en.ts` (no words are added, see technical default 2), `service.ts`, `ClosetTile.tsx`, `demo/*`.

## Interfaces
Everything a test calls. The test writer reads only this section.

### `flats.ts`
```ts
export type AccessoryType = 'watch' | 'belt' | 'cap' | 'beanie';
export type WatchMetal = 'gold' | 'silver' | 'black';
export const WATCH_METALS: readonly WatchMetal[];            // ['gold', 'silver', 'black']
/** The case (and bracelet) fill for each tone. The drawing fills the case with exactly this hex. */
export const METAL_HEX: Readonly<Record<WatchMetal, string>>; // gold '#C9A44C', silver '#C5C9CF', black '#2A2D34'

export interface AccessoryFlat extends FlatBase {
  kind: 'accessory';
  type: AccessoryType;
  /** Watch only: the case's tone (and the bracelet's). Unset draws silver. Ignored on a belt, cap or beanie. */
  metal?: WatchMetal;
  /** Watch only: a metal bracelet in `metal`'s tone instead of a strap in `color`. */
  bracelet?: boolean;
  /** Watch only: 'digital' draws a dark display with lit digits (no text element); unset draws an analog dial. */
  face?: 'analog' | 'digital';
}
export type FlatSpec = TopFlat | BottomFlat | ShoeFlat | AccessoryFlat;

/** Unchanged signature. For an AccessoryFlat, `color` is the strap's color (watch), the leather's (belt) or the cloth's
 *  (cap, beanie). Same viewBox (0 0 200 200), same scheme and id rules, same halo and rim rules as every other flat. */
export function renderFlat(spec: FlatSpec, opts?: { scheme?: 'light' | 'dark'; id?: string }): string;
```
Output rules every accessory drawing keeps (tests assert these on the string):
- Deterministic: the same spec, scheme and id give the same string. No `NaN` or `undefined` in it.
- Only elements react-native-svg's `SvgXml` supports: `svg defs g path rect circle ellipse line polygon polyline linearGradient radialGradient stop pattern` (and `text` only where the existing flats already use it; the accessories use none).
- The piece's color appears as a fill of the drawing (the strap, leather or cloth), exactly as given, so a black piece is drawn in `#1E2026` and not in a nearby shade.
- Dark scheme and a very dark `color` (same test the other flats use: below `HALO_LUM`) adds the faint light rim; light scheme and a very light `color` (`lightnessOf(color) >= RIM_L`) adds the thin ink outline. Both through the existing `halo()` helper.
- Never draws a brand word or any text: `AccessoryFlat.brand` is ignored.

### `artSpec.ts`
```ts
import type { ClosetItemRow, ClosetArt } from '@/data/types';
import type { WatchMetal } from './flats';

export type ArtShape = 'top' | 'bottom' | 'shoe' | 'accessory';   // 'accessory' is new
/** Where a kind sits. 'accessory' is not a Closet slot (ClosetSlot has four); it is only used here and by cards. */
export type PieceSlot = 'top' | 'outer' | 'bottom' | 'shoes' | 'accessory';

/** What artSpec reads: a closet row's drawing fields. A closet row satisfies it, and so does `drawnItem(...)`'s result. */
export type ArtItem = Pick<ClosetItemRow, 'garment' | 'hex' | 'art' | 'name'>;

/** A piece with no closet row: what T102 stores on a card and T104 draws. Three facts, plus a watch's metal. */
export interface DrawnPieceSpec {
  /** A reading subcategory ('chelsea_boot', 'tee', 'bomber'), a closet-only kind key ('henley', 'zip_hoodie',
   *  'jorts', see kinds.ts), or one of 'watch' | 'belt' | 'cap' | 'beanie'. */
  kind: string;
  /** One of the 25 color families (core `FAMILY_HEX` keys). The drawing is in this family's swatch. */
  family: string;
  /** Its name as the card shows it ("Black work boots"). Used for VoiceOver; never decides the drawing. */
  name: string;
  /** A watch's metal tone, a detail and never a color family. Ignored on every other kind. */
  metal?: WatchMetal;
  /** A watch's face. Ignored on every other kind. Unset draws analog. */
  face?: 'analog' | 'digital';
}

/** Every `kind` `drawnItem` draws on its own: the keys of the reading kinds artSpec already maps (tops, outerwear,
 *  bottoms, shoes), the closet-only kinds, and 'watch' | 'belt' | 'cap' | 'beanie'. No duplicates. */
export const DRAWN_KINDS: readonly string[];

/** The slot a kind belongs to, or null for a kind not in DRAWN_KINDS. 'chore_coat', 'denim_jacket', 'bomber',
 *  'leather_jacket', 'field_jacket', 'shell_jacket', 'rain_jacket', 'puffer', 'blazer', 'unstructured_blazer',
 *  'sport_coat', 'suit_jacket' and 'overcoat' are 'outer'; the other TOP kinds (overshirt, cardigan, hoodie,
 *  sweater, ...) are 'top'; belt, watch, cap, beanie are 'accessory'. */
export function pieceSlotOf(kind: string): PieceSlot | null;

/**
 * The drawable form of a drawn piece, shaped like a closet row's drawing fields and carrying no id, no slot and no
 * photo, so it cannot be mistaken for one of his pieces.
 *  - garment: { category, subcategory, color_family: family, ... } built with core's G(). A closet-only kind (henley)
 *    keeps its reading kind in `subcategory` ('tee') and its own key in `art.kind`, exactly as Closet stores it.
 *    A cap or beanie has category 'accessory' and subcategory 'cap' or 'beanie'.
 *  - hex: displayHex(family) (the same hex a closet piece of that family draws). An unknown family draws as grey
 *    (FAMILY_HEX.grey), never as the near-white UNKNOWN_HEX.
 *  - art: { family, shade: null, details, brand: null, shoeProfile: null, denimWear: null, pattern: 'solid', ...(kind) }.
 *    A watch's `details` carries 'metal_gold' | 'metal_silver' | 'metal_black' for its metal, and 'digital' for a digital face.
 *  - name: the spec's name.
 * `slotHint` only matters when `kind` is not in DRAWN_KINDS: 'top' draws a 'tee', 'outer' a 'field_jacket', 'bottom'
 * 'chinos', 'shoes' 'low_profile_sneaker', in the family's color and under the given name. With no hint, or with
 * 'accessory' (a bag, a ring), an undrawable kind returns null: no drawing at all, never a wrong one.
 */
export function drawnItem(piece: DrawnPieceSpec, slotHint?: PieceSlot): ArtItem | null;

/** The drawing for a piece. Unchanged signature; a closet row, a reading's garment or `drawnItem(...)`'s result. */
export function artSpec(item: ArtItem): ArtSpec;
export interface ArtSpec { shape: ArtShape; flat: FlatSpec; glyphs: Glyph[]; a11y: string }
```
`artSpec` reading rules for the accessory shape (a closet row or a `drawnItem` result both go through these):
- It is an accessory when `garment.category === 'accessory'` and `garment.subcategory` is `'watch'`, `'belt'`, `'hat'`, `'cap'` or `'beanie'`. `'hat'` draws as a cap. `'beanie'` draws as a beanie. `shape` is `'accessory'`, and `flat.kind` is `'accessory'`.
- An accessory with any other subcategory (`'bag'`, `'other'`) keeps drawing exactly as it does today (a tee-shaped top): this task adds no new fallback and removes none.
- `flat.color` is `item.hex`. For a watch: `metal` is the one named by `art.details` (`'metal_gold'` / `'metal_silver'` / `'metal_black'`; if more than one is present, gold, then silver, then black); none or an unknown value leaves `metal` unset (silver). `face` is `'digital'` when `art.details` has `'digital'`, else unset. `bracelet` is true exactly when the garment's `color_family` is `'multicolor'` (no strap color said), so a metal-only watch ("a gold watch") is a bracelet in that metal.
- `glyphs` is `[]` for every accessory and `a11y` is exactly `item.name`: no new words, so no new i18n keys (technical default 2).
- Nothing about a piece that is not an accessory changes.

```ts
/** Everything that draws one piece, closet row or not, as the pure function PieceArt calls. A DrawnPieceSpec goes through
 *  drawnItem(piece, slotHint); null when it can't be drawn. */
export function pieceArtSpec(item: ArtItem | DrawnPieceSpec, slotHint?: PieceSlot): ArtSpec | null;
```
A `DrawnPieceSpec` is told apart from a closet row by having both `kind` and `family` at its top level (a closet row has neither).

### `GarmentArt.tsx`
```tsx
/** A closet piece, a reading's garment, or a drawn piece, at `size`. A drawn piece that can't be drawn renders an empty
 *  size x size box (it never throws and never draws something else). */
export function PieceArt(props: { item: (Pick<ClosetItemRow, 'garment' | 'hex'> & { art?: ClosetArt | null; name?: string }) | DrawnPieceSpec; size: number; slot?: PieceSlot }): JSX.Element;
export function GarmentArt(props: { spec: ArtSpec; size: number }): JSX.Element;   // unchanged
```
Existing callers (`OutfitTiles`, `HeroStrip`, `EditSheet`, ...) pass what they pass today and need no change. There is no new testID (the drawing stays decorative and hidden from VoiceOver; its parent carries the label).

### How the other tasks use this (the contract they build against)
- **T102** stores a `DrawnPieceSpec` as `{kind, family, name, metal?, face?}` in a card's `needs`, `options` and `add`, and checks `kind` with `DRAWN_KINDS.includes(kind)` and `family` against the 25 families.
- **T104** draws `PieceArt item={spec} size={...}` (or `drawnItem(spec, slot)` when it needs the fallback). Its tile adds the dashed border and `You'd need`; T101 draws only the picture.
- **T106** adds a chat piece to Closet by writing a row whose `garment`, `hex` and `art` are exactly `drawnItem(spec)`'s. Then the card, the closet tile and the piece page draw the same picture (KC9.3, KC4.3). The row's `slot` and `name` are T106's call (open question 1).

## Steps
0. **Baseline first, before any edit to `flats.ts`.** Write `app/src/__tests__/fixtures/flatsBaseline.json` from today's code: for every `TopType`, `BottomType` and `ShoeType` in `flats.ts`, three colors (`#1E2026`, `#F2F0EA`, `#B98E62`) and both schemes, the SHA-256 of `renderFlat({ kind, type, color }, { scheme, id: 'x' })`. Commit it alone (`T101: baseline`). The unchanged-drawings test reads it.
1. `flats.ts`: add the types, `METAL_HEX`, `WATCH_METALS`, the dispatch in `renderFlat` (`spec.kind === 'accessory' ? accessory(spec, ctx) : ...`), and `accessory()` with four drawings. Reuse `shadeDefs`, `edgeFor`, `halo`, `fold`, `mix`, `lum` and `stitch` so they match the other flats' light, edge and ground shadow. Follow the mockup's parts, not its proportions:
   - **watch:** a vertical strap through a round case; analog dial (hour marks, two hands) or digital display (a dark rounded rect with lit digit segments drawn as paths); a crown. Strap in `color`, case in `METAL_HEX[metal ?? 'silver']`. With `bracelet`, the strap is drawn as linked segments in the metal's tone.
   - **belt:** drawn laid out so it fills the 200 × 200 box about as much as a shoe fills its band (a coiled or gently looped strap with the buckle and a few holes), not a thin straight stripe (a straight 16-of-100 strip is about 10 pt tall on a 61 pt art box). Leather in `color`, buckle always silver-grey (technical default 4).
   - **cap:** a dome of six panels with a button, a curved brim and a seam; in `color`.
   - **beanie:** a knit dome with a ribbed folded cuff (the `knit` pattern idea, not a new pattern type); in `color`.
2. `flats.ts`: pass each accessory's silhouette paths to `halo()` so a black belt or beanie keeps its edge in dark and a white cap keeps its outline in light.
3. `artSpec.ts`: `ArtShape` and `shapeOf` learn `'accessory'` (before the `'top'` fallthrough, only for the five subcategories above). Add the accessory branch, `PieceSlot`, `ArtItem`, `DrawnPieceSpec`, `DRAWN_KINDS`, `pieceSlotOf`, `drawnItem`, `pieceArtSpec`. `DRAWN_KINDS` is built from the existing `TOP`, `BOTTOM`, `SHOE` tables plus the four accessories, so a kind drawable today is drawable by name.
4. `GarmentArt.tsx`: `PieceArt` calls `pieceArtSpec`; `null` renders the empty box.
5. Run `tsc`: any `switch` or branch over `FlatSpec['kind']` or `ArtShape` elsewhere (for example `LookTile.tsx`, `tileArt.ts`) that tsc flags is fixed with the smallest change that keeps today's behaviour; a change anywhere outside the three lane files is reported, not made (see Open questions, technical default 6).
6. `tileArtBox('accessory', ...)` takes the non-shoe branch today (`min(w, h) × scale`, no nudge). The four drawings are made to fill their box, so `tileArt.ts` stays as it is.
7. Tests, then `npm run check` in `app/`, then screenshots (TESTING.md → UI inventory), then commit `T101: build`.

## Data changes
None stored. No migration, no new table, no new key in `en.ts`. New art vocabulary, written only by chat adds (T106): `art.details` values `metal_gold`, `metal_silver`, `metal_black`, `digital`; `garment.subcategory` values `cap` and `beanie` (core's `Subcategory` type has `hat`, and `Loose<Subcategory>` allows these two strings; no core file changes).

## What must not break
- Every drawing that exists today: all `TopType`, `BottomType`, `ShoeType` renders in both schemes are byte-identical (the baseline fixture), and `artSpec`'s output for every existing piece, including its `a11y` line, is unchanged. `artSpec.test.ts` passes untouched.
- A reading's accessory garment that is not a watch, belt, hat, cap or beanie still draws as it does today.
- Welcome, the Example check (`drawnPieces(reading)` leaves accessories out), the morning card, Closet tiles, the piece page, the edit sheet.
- No score: `artSpec`, `renderFlat` and everything added here are display only. Nothing in `@kitted/core` reads them, and an accessory in a reading or a closet row still changes no score (the rubric filters `category === 'accessory'` out of scoring).
- No store, closet-service or network import added to the three lane files (the drawing stays pure; `GarmentArt.tsx` keeps only its current imports plus the new ones from `artSpec`).
- No photo and no AI image anywhere in the drawing (KC9.1).

## Open questions
**For the founder (words users read, taste)**
1. **Closet's section for a watch, belt, cap or beanie he adds from chat.** Closet has four sections (tops, outerwear, bottoms, shoes) and no accessory slot. A row with an unknown slot lands in Tops today (`closetSections` falls back to `top`). Is Tops (under a tee) acceptable for the beta, or should Closet get an `Accessories` section? That is a new word users read (`closet.section.accessory`), so it is his call. It does not block T101 (the drawing is done either way); T106 and the Closet lane act on it. My pick: a section called `Accessories`, listed last, added in T106, since a watch under Tops reads as a bug.
2. **A digital watch.** KC9.3's own example is "a gold digital watch". The plan draws a digital face for it (a dark display with lit digits) in addition to the spec's analog dial, so the drawing doesn't contradict the name. If he wants one watch drawing only, say so and the face option comes out (about 15 lines). My pick: keep it.

**Technical defaults (the coordinator logs these; the builder follows them)**
1. **Cap and beanie are told apart by `garment.subcategory` (`'cap'`, `'beanie'`; `'hat'` draws as a cap), not by `art.kind`/`kinds.ts`.** `kinds.ts` is outside this lane, and adding them there would make them pickable kinds in Closet's What it is. A garment-level subcategory also survives any rebuild of `art` from sightings.
2. **A watch's metal and face live in `art.details`** (`metal_gold`, `metal_silver`, `metal_black`, `digital`), and accessories add no VoiceOver words: `a11y` is the piece's name only. `i18n/en.ts` is shared and not in this lane; the name already carries "gold" or "digital" when he said so.
3. **A watch whose color family is `multicolor` draws a metal bracelet** in its metal's tone (a watch described only by its metal: "a gold watch"); any other family is the strap color. A watch with no metal at all gets silver.
4. **The metal tone is for watches only** (KC9.2): a belt's buckle is always silver-grey, and `metal` on a belt, cap or beanie is ignored.
5. **Unknown family draws grey; unknown kind draws the slot's stand-in or nothing** (the spec's edge row "a drawn piece's kind can't be drawn", with the stand-in a plain tee, field jacket, chinos or low-profile sneaker in the right color). The slot comes from `slotHint`; a bag or ring (`'accessory'` or no hint) draws nothing.
6. **iOS proof of the accessories at card size waits for T104's demo screens; the proof now is a contact sheet.** `demo/scenarios.ts` and `demo/prepareDemoScreen.ts` are not in this lane and T104 edits `scenarios.ts`. The builder renders `renderFlat` for the four accessories (and a drawn boot) in light and dark at about 61 pt (a 76 pt card tile's art), 88 pt (a Closet tile's) and 120 pt (largest text) into a page, screenshots it in the Browser pane and puts the PNGs in `tasks/T101/shots/`. The page and its generator are throwaway and not committed. Closet's real tile on iOS for a chat-added accessory needs T106's Add to exist; until then a component test renders `ClosetTile` for an accessory row.
7. **If tsc forces a change outside the three lane files** (for example a `switch` in `LookTile.tsx` over `FlatSpec['kind']`), the builder makes the one-line change and reports it in TASK.md, rather than widening the lane silently.
8. **The accessory closet row's `slot` is `'accessory'`** (T106 writes it): every outfit, score and match path filters by the four slots (`outfits.ts`, `merge.ts`, `service.ts`), so such a row joins no outfit. T106's planner re-checks that against the closet service.

## Risky in this lane
- `flats.ts` is 790 lines shared by every tile in the app. A mistake in the shared helpers breaks every drawing; the baseline fixture is the guard. Add the accessories as new functions, and don't edit `top()`, `bottom()`, `shoe()`, `halo()` or `edgeFor()`.
- `renderFlat` is the only thing between the string and a `SvgXml` parse on a phone. The browser's SVG accepts more than react-native-svg does, so a contact sheet that looks right in the Browser pane proves the shapes, not that iOS draws them (TESTING.md → Not testable yet).
- `art.details` is rebuilt from sightings in `profile.ts`. A chat-added piece has no sightings, so its metal and face stay, but a piece later given a photo could lose them. Accessories are not photographed in the beta (no accessory slot), so this is noted, not handled.
- A `subcategory` of `'belt'` in a photo reading already changes one thing outside scoring: `rubric.ts` raises the "a belt is visible" quick-tap for sweatpants. A closet row isn't a reading, so a chat-added belt can't trigger it; noted so nobody reads KC9.2's "never affect a score" as covering that unrelated question.

## Coordinator notes (before tests)
- Digital watch face: kept (the spec's own example is "a gold digital watch"). Words users read: none added by T101.
- A new `Accessories` Closet section is a word users read and belongs to T106 and the Closet lane; it is the founder's call and does not block T101. Raised with the control session.
- The technical defaults above are accepted as written.
