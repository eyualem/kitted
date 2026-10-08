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
  // Time formats (no Intl on Hermes): "Thursday 8:00 am", "Oct 14, 8:00 am", "7:42"
  'fmt.weekdays': 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
  'fmt.months': 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
  'fmt.monthsLong': 'January,February,March,April,May,June,July,August,September,October,November,December',
  'fmt.longDate': '{month} {day}',
  'fmt.am': 'am',
  'fmt.pm': 'pm',
  'fmt.stampRecent': '{weekday} {time} {ampm}',
  'fmt.stampOlder': '{month} {day}, {time} {ampm}',
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
  'nqr.fitDetail': '{fit} fit',
  'nqr.legTitle': '{name} · {leg} leg',
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
  // S11 Added to your closet: the row detail ("Top · Regular fit") and VoiceOver.
  'added.slot.top': 'Top',
  'added.slot.bottom': 'Bottom',
  'added.slot.shoes': 'Shoes',
  'added.slot.outer': 'Layer',
  'added.detail': '{slot} · {fit}',
  'added.topFit': '{fit} fit',
  'added.legFit': '{leg} leg',
  'added.a11y.row': '{name}, {detail}.',
  'added.a11y.removed': '{name}, removed.',
  'added.a11y.undo': 'Undo {name}',
  'added.a11y.addBack': 'Add back {name}',
  // S13 photo viewer: "Date · October 22"; VoiceOver uses a11y.photo with the date.
  'viewer.caption': '{occasion} · {date}',
  'viewer.a11y.page': 'Photo {n} of {total}',
  // S10 entry on the partial card's finish row (no remembered pair).
  'partial.a11y.pick': 'Pick shoes from your closet',
  // Morning/evening card (02 "S1d", DECISIONS-LOG #58–62). Templates; code picks the outfit.
  'occasion.goingOut': 'Going out',
  'occasion.stayingIn': 'Staying in',
  'style.streetwear': 'Streetwear',
  'style.smart_casual': 'Smart casual',
  'style.minimalist': 'Minimal',
  'style.workwear': 'Workwear',
  'style.old_money': 'Old money',
  'style.vintage_sport': 'Sporty',
  'style.gorpcore': 'Outdoorsy',
  'style.none': 'Any style',
  'style.menu.yours': 'Your styles',
  'style.menu.more': 'More styles',
  'idea.today': 'Today',
  'idea.tonight': 'Tonight',
  'idea.pieces1': '1 piece so far',
  'idea.piecesN': '{n} pieces so far',
  'greet.morning': 'Morning.',
  'greet.afternoon': 'Afternoon.',
  'greet.evening': 'Evening. Heading out?',
  'wx.line.swing': '{now}° now, {high}° by afternoon.',
  'wx.line.flat': '{now}° and {cond}.',
  'wx.line.evening': '{now}° at 8, {late}° by midnight.',
  'wx.line.rainFrom': 'Rain likely after {time}.',
  'wx.line.rainAll': 'Rain likely.',
  'wx.line.season': '{month}: bring a layer.',
  'wx.cond.clear': 'clear',
  'wx.cond.cloudy': 'cloudy',
  'wx.cond.rain': 'rainy',
  'wx.cond.snow': 'snowy',
  'wx.cond.fog': 'foggy',
  'wx.cond.wind': 'windy',
  'wx.strip.day': '{now}° now · {high}° high',
  'wx.strip.evening': '{now}° at 8 pm · {late}° by midnight',
  'wx.strip.rainFrom': 'Rain likely after {time}',
  'wx.strip.rainAll': 'Rain likely',
  'wx.strip.dry': 'Dry all day',
  'wx.strip.dryNight': 'Dry tonight',
  'wx.strip.a11y': '{main}. {rain}.',
  'wx.attribution': 'Weather',
  'wx.sources': 'Data sources',
  'wx.sample': 'Sample weather',
  'wx.ask.title': 'Use your local weather?',
  'wx.ask.body': "Your rough location only. It isn't stored.",
  'wx.ask.allow': 'Allow',
  'why.idea.layerOff': '{layer} for the cold start; it comes off by afternoon.',
  'why.idea.layerWarm': '{layer} for the cold.',
  'why.idea.layerLate': 'Keep the {layer} on; it gets cold late.',
  'why.idea.wetShoes': '{shoes} for the rain.',
  'why.idea.hotLight': 'Light and simple for the heat.',
  'why.idea.needLayer': "It's cold out, and I haven't seen a layer of yours yet.",
  'why.idea.needCoat': 'Below 35°, a warmer coat would help.',
  'why.idea.occasion': 'Clean and easy for {occasion}.',
  'idea.for.everyday': 'today',
  'idea.for.class': 'class',
  'idea.for.date': 'a date',
  'idea.for.going_out': 'a night out',
  'idea.for.interview': 'an interview',
  'idea.for.event': 'an event',
  'idea.for.staying_in': 'tonight',
  'why.idea.sameStyle': 'Same pick works for {style}.',
  'idea.need.layer': "You'd need: a layer",
  'idea.need.coat': "You'd need: a warm coat",
  'idea.need.top': 'A top',
  'idea.need.bottom': 'Bottoms',
  'idea.need.shoes': 'Shoes',
  'idea.thin1': "I only know 1 of your pieces. Check today's fit and I'll learn the rest.",
  'idea.thinN': "I only know {n} of your pieces. Check today's fit and I'll learn the rest.",
  'idea.empty': "Send me today's fit and I'll start learning your closet.",
  'own.title': 'Going with your own?',
  'own.sub': 'Check it before you leave',
  'own.subEvening': 'Check it before you head out',
  'own.dressedTitle': 'Dressed? Check it on',
  'own.dressedSub': 'See how it fits on you',
  'own.limit': 'Your free check resets tomorrow',
  'own.a11yHint': 'Opens the camera',
  'idea.went.own': 'You went with your own',
  'idea.went.pick': 'You wore my pick',
  'idea.stayingIn': 'Staying in tonight',
  'idea.past.wore': "{day}'s idea · Wore it",
  'idea.past.own': "{day}'s idea · Went with your own · {score}",
  'idea.past.skipped': "{day}'s idea",
  'idea.a11y.card': 'Outfit idea for {occasion}, {when}. {weather}{items}.',
  'idea.a11y.occasion': 'Occasion: {occasion}. Changes the outfit',
  'idea.a11y.style': 'Style: {style}. Changes the outfit',
  'tip.wx.lead': 'Weather',
  'tip.wx.after': 'after {time}',
  'tip.wx.today': 'today',
  'tip.wx.wetSuede': "Rain {when}: suede and rain don't mix.",
  'tip.wx.wetLight': 'Rain {when}: light sneakers will show it.',
  'tip.wx.coldNoLayer': 'Cold out: bring a layer.',
  'tip.wx.coldNoCoat': 'Below 35°: grab a warmer coat.',
  'tip.wx.hotLayer': 'Hot out: lose the layer outside.',
  // "Scored for" and re-score (02 "S6s", D7; DECISIONS-LOG #61–62).
  'rescore.title': 'Re-score for {choice}?',
  'rescore.msg': 'Same photo. It would be {after} instead of {before}.',
  'rescore.msgSame': 'Same photo. The score stays {before}.',
  'rescore.keep': 'Keep {current}',
  'rescore.go': 'Re-score',
  'rescore.footnote': 'Re-scored · was {score} for {lens}',
  'scoredFor.off': 'Scored for {style}: your {garment} fit the look here. No points off.',
  'scoredFor.on': 'Scored for {style}: it takes a little off for your {garment}.',
  'scoredFor.general': 'Scored by the general standard',
  'scoredFor.generic': 'Scored for {style}: it changed how one piece counts.',
  'why.style.header': 'Scored for {style}',
  'why.style.off': 'On-style for {style}. General standard: {amount}',
  'why.style.on': 'Stricter for {style}. Counted above',
  'why.style.notCounted': 'not counted',
  'why.style.footer': 'Change the style on the card to see it scored another way.',
  'idea.swap.title': 'Swap which piece?',
  'idea.swap.item': 'The {item}',
  'idea.checkFit': 'Check my fit',
  'idea.a11y.collapsed': '{when}, {occasion}: {what}, {score}, {word}. Shows the result.',
} as const;

/** Demo-build-only strings (not in the deck because they never ship to the App Store). */
const demoOnly = {
  'demo.placeholder.title': '{id} · {name}',
  'demo.placeholder.body': 'Placeholder. Built in {phase}.',
  'demo.placeholder.state': 'Demo state: screen {n}',
  'demo.index.title': 'Demo screens',
  'demo.unknownScreen': 'There is no demo screen {n}.',
  'demo.samples.title': 'Sample photos',
  'demo.samples.sub': 'The demo scores its bundled photos. Pick one.',
  'demo.samples.recheck': 'Pick the after photo.',
  'demo.samples.snap': 'Pick a photo to read the shoes from.',
  'demo.samples.a11y': 'Sample photo {n}',
  'demo.samples.own': 'Choose from your photos',
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
