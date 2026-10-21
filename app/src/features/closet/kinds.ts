// More kinds than the reading names (founder, Oct 17, #361: "the full sleeve shirt is not included … half sleeve
// button-ups are not included … add more options like this"). Each is a closet-only kind: it scores, matches and
// builds outfits exactly as the reading's own kind (`sub`, what the piece's reading keeps), and it draws and names as
// itself. The photo reader never returns one (its list is unchanged, so no reading or score moves); he picks it on a
// piece's page (What it is → Kind). Stored as the piece's profile.kindVariant, mirrored into its art as `kind`.
// The long-sleeve tee isn't one of these: it's a tee with long sleeves (sleeves.ts, #359), read from his photos too.
// A kind named by its sleeves sets the piece's sleeve length as confirmed when he picks it, so the drawing follows and
// the matcher keeps a long- and a short-sleeve shirt apart. Pure.
import type { Sleeves } from './sleeves';

export interface KindVariant {
  /** The reading's kind it scores and matches as. */
  sub: string;
  /** The garment noun in names and copy ("short-sleeve shirt"). */
  noun: string;
  /** The sleeves its name says, confirmed when he picks it. */
  sleeves?: Sleeves;
}

export const VARIANTS: Readonly<Record<string, KindVariant>> = {
  button_up_shirt: { sub: 'oxford_shirt', noun: 'button-up shirt', sleeves: 'long' },
  short_sleeve_shirt: { sub: 'camp_collar_shirt', noun: 'short-sleeve shirt', sleeves: 'short' },
  henley: { sub: 'tee', noun: 'henley' },
  turtleneck: { sub: 'sweater', noun: 'turtleneck' },
  zip_hoodie: { sub: 'hoodie', noun: 'zip hoodie' },
  jorts: { sub: 'shorts', noun: 'jean shorts' },
};

export const isVariant = (kind: unknown): kind is string => typeof kind === 'string' && Object.prototype.hasOwnProperty.call(VARIANTS, kind);
/** The reading's kind a picker option writes: a variant's `sub`, or the kind itself. */
export const engineKind = (kind: string): string => (isVariant(kind) ? VARIANTS[kind]!.sub : kind);

/** The sleeves a kind is drawn with when nothing else says: a camp shirt is short-sleeved (it drew long, a bug). */
export const KIND_SLEEVES: Readonly<Record<string, Sleeves>> = { camp_collar_shirt: 'short', henley: 'long', turtleneck: 'long' };
