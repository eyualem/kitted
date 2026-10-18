// More kinds than the reading names (founder, Oct 17, #339: "the full sleeve shirt is not included … half sleeve
// button-ups are not included … add more options like this"). Each is a closet-only kind: it scores, matches and
// builds outfits exactly as the reading's own kind (`sub`, what the piece's reading keeps), and it draws and names as
// itself. The photo reader never returns one (its list is unchanged, so no reading or score moves); he picks it on a
// piece's page (What it is → Kind). Stored as the piece's profile.kindVariant, mirrored into its art as `kind`.
// Sleeves: a kind he picks that's named by its sleeves sets the piece's sleeve length as confirmed, so the drawing
// follows and the matcher keeps his long- and short-sleeve tees apart. The reader's own sleeve read never changes a
// drawing or a name (on his phone it called a tee under an overshirt "long"). Pure.

export type Sleeves = 'short' | 'long' | 'sleeveless';

export interface KindVariant {
  /** The reading's kind it scores and matches as. */
  sub: string;
  /** The garment noun in names and copy ("long-sleeve tee"). */
  noun: string;
}

export const VARIANTS: Readonly<Record<string, KindVariant>> = {
  long_sleeve_tee: { sub: 'tee', noun: 'long-sleeve tee' },
  henley: { sub: 'tee', noun: 'henley' },
  button_up_shirt: { sub: 'oxford_shirt', noun: 'button-up shirt' },
  short_sleeve_shirt: { sub: 'camp_collar_shirt', noun: 'short-sleeve shirt' },
  turtleneck: { sub: 'sweater', noun: 'turtleneck' },
  zip_hoodie: { sub: 'hoodie', noun: 'zip hoodie' },
  jorts: { sub: 'shorts', noun: 'jean shorts' },
};

export const isVariant = (kind: unknown): kind is string => typeof kind === 'string' && Object.prototype.hasOwnProperty.call(VARIANTS, kind);
/** The reading's kind a picker option writes: a variant's `sub`, or the kind itself. */
export const engineKind = (kind: string): string => (isVariant(kind) ? VARIANTS[kind]!.sub : kind);

/** Kinds named by their sleeves: a pick confirms these. Other kinds (a hoodie, a jacket) leave the sleeves alone. */
export const KIND_SLEEVES: Readonly<Record<string, Sleeves>> = {
  tee: 'short', graphic_tee: 'short', polo: 'short', knit_polo: 'short', jersey: 'short', camp_collar_shirt: 'short', short_sleeve_shirt: 'short',
  tank_top: 'sleeveless',
  long_sleeve_tee: 'long', henley: 'long', button_up_shirt: 'long', oxford_shirt: 'long', dress_shirt: 'long', flannel_shirt: 'long', rugby_shirt: 'long',
};
