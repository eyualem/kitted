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
  // Garment labels (pills, "What I read", ledger items)
  'label.inHand': '{name} · in hand',
  'label.withLeg': '{name} · {leg}',
  'read.notInPhoto': '{slot} not in photo',
  'label.slot.footwear': 'Shoes',
  'label.slot.bottom': 'Bottoms',
  // Card summaries (template sentences; 04 §5.6 asks for templates in the demo)
  'sum.heldLayer': 'Clean base. The {held} in your hand finishes it.',
  'sum.lounge': '{bottoms} read as loungewear outside the gym. Headed there? Change the occasion.',
  'sum.oneMove': 'Good base. One easy change gets you to {to}.',
  'sum.closetMove': 'Good base. Something you own gets you to {to}.',
  'sum.dialed': 'Clean and finished. Nothing to fix.',
  'sum.noQuickFix': 'No quick fixes for this one.',
  'sum.recheck.layer': 'Layered and clean.',
  'sum.recheck.generic': 'Fixed and clean.',
  'sum.recheck.tail': '{word}. Nothing else changed.',
  'sum.notSeen.held': 'the {held} in your hand',
  'sum.notSeen.generic': 'the same outfit',
  'card.noFixes': 'No quick fixes for this one.',
  // Re-check prompt pieces (recheck.prompt = "{fixQuestion} Send it. I'll only re-read the {slotWord}.")
  'recheck.q.held': '{held} on?',
  'recheck.q.generic': 'Made the change?',
  'recheck.slot.outerwear': 'layer',
  'recheck.slot.top': 'top',
  'recheck.slot.bottom': 'pants',
  'recheck.slot.footwear': 'shoes',
  'recheck.slot.any': 'change',
  'recheck.fixPast.held': 'wear it',
  'recheck.fixPast.generic': 'make the change',
  // "Why this score" rows (rule names in plain words, from rubric/v3.md)
  'why.rounded': 'Rounded to the nearest half',
  'why.adjust': 'Score limits',
  'why.dressedRight': 'dressed right for it',
  'why.reason.heldNotWorn': 'the {held} is in your hand, not on',
  'why.reason.noLayer': 'no layer today',
  'why.reason.noElevated': 'all casual pieces today',
  'why.reason.allNeutral': 'all neutrals today',
  'why.reason.tooMuchInterest': 'a lot going on already',
  'why.reason.shoesHidden': 'shoes not in the photo',
  'why.reason.shoesOff': "shoes don't match the rest",
  'why.rule.F4_pooling': 'Pants pool at the shoe',
  'why.rule.F4b_full_break_narrow_leg': 'Too much break for a slim leg',
  'why.rule.F7_care': 'Wrinkles or wear',
  'why.rule.F6_top_too_long': 'Top runs long',
  'why.rule.F8_too_big': 'Top is too big',
  'why.rule.F9_sleeves_cover_hands': 'Sleeves cover your hands',
  'why.rule.F10_visible_strain': 'Pulling at the seams',
  'why.rule.T1_dress_shirt_untucked': 'Dress shirt untucked',
  'why.rule.P1_top_volume_vs_style': 'Top fit vs your style',
  'why.rule.P1_leg_vs_style': 'Leg shape vs your style',
  'why.rule.P2_big_top_skinny_leg': 'Big top, skinny leg',
  'why.rule.P3_everything_oversized': 'Everything oversized',
  'why.rule.L1_shirt_hangs_below_blazer': 'Shirt hangs below the jacket',
  'why.rule.S1_bulky_shoe_narrow_leg': 'Bulky shoes, narrow leg',
  'why.rule.C1a_too_many_accent_colors': 'Too many accent colors',
  'why.rule.C1b_too_many_colors': 'Too many colors',
  'why.rule.C3_bright_clash': 'Bright colors clash',
  'why.rule.C4a_same_pattern_same_scale': 'Same pattern twice',
  'why.rule.C4a_same_pattern_type': 'Two of the same pattern',
  'why.rule.C4b_three_plus_patterns': 'Three or more patterns',
  'why.rule.B1_too_many_focal_points': 'Too many things to look at',
  'why.rule.C5_near_match_jacket_trousers': 'Jacket almost matches the pants',
  'why.rule.O1_too_casual': 'Too casual for it',
  'why.rule.O1_too_formal': 'Too dressy for it',
  'why.rule.O4_loungewear_out': 'Loungewear outside the gym',
  'why.rule.S2_shoes_too_casual_for_outfit': 'Shoes too casual for the rest',
  'why.rule.O3_large_logo': 'Big logo',
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
