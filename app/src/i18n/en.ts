// UI strings (05 §3.2): every user-facing string comes from here, keyed by the copy-deck keys
// in 02 §5. The deck itself is generated into en.generated.ts; this file adds the plural forms
// and the few strings that exist only in demo builds.
import { enGenerated } from './en.generated';

/** Plural variants for the counted strings (02 §5 rows marked "plural"). `other` is the deck string. */
const plurals: Partial<Record<keyof typeof enGenerated, { one: string }>> = {
  'why.mistakes': { one: '1 mistake found' },
  'item.fits': { one: '+1 fit' },
  'toast.fits': { one: '+1 fit' },
  'closet.rotation.label': { one: 'fit your\ncloset makes' },
  'item.wornCount': { one: '1 time' },
  'lookbook.row.full': { one: '{date} · Full check · 1 fix' },
  'pay.today.toTarget': { one: 'One free fix to {target}.' },
  'share.delta': { one: '{before} → {after} after 1 fix' },
  'push.ready': { one: 'Your fit check is ready. 1 quick fix inside.' },
};

/**
 * Strings added during the build (P2+) that the copy deck (02 §5) doesn't have yet: mostly
 * VoiceOver labels. All are "N" (new); listed in handoff/DECISIONS-LOG.md for the founder.
 */
const addedInBuild = {
  'a11y.stylistSays': '{who}: {text}',
  'a11y.photo': 'Your outfit photo, {time}.',
  'a11y.photoOccasion': 'Your outfit photo, {time}, {occasion}.',
  'a11y.photoHint': 'Opens the photo',
  'a11y.changeAnswer': 'Changes your answer',
  'a11y.changeOccasionHint': 'Changes the occasion',
  'a11y.fix': 'Fix {n}: {title}. {detail}.',
  'a11y.fixGain': 'Score goes to {score}.',
  'a11y.fixDone': 'Done: {title}.',
  'a11y.score': 'Score {score} out of 10, {word}.',
  'a11y.ledgerRow': '{rule}, {item}, {amount}.',
  'a11y.ledgerTotal': 'Your score, {score} out of 10. {note}',
  'a11y.plus': 'plus {n}',
  'a11y.minus': 'minus {n}',
  'a11y.noChange': 'no change',
  'a11y.notRated': 'not rated',
  'read.a11y.progress': '{stage}, step {n} of {total}',
  'read.a11y.stageDone': '{stage}, done',
  'stylist.menu.a11y': 'More',
  'composer.a11y.field': 'Ask your stylist',
  'cam.shoe.bubbleCap': 'Shoe snap',
  'card.a11y.changeOccasion': 'Change occasion',
  'card.a11y.review': 'Review added items',
  'card.a11y.recheck': 'Re-check, {occasion}. Score went from {was} to {now}, up {delta}. {word}. Done: {fix}.',
  'why.a11y.pill': '{garment}. Correct it',
} as const;

/** Demo-build-only strings (not in the deck because they never ship to the App Store). */
const demoOnly = {
  'demo.placeholder.title': '{id} · {name}',
  'demo.placeholder.body': 'Placeholder. Built in {phase}.',
  'demo.placeholder.state': 'Demo state: screen {n}',
  'demo.index.title': 'Demo screens',
  'demo.unknownScreen': 'There is no demo screen {n}.',
} as const;

export const en = { ...enGenerated, ...addedInBuild, ...demoOnly } as const;

export type StringKey = keyof typeof en;
export type Params = Readonly<Record<string, string | number>>;

/**
 * English cardinal plurals: "one" for exactly 1, "other" for everything else (CLDR's en rule).
 * Not Intl.PluralRules: Hermes on iOS doesn't implement it (it crashed the first iOS launch).
 */
function isOne(n: number): boolean {
  return n === 1;
}

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = params[name];
    return v === undefined ? m : String(v);
  });
}

/**
 * Looks up a string and fills `{name}` arguments. When `params.n` is a number and the key has
 * a plural variant, the `one` form is used for n = 1 ("1 fit" / "37 fits").
 */
export function t(key: StringKey, params?: Params): string {
  let template: string = en[key];
  const n = params?.n;
  if (typeof n === 'number') {
    const variant = (plurals as Partial<Record<StringKey, { one: string }>>)[key];
    if (variant && isOne(n)) template = variant.one;
  }
  return fill(template, params);
}
