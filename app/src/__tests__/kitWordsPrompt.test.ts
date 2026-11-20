// T105 · Kit's words: the prompt (specs/kit-stylist-chat.md KC1.1, KC6.1, KC6.2, KC6.5, KC8.2; the rule lines of KC1.4,
// KC3.3, KC3.5, KC6.3). Written before the code (tasks/T105/TESTING.md). Pure: the system prompt, the app map, the
// guide and its generated copy. The live switches through `createPrepare` are in kitWordsPack.test.ts.
import { cutAnswer, checkSentence, sentences } from '@/features/ask/gate';
import { STYLIST_GUIDE } from '@/features/ask/guide.generated';
import {
  ANSWER_RULES, appMap, appMapLines, EXAMPLES, GUIDE_FOR, guideFor, guideSections, NEXT_BUY_LINE, NO_SWITCHES, PROMPT_VERSION, SHOP_LINE, systemPrompt,
  CLOSING_FORMAT, type AppSwitches, type AskKind,
} from '@/features/ask/prompt';
import { t } from '@/i18n/en';

const KINDS = Object.keys(GUIDE_FOR) as AskKind[];
const on = (k: keyof AppSwitches): AppSwitches => ({ ...NO_SWITCHES, [k]: true });
const idsOf = (sw: AppSwitches) => appMapLines(sw).map((l) => l.id);
const BASE_IDS = ['tabs', 'fitCheck', 'recheck', 'explainRating', 'lookbook', 'pastChats', 'whatKitKnows', 'nextBuy'];
const mapBlock = (prompt: string): string | null => /<appmap>\n?([\s\S]*?)\n?<\/appmap>/.exec(prompt)?.[1] ?? null;

describe('KC1.1 · the limits Kit is told, and the examples that obey them', () => {
  it('KC1.1 · examples obey the cut: every one of the ten comes back from cutAnswer unchanged', () => {
    expect(EXAMPLES).toHaveLength(10);
    const DRAWN = new Set(['outfit', 'options', 'colors', 'add', 'changed', 'buy']);
    let withCards = 0;
    for (const e of EXAMPLES) {
      const card = (JSON.parse(e.block) as { card: { type: string } | null }).card;
      const withCard = !!card && DRAWN.has(card.type);
      if (withCard) withCards++;
      expect([e.q, cutAnswer(e.a, withCard)]).toEqual([e.q, e.a.trim()]);
    }
    // the ten hold drawn cards: the first example (outfit) and the buy example; the link example is not one
    expect(withCards).toBe(2);
  });

  it('KC1.1 · the rules say the new shape: first line of 15 words, 40 words with a card, 60 without', () => {
    expect(ANSWER_RULES).toMatch(/15 words or fewer/);
    expect(ANSWER_RULES).toMatch(/40 words/);
    expect(ANSWER_RULES).toMatch(/60 words/);
    expect(ANSWER_RULES).not.toMatch(/70 words at most/);
    expect(ANSWER_RULES).not.toMatch(/two or three sentences in all/);
  });
});

describe('KC6.1 · app map', () => {
  it('KC6.1 · app map: with no switches on, exactly the eight always-there places, in order', () => {
    expect(idsOf(NO_SWITCHES)).toEqual(BASE_IDS);
    const text = appMap(NO_SWITCHES);
    for (const word of [t('tab.stylist'), t('tab.closet'), t('tab.lookbook'), t('tab.you'), 'Past chats', 'What Kit knows', 'Lookbook']) {
      expect([word, text.includes(word)]).toEqual([word, true]);
    }
    const nextBuy = appMapLines(NO_SWITCHES).find((l) => l.id === 'nextBuy')!;
    expect(nextBuy.text).toContain("Ask me what to buy next, and I'll show it here.");
    expect(nextBuy.text).toMatch(/no screen of its own/i);
    expect(nextBuy.text).toMatch(/only home/i);
    expect(NEXT_BUY_LINE).toBe("Ask me what to buy next, and I'll show it here.");
  });

  it('KC6.1 · app map: a switched-off screen is never named', () => {
    const text = appMap(NO_SWITCHES);
    expect(text).not.toMatch(/Outfits|Next best buy|Goes with/);
    expect(text).not.toMatch(/\bPro\b|Try Pro|paywall/i);
    expect(text).not.toMatch(/\bShare\b/);
    expect(text).not.toMatch(/sign in|Apple|Google|back ?up/i);
    expect(text).not.toMatch(/Notifications/i);
  });

  it('KC6.1 · app map: the text is one "- " line per entry, no heading, no fence', () => {
    for (const sw of [NO_SWITCHES, on('outfits'), { outfits: true, share: true, paywall: true, accounts: true, notifications: true }]) {
      expect(appMap(sw)).toBe(appMapLines(sw).map((l) => `- ${l.text}`).join('\n'));
      for (const l of appMapLines(sw)) expect(l.text.trim()).not.toBe('');
      expect(appMap(sw)).not.toMatch(/```|<appmap>|^#/m);
    }
  });

  it.each([
    ['outfits', 'outfits', [/Outfits/, /Next best buy/]],
    ['share', 'share', [/\bShare\b/]],
    ['paywall', 'plan', [/\bFree\b/, /\bPro\b/]],
    ['accounts', 'account', [/sign in/i, /back ?up/i]],
    ['notifications', 'notifications', [/Notifications/, /Settings/]],
  ] as const)('KC6.1 · app map: the %s switch alone adds exactly "%s" and its words', (sw, id, words) => {
    const ids = idsOf(on(sw));
    expect([...ids].sort()).toEqual([...BASE_IDS, id].sort());
    expect(ids.filter((i) => i !== id)).toEqual(BASE_IDS); // the rest keep their order
    const line = appMapLines(on(sw)).find((l) => l.id === id)!;
    for (const re of words) expect([id, re.test(line.text)]).toEqual([id, true]);
  });

  it('KC6.1 · app map: with Outfits on, the next-buy line names Closet\'s Outfits view and no longer calls the buy card its only home', () => {
    const nextBuy = appMapLines(on('outfits')).find((l) => l.id === 'nextBuy')!;
    expect(nextBuy.text).toMatch(/Closet/);
    expect(nextBuy.text).toMatch(/Outfits/);
    expect(nextBuy.text).not.toMatch(/only home/i);
    expect(nextBuy.text).not.toMatch(/no screen of its own/i);
  });

  it('KC6.1 · app map: the system prompt holds the map for all 11 kinds, after the closing format, and two calls are identical', () => {
    expect(KINDS).toHaveLength(11);
    for (const sw of [NO_SWITCHES, on('outfits')]) {
      for (const kind of KINDS) {
        const p = systemPrompt(kind, sw);
        expect([kind, mapBlock(p)]).toEqual([kind, appMap(sw)]);
        expect(p.indexOf('<appmap>')).toBeGreaterThan(p.indexOf(CLOSING_FORMAT));
        expect(systemPrompt(kind, sw)).toBe(p); // a cached prefix: the same twice
      }
    }
    expect(systemPrompt('buyNext')).toBe(systemPrompt('buyNext', NO_SWITCHES));
  });

  it('KC6.1 · app map: only the map changes with the switches (rules, examples and guide are the same)', () => {
    const strip = (p: string) => p.replace(/<appmap>[\s\S]*?<\/appmap>/, '<appmap/>');
    for (const kind of KINDS) {
      expect(systemPrompt(kind, on('outfits'))).not.toBe(systemPrompt(kind, NO_SWITCHES));
      expect(strip(systemPrompt(kind, on('outfits')))).toBe(strip(systemPrompt(kind, NO_SWITCHES)));
    }
  });

  it('KC6.1 · the prompt version is 7 (T106 changed the remember keys)', () => {
    expect(PROMPT_VERSION).toBe(7);
  });
});

describe('KC6.2 · the rule', () => {
  it('KC6.2 · the rule: answer from the map only, say you do not know a place that is not in it, never invent one', () => {
    expect(ANSWER_RULES).toMatch(/only[^.\n]*<appmap>/i);
    expect(ANSWER_RULES).toMatch(/(?:don't|do not) know of/i);
    expect(ANSWER_RULES).toMatch(/never invent a screen, section or button/i);
  });

  it('KC1.4 · the rule: never say you cannot add, change or show; never say you did', () => {
    expect(ANSWER_RULES).toMatch(/can'?t add a piece, change a piece or show an outfit/i);
    expect(ANSWER_RULES).toMatch(/never say you added or changed/i);
  });

  it('KC3.3 · KC3.5 · the rule: name only the allowed colors; never tie a color to his skin, face, hair or eyes', () => {
    expect(ANSWER_RULES).toMatch(/<evidence>[^.\n]*allowed colors/i);
    expect(ANSWER_RULES).toMatch(/name only those plus the colors of his own pieces/i);
    expect(ANSWER_RULES).toMatch(/never tie a color to his skin, face, hair or eyes/i);
    expect(ANSWER_RULES).toContain('I rate outfits, never people.');
  });

  it('KC6.3 · the rule: the pack lists the cards shown today and Kit never contradicts them', () => {
    expect(ANSWER_RULES).toMatch(/<pack>[^.\n]*cards you showed him today/i);
    expect(ANSWER_RULES).toMatch(/never contradict them/i);
  });
});

declare const __dirname: string;
const { readFileSync } = jest.requireActual<{ readFileSync(p: string, enc: 'utf8'): string }>('fs');
const { join } = jest.requireActual<{ join(...p: string[]): string }>('path');

/** A small fixed hash (FNV-1a over the text, trimmed): enough to see that a section was not touched. */
function fnv(text: string): string {
  const s = text.trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

describe('KC6.5 · the guide', () => {
  const guideFile = readFileSync(join(__dirname, '../../../rubric/stylist-guide.md'), 'utf8');

  it('KC6.5 · the guide: the bundled copy equals rubric/stylist-guide.md byte for byte', () => {
    expect(STYLIST_GUIDE).toBe(guideFile);
  });

  it('KC6.5 · the guide: "Words that mean something" is in section 0 for every kind, with the knit and woven lists', () => {
    for (const kind of KINDS) {
      const bullet = guideFor(kind).split('\n').find((l) => l.startsWith('- **Words that mean something**'));
      expect([kind, bullet === undefined]).toEqual([kind, false]);
      const knit = /\bknit \(([^)]+)\)/.exec(bullet!)?.[1] ?? '';
      const woven = /\bwoven \(([^)]+)\)/.exec(bullet!)?.[1] ?? '';
      for (const piece of ['sweater', 'cardigan', 'knit polo', 'tee', 'hoodie', 'sweatshirt']) expect([kind, 'knit', piece, knit.includes(piece)]).toEqual([kind, 'knit', piece, true]);
      for (const piece of ['oxford', 'button-ups', 'overshirt', 'chinos', 'jeans', 'trousers']) expect([kind, 'woven', piece, woven.includes(piece)]).toEqual([kind, 'woven', piece, true]);
      // the lists never swap: no woven piece in the knit list and no knit piece in the woven list
      for (const piece of ['oxford', 'overshirt', 'chinos', 'jeans', 'trousers']) expect(knit.includes(piece)).toBe(false);
      for (const piece of ['sweater', 'cardigan', 'hoodie', 'sweatshirt']) expect(woven.includes(piece)).toBe(false);
      expect(bullet).toContain('Never call a knit woven or a woven a knit.');
    }
  });

  it('KC6.5 · the guide: layering no longer says a smooth layer over a knit; it says a woven layer over a knit', () => {
    const layering = guideSections().get(7)!;
    expect(layering).not.toContain('a smooth layer over a knit');
    expect(layering).toContain('a woven layer (an overshirt or a jacket) over a knit');
    expect(guideFile).not.toContain('a smooth layer over a knit');
  });

  it('KC6.5 · the guide: no (scored…) or (tip) mark is added or removed, and the other sections are as they were', () => {
    expect((guideFile.match(/\*\*\(scored\b[^)]*\)\*\*/g) ?? []).length).toBe(22);
    expect((guideFile.match(/\*\*\(tip\b[^)]*\)\*\*/g) ?? []).length).toBe(5);
    const sec = guideSections();
    const was: Record<number, string> = { 1: 'acff30d0', 2: '0ae90037', 3: 'a592ee96', 4: 'e0a97c63', 5: 'f0158515', 6: 'fe521bd3', 8: 'aa08f059', 9: '0dc249be', 10: 'cae7afe4', 11: '468a8553', 12: '6a526fca', 14: 'a7fddbc6' };
    for (const [n, hash] of Object.entries(was)) expect([n, fnv(sec.get(Number(n)) ?? '')]).toEqual([n, hash]);
    // the sections the task edits: 0 (new bullets), 7 (one phrase), 13 (the shop bullet) still exist
    for (const n of [0, 7, 13]) expect(sec.has(n)).toBe(true);
  });
});

describe('KC8.2 · the shop line', () => {
  it('KC8.2 · the shop line: word for word, in the guide section 0 for every kind and in section 13', () => {
    expect(SHOP_LINE).toBe("I don't point to shops, but here's what to look for:");
    for (const kind of KINDS) expect([kind, guideFor(kind).includes(SHOP_LINE)]).toEqual([kind, true]);
    expect(guideSections().get(0)).toContain(SHOP_LINE);
    expect(guideSections().get(13)).toContain(SHOP_LINE);
  });

  it('KC8.2 · the shop line: the rules say it, then one or two specifics, and a buy or options card', () => {
    expect(ANSWER_RULES).toContain(SHOP_LINE);
    expect(ANSWER_RULES).toMatch(/one or two specifics/i);
    expect(ANSWER_RULES).toMatch(/buy or options card/i);
    expect(ANSWER_RULES).toMatch(/never a brand, a shop, a link or the price of a product/i);
  });

  it('KC8.2 · the shop line: the gate lets the line and a specific through, and the guide\'s shop bullets name no brand or shop', () => {
    expect(checkSentence(`${SHOP_LINE} a cotton or canvas overshirt, straight hem.`, { allowedScores: new Set<string>() })).toBeNull();
    expect(SHOP_LINE).not.toBe('');
    for (const section of [guideSections().get(0)!, guideSections().get(13)!]) {
      const bullets = section.split('\n').filter((l) => l.includes(SHOP_LINE));
      expect(bullets.length).toBeGreaterThan(0);
      for (const b of bullets) for (const s of sentences(b)) expect([s, checkSentence(s, { allowedScores: new Set<string>() }) === 'brand']).toEqual([s, false]);
    }
  });
});
