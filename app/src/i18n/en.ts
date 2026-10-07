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

/** Demo-build-only strings (not in the deck because they never ship to the App Store). */
const demoOnly = {
  'demo.placeholder.title': '{id} · {name}',
  'demo.placeholder.body': 'Placeholder. Built in {phase}.',
  'demo.placeholder.state': 'Demo state: screen {n}',
  'demo.index.title': 'Demo screens',
  'demo.unknownScreen': 'There is no demo screen {n}.',
} as const;

export const en = { ...enGenerated, ...demoOnly } as const;

export type StringKey = keyof typeof en;
export type Params = Readonly<Record<string, string | number>>;

const pluralRules = new Intl.PluralRules('en-US');

function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = params[name];
    return v === undefined ? m : String(v);
  });
}

/**
 * Looks up a string and fills `{name}` arguments. When `params.n` is a number and the key has
 * a plural variant, the `one` form is used for n = 1 (Intl.PluralRules, "1 fit" / "37 fits").
 */
export function t(key: StringKey, params?: Params): string {
  let template: string = en[key];
  const n = params?.n;
  if (typeof n === 'number') {
    const variant = (plurals as Partial<Record<StringKey, { one: string }>>)[key];
    if (variant && pluralRules.select(n) === 'one') template = variant.one;
  }
  return fill(template, params);
}
