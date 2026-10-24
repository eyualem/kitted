// The morning/evening card (02 "S1d", DECISIONS-LOG #58–62).
// Full while it's the current window and nothing's been checked; collapsed to one row once a fit
// check lands in its window (with the score), when he's staying in, or once its window has passed.
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { localParts, type IdeaReason, type MissingSlot } from '@kitted/core';
import {
  Icon, KButton, KCard, KCardSection, KText, MonoLabel, MorphPicker, NeckDownPhoto, Numeral, TextLink, displayScore, opacity, radius, scoreWordLabel, space, useTheme,
} from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import {
  DAY_CARD_OCCASIONS, EVENING_CARD_OCCASIONS, normStyleKey, STYLES,
  type CardOccasion, type ClosetItemRow, type DailyIdeaRow, type FitCheckRow, type StyleKey,
} from '@/data/types';
import { shownPhoto } from '@/demo/demoPhotos';
import { quota } from '@/features/fitcheck/session';
import { OutfitTiles } from '@/features/stylist/cards/OutfitTiles';
import { showToast } from '@/features/toast/toast';
import { setStylistAction } from '@/router/stylistAction';
import { isLiveWeather, isWeatherKitWeather, weatherSource } from '@/services/weather';
import { weatherKitLegalUrl } from '../../../modules/kitted-location';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { cardGreeting, cardOccasionLabel, ideaTitle, missingLabel, seasonLine, styleLabel, updatedLine, weatherLine, weatherSymbol, whyLine, type CardWeather } from './copy';
import { morning } from './index';
import { checkInSlot, slotAt } from './service';
import { locationRow } from './locationRow';
import { pickSwap } from './swapPicker';
import { woreThePick } from './woreOwn';
import { creditLine, ownFitCredit } from './ownFitCredit';
import { PieceArt } from '@/features/closet/GarmentArt';

interface Model {
  row: DailyIdeaRow;
  items: ClosetItemRow[];
  /** Thin closet: what he has, and what's still missing. */
  known: ClosetItemRow[];
  missing: MissingSlot | null;
  missingSlots: MissingSlot[];
  reasons: IdeaReason[];
  piecesKnown: number;
  /** The check in this card's window (latest re-check folded in), and its card message. */
  check: { first: FitCheckRow; latest: FitCheckRow; messageId: string | null } | null;
  /** After Wear this, the check shows the pick (else he went with his own, #369). */
  worePick: boolean;
  current: boolean;
  checkUsed: boolean;
  permission: 'granted' | 'denied' | 'unknown';
  myStyles: StyleKey[];
  /** "Updated for your olive fleece.": re-planned after he corrected one of its pieces (09-ui-review §26, #365). */
  updated: string | null;
  /** "Your olive overshirt was in Tuesday's 8.0.": his own 8+ fit shares a piece with this card (#370). */
  credit: string | null;
}

async function load(ideaId: string): Promise<Model | null> {
  const row = await store.dailyIdeas.get(ideaId);
  if (!row) return null;
  const zone = sessionClock.offset;
  const closet = (await store.closet.all()).filter((c) => !c.isDeleted);
  const outfit = row.outfitId ? await store.outfits.get(row.outfitId) : null;
  const items = (outfit?.itemIds ?? []).map((id) => closet.find((c) => c.id === id)).filter((c): c is ClosetItemRow => !!c);
  const details = (outfit?.details ?? {}) as { missing?: MissingSlot | null; reasons?: IdeaReason[] };
  const checks = (await store.fitChecks.all()).filter((c) => c.status === 'scored' && c.score !== null);
  const first = checks.filter((c) => !c.parentId && checkInSlot(c, row, zone)).sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  let check: Model['check'] = null;
  if (first) {
    const latest = checks.filter((c) => c.parentId === first.id).sort((a, b) => b.createdAt - a.createdAt)[0] ?? first;
    const msg = (await store.chat.all()).find((m) => m.kind === 'card' && m.fitCheckId === latest.id) ?? null;
    check = { first, latest, messageId: msg?.id ?? null };
  }
  // Merged-away pieces are kept as deleted rows; the match follows them, so read the whole closet.
  const allCloset = await store.closet.all();
  const worePick = !!check && row.state === 'wearing' && woreThePick(outfit?.itemIds ?? [], check.latest.itemIds, allCloset);
  let credit: string | null = null;
  if (outfit && !check) {
    const outfits = new Map((await store.outfits.all()).map((o) => [o.id, o.itemIds]));
    const c = ownFitCredit(
      { id: row.id, slot: row.slot, itemIds: items.map((i) => i.id) },
      { checks, ideas: await store.dailyIdeas.all(), closet: allCloset, itemsOf: (id) => outfits.get(id) ?? [] },
      zone,
    );
    credit = c ? creditLine(c, row, closet, zone) : null;
  }
  const known: ClosetItemRow[] = [];
  const missingSlots: MissingSlot[] = [];
  if (!outfit) {
    for (const slot of ['outer', 'top', 'bottom', 'shoes'] as const) {
      const it = closet.find((c) => c.slot === slot);
      if (it) known.push(it);
      else if (slot !== 'outer') missingSlots.push(slot);
    }
  }
  const now = sessionClock.nowMs();
  const cur = slotAt(now, zone);
  const snap = await quota.snapshot();
  const profile = await store.profile.get('me');
  const myStyles = Array.from(new Set((profile?.styles ?? []).map(([s]) => normStyleKey(s)).filter((s): s is StyleKey => s !== null)));
  return {
    row, items, known, missing: details.missing ?? null, missingSlots, reasons: details.reasons ?? [], piecesKnown: closet.length, check, worePick,
    current: cur.day === row.dayKey && cur.slot === row.slot,
    checkUsed: !snap.pro && snap.checksUsed >= snap.checkLimit,
    permission: await weatherSource.permission(),
    myStyles: Array.from(new Set(myStyles)),
    updated: outfit ? updatedLine(outfit, closet) : null,
    credit,
  };
}

/** `readOnly`: Past chats (#276; 09 §20.7 R9, #323): an earlier day's card can't be changed, and its checked row isn't a
 *  button (it asked today's thread to scroll, which pushed the same day's page again). */
export function MorningCard({ ideaId, readOnly = false }: { ideaId: string; readOnly?: boolean }) {
  const m = useLive(['dailyIdeas', 'outfits', 'closet', 'fitChecks', 'usage', 'kv', 'chat', 'profile'], () => load(ideaId), [ideaId]);
  if (!m) return null;
  if (m.check) return <CheckedRow m={m} readOnly={readOnly} />;
  if (m.row.state === 'stayingIn') return <StayingInRow m={m} readOnly={readOnly} />;
  if (!m.current) return <PastRow m={m} />;
  return <FullCard m={m} />;
}

/** The hero-strip card (#70), lightened (#338: "too much in the card", the text crammed): Kit's hello and one weather
 *  line said for the hour he reads it (#340: they open the card; no greeting bubble above it), the menus in a quiet row
 *  ("Class ⌄ · Smart casual ⌄"), the outfit edge to edge, the headline alone on its line, the reason, one primary action
 *  per state, and a small camera link. */
function FullCard({ m }: { m: Model }) {
  const { isAccessibilitySize } = useTheme();
  const { row } = m;
  const evening = row.slot === 'evening';
  const weather = row.weather as unknown as CardWeather | null;
  const now = localParts(sessionClock.nowMs(), sessionClock.offset);
  const hourNow = now.hh;
  const season = weather ? null : seasonLine(now.m);
  const enough = m.items.length > 0;
  const occasions = evening ? EVENING_CARD_OCCASIONS : DAY_CARD_OCCASIONS;
  const others = STYLES.filter((s) => !m.myStyles.includes(s));

  const openCamera = () =>
    router.push({ pathname: '/camera', params: { occasion: row.occasion === 'staying_in' ? 'home' : row.occasion, ...(row.style ? { style: row.style } : {}), from: 'morning' } });
  const changeOccasion = (o: CardOccasion) => void morning.change(row.id, { occasion: o });
  const changeStyle = async (s: StyleKey) => {
    const r = await morning.change(row.id, { style: s });
    if (r.samePick) showToast(t('why.idea.sameStyle', { style: styleLabel(s).toLowerCase() }));
  };
  const wear = async () => {
    const undo = await morning.wear(row.id);
    showToast(t('toast.logged'), undo);
  };
  // Nothing else works without that piece: the card keeps its outfit and says so (09 §23 M2).
  const swap = () =>
    pickSwap(m.items, (id) => {
      void morning.swap(row.id, [id]).then(({ swapped }) => {
        if (!swapped) showToast(t('swap.none'));
      });
    });
  const allow = async () => {
    if ((await weatherSource.requestPermission()) === 'granted') await morning.refreshWeather(row.id);
  };

  const locationAsk = locationRow({ permission: m.permission, hasWeather: !!weather, sourceKind: weatherSource.kind });
  const wearing = row.state === 'wearing';
  const title = enough
    ? ideaTitle(m.reasons, row.occasion)
    : m.piecesKnown === 0 ? t('idea.title.empty') : m.piecesKnown === 1 ? t('idea.title.thin1') : t('idea.title.thin', { n: m.piecesKnown });
  const why = enough
    ? [whyLine(m.reasons, m.items, row.occasion), m.credit].filter(Boolean).join(' ')
    : m.piecesKnown === 0 ? t('idea.empty') : m.piecesKnown === 1 ? t('idea.thin1') : t('idea.thinN', { n: m.piecesKnown });
  const needs: MissingSlot[] = enough ? (m.missing ? [m.missing] : []) : m.piecesKnown === 0 ? ['top', 'bottom', 'shoes'] : m.missingSlots;
  const showLink = enough && !wearing;

  return (
    <KCard>
      {/* The card opens with Kit's hello and the weather (founder, Oct 18, #340: no greeting bubble above it), then the
          menus. Said for the hour he reads it. */}
      <View style={{ paddingHorizontal: space.cardPadH, paddingTop: space.cardPadV, paddingBottom: space.s, gap: space.xs }}>
        <KText variant="headline" weight="600">
          {cardGreeting(row.slot, hourNow)}
        </KText>
        {weather ? <WeatherLine w={weather} /> : season ? (
          <KText variant="footnote" color="ink2">
            {season}
          </KText>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: space.s, paddingHorizontal: space.cardPadH, paddingBottom: space.s }}>
        <MorphPicker
          inline
          label={cardOccasionLabel(row.occasion)}
          value={row.occasion}
          sections={[{ options: occasions.map((o) => ({ value: o, label: cardOccasionLabel(o) })) }]}
          onPick={changeOccasion}
          accessibilityLabel={t('idea.a11y.occasion', { occasion: cardOccasionLabel(row.occasion) })}
        />
        <KText variant="subheadline" color="ink3">
          ·
        </KText>
        <MorphPicker
          inline
          label={styleLabel(row.style)}
          value={row.style ?? 'none'}
          sections={[
            ...(m.myStyles.length ? [{ title: t('style.menu.yours'), options: m.myStyles.map((s) => ({ value: s, label: styleLabel(s) })) }] : []),
            { title: m.myStyles.length ? t('style.menu.more') : undefined, options: others.map((s) => ({ value: s, label: styleLabel(s) })) },
          ]}
          onPick={(s) => s !== 'none' && void changeStyle(s as StyleKey)}
          accessibilityLabel={t('idea.a11y.style', { style: styleLabel(row.style) })}
        />
      </View>
      <HeroStrip items={enough ? m.items : m.known} needs={needs} />
      <KCardSection>
        <KText variant="title3" weight="600" accessibilityRole="header">
          {title}
        </KText>
        {m.updated ? (
          <KText variant="footnote" color="ink3">
            {m.updated}
          </KText>
        ) : null}
        {locationAsk === 'ask' ? <LocationAsk onAllow={() => void allow()} /> : null}
        {locationAsk === 'settings' ? (
          // Denied once: only Settings can turn it back on (09 §23 M4). A quiet link, never a nag.
          <View style={{ alignSelf: 'flex-start' }}>
            <TextLink title={t('wx.off.link')} color="ink2" compact accessibilityHint={t('wx.off.a11yHint')} onPress={() => void Linking.openSettings()} />
          </View>
        ) : null}
        <KText variant="subheadline" color="ink2">
          {why}
        </KText>
        {wearing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
            <Icon name="check" size="small" color="ink2" weight="semibold" />
            <KText variant="footnote" color="ink2">
              {t('idea.logged')}
            </KText>
          </View>
        ) : null}
        {enough && !wearing ? (
          <View style={isAccessibilitySize ? { gap: space.rowGap } : { flexDirection: 'row', gap: space.rowGap }}>
            <KButton title={t('idea.wear')} size="regular" fullWidth={isAccessibilitySize} style={isAccessibilitySize ? undefined : { flex: 1 }} onPress={() => void wear()} />
            <KButton title={t('idea.swapShort')} size="regular" kind="secondary" fullWidth={isAccessibilitySize} onPress={swap} accessibilityLabel={t('idea.swap')} />
          </View>
        ) : (
          <KButton title={wearing ? t('idea.checkItOn') : t('idea.checkFit')} icon="camera" size="regular" fullWidth onPress={openCamera} />
        )}
        {showLink ? (
          m.checkUsed ? (
            <KText variant="footnote" color="ink3">
              {t('own.limit')}
            </KText>
          ) : (
            // A quiet line, not a third button (#338): the composer's camera does the same.
            <Pressable
              onPress={openCamera}
              accessibilityRole="button"
              accessibilityLabel={evening ? t('idea.own.linkEvening') : t('idea.own.link')}
              accessibilityHint={t('own.a11yHint')}
              hitSlop={{ top: 12, bottom: 12 }}
              style={({ pressed }) => ({ alignSelf: 'flex-start', opacity: pressed ? opacity.pressed : 1 })}
            >
              <KText variant="footnote" weight="500" color="ink2">
                {`${evening ? t('idea.own.linkEvening') : t('idea.own.link')} ›`}
              </KText>
            </Pressable>
          )
        ) : null}
      </KCardSection>
    </KCard>
  );
}

/** The outfit, edge to edge across the card under the menus: equal tiles with 1 pt hairline gaps, no
 *  labels (each tile is labelled for VoiceOver), dashed "+" tiles for what's missing. 2×2 at AX sizes. */
function HeroStrip({ items, needs }: { items: readonly ClosetItemRow[]; needs: readonly MissingSlot[] }) {
  const { colors, isAccessibilitySize } = useTheme();
  const [w, setW] = useState(0);
  const count = items.length + needs.length;
  if (count === 0) return null;
  const cols = isAccessibilitySize ? 2 : count;
  const tileW = w > 0 ? (w - (cols - 1)) / cols : 0;
  const tileH = Math.min(Math.round(tileW * 1.05), 120);
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1, backgroundColor: colors.line }}
    >
      {tileW > 0
        ? [
            ...items.map((it) => (
              <View key={it.id} accessible accessibilityLabel={t('idea.tile.a11y', { name: it.name })} style={{ width: tileW, height: tileH, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <PieceArt item={it} size={Math.round(Math.min(tileW, tileH) * 0.84)} />
              </View>
            )),
            ...needs.map((n) => (
              <View key={`need-${n}`} accessible accessibilityLabel={missingLabel(n)} style={{ width: tileW, height: tileH, backgroundColor: colors.surface2, padding: space.s }}>
                <View style={{ flex: 1, borderRadius: 14, borderCurve: 'continuous', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inkFaint, alignItems: 'center', justifyContent: 'center', gap: space.xs }}>
                  <Icon name="plus" size="small" color="ink3" />
                  <KText variant="caption" color="ink3" numberOfLines={1}>
                    {missingLabel(n)}
                  </KText>
                </View>
              </View>
            )),
          ]
        : null}
    </View>
  );
}

/** One weather line for the hour he reads it (#338): "☂ 52° at 8 pm · 47° by midnight · rain likely", and "Sample" at
 *  the end on sample weather (never passed off as real). Live weather names its source in the a11y label: the National
 *  Weather Service, or Apple Weather, whose mark and "Data sources" link show under the line (WeatherKit's terms; 02
 *  "S1d" item 7; #366, only while the paid-team switch is on). */
function WeatherLine({ w }: { w: CardWeather }) {
  const { fontScale } = useTheme();
  const line = weatherLine(w, localParts(sessionClock.nowMs(), sessionClock.offset).hh);
  const sample = !isLiveWeather(w);
  const apple = isWeatherKitWeather(w);
  return (
    <View style={{ gap: space.xs }}>
      <View
        accessible
        accessibilityLabel={`${line}. ${sample ? t('wx.card.sample.a11y') : apple ? t('wx.apple') : t('wx.nws')}`}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.xs }}
      >
        {/* On the first line, growing with the text (at the largest size a fixed 14 pt icon floated mid-paragraph). */}
        <View style={{ paddingTop: 2 * Math.min(fontScale, 2) }}>
          <Icon name={weatherSymbol(w) as never} size={14} color="ink2" scalesWithText />
        </View>
        <KText variant="footnote" color="ink2" style={{ flexShrink: 1, fontVariant: ['tabular-nums'] }}>
          {line}
          {sample ? (
            <KText variant="footnote" color="ink3">
              {`  ${t('wx.card.sample')}`}
            </KText>
          ) : null}
        </KText>
      </View>
      {apple ? <AppleWeatherMark /> : null}
    </View>
  );
}

/** Apple's Weather mark and the link to its legal attribution page (the page WeatherKit names, else Apple's own). */
function AppleWeatherMark() {
  const open = async () => {
    const url = (await weatherKitLegalUrl()) ?? APPLE_WEATHER_LEGAL;
    void Linking.openURL(url);
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, flexWrap: 'wrap' }}>
      <View accessible accessibilityLabel={t('wx.apple')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Icon name={'apple.logo' as never} size={12} color="ink3" scalesWithText />
        <KText variant="caption" color="ink3">
          {t('wx.attribution')}
        </KText>
      </View>
      <TextLink title={t('wx.sources')} color="ink2" compact onPress={() => void open()} />
    </View>
  );
}

/** WeatherKit's legal attribution page, when the service doesn't hand one back. */
const APPLE_WEATHER_LEGAL = 'https://weatherkit.apple.com/legal-attribution.html';

function LocationAsk({ onAllow }: { onAllow: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, backgroundColor: colors.surface2, borderRadius: radius.thumb, borderCurve: 'continuous', paddingVertical: space.s, paddingLeft: space.m, paddingRight: space.s }}>
      <Icon name="location" color="ink2" />
      <View style={{ flex: 1 }}>
        <KText variant="subheadline" weight="600">
          {t('wx.ask.title')}
        </KText>
        <KText variant="footnote" color="ink2">
          {t('wx.ask.body')}
        </KText>
      </View>
      <TextLink title={t('wx.ask.allow')} onPress={onAllow} />
    </View>
  );
}

function whenLabel(row: DailyIdeaRow): string {
  return row.slot === 'evening' ? t('idea.tonight') : t('idea.today');
}

/** After a fit check in this window: photo · "You went with your own" · the score (#59). */
function CheckedRow({ m, readOnly }: { m: Model; readOnly: boolean }) {
  const { latest, first, messageId } = m.check!;
  const photo = shownPhoto(first.demoPhotoId, first.photoFile, undefined);
  const score = latest.score ?? 0;
  const what = m.worePick ? t('idea.went.pick') : t('idea.went.own');
  const occasion = cardOccasionLabel(m.row.occasion);
  return (
    <CollapsedShell
      onPress={messageId && !readOnly ? () => setStylistAction({ kind: 'scrollTo', messageId }) : undefined}
      a11y={t('idea.a11y.collapsed', { when: whenLabel(m.row), occasion, what, score: displayScore(score), word: scoreWordLabel(score) })}
      left={photo ? <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={44} height={56} borderRadii={{ tl: radius.thumb, tr: radius.thumb, br: radius.thumb, bl: radius.thumb }} /> : null}
      tag={`${whenLabel(m.row)} · ${occasion}`}
      title={what}
      right={
        <View style={{ alignItems: 'flex-end' }}>
          {/* Archivo, like every score (#276). */}
          <Numeral size={24} trimDescender={false}>{displayScore(score)}</Numeral>
          <KText variant="footnote" color="ink2">
            {scoreWordLabel(score)}
          </KText>
        </View>
      }
    />
  );
}

function StayingInRow({ m, readOnly }: { m: Model; readOnly: boolean }) {
  const occasion = cardOccasionLabel(m.row.occasion);
  return (
    <CollapsedShell
      tag={whenLabel(m.row)}
      title={t('idea.stayingIn')}
      a11y={readOnly ? `${whenLabel(m.row)}: ${t('idea.stayingIn')}, ${occasion}` : `${whenLabel(m.row)}: ${t('idea.stayingIn')}`}
      right={
        readOnly ? (
          <KText variant="subheadline" color="ink2">
            {occasion}
          </KText>
        ) : (
          <MorphPicker
            label={occasion}
            value={m.row.occasion}
            sections={[{ options: EVENING_CARD_OCCASIONS.map((o) => ({ value: o, label: cardOccasionLabel(o) })) }]}
            onPick={(o) => void morning.change(m.row.id, { occasion: o })}
            accessibilityLabel={t('idea.a11y.occasion', { occasion })}
          />
        )
      }
    />
  );
}

/** An earlier day's (or the other window's) card: small tiles and what happened. */
function PastRow({ m }: { m: Model }) {
  const day = weekdayName(localParts(Date.parse(`${m.row.dayKey}T12:00:00Z`), () => 0).dow);
  const label = m.row.state === 'wearing' ? t('idea.past.wore', { day }) : t('idea.past.skipped', { day });
  return (
    <CollapsedShell
      tag={label}
      a11y={label}
      body={m.items.length ? <OutfitTiles items={m.items} compact /> : null}
    />
  );
}

function CollapsedShell({ tag, title, left, right, body, onPress, a11y }: { tag: string; title?: string; left?: React.ReactNode; right?: React.ReactNode; body?: React.ReactNode; onPress?: () => void; a11y: string }) {
  const { isAccessibilitySize } = useTheme();
  // A tappable row says so (#276): it scrolls to the check it summarizes.
  const chevron = onPress ? <Icon name="next" size={13} color="ink3" weight="semibold" /> : null;
  // At the accessibility sizes the photo, the words and the score in one row left the words a sliver, broken mid-word
  // ("wen / t"): photo · score · chevron on one row, the words full width under it (07 §20).
  const stacked = isAccessibilitySize && Boolean(left || right || chevron);
  const words = (
    <View style={{ flex: stacked ? undefined : 1, gap: space.xs }}>
      <MonoLabel>{tag}</MonoLabel>
      {title ? (
        <KText variant="subheadline" weight="600">
          {title}
        </KText>
      ) : null}
      {body}
    </View>
  );
  const pad = { paddingHorizontal: space.cardPadH, paddingVertical: space.cardPadV };
  const content = stacked ? (
    <View style={[pad, { gap: space.s }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
        {left}
        <View style={{ flex: 1 }} />
        {right}
        {chevron}
      </View>
      {words}
    </View>
  ) : (
    <View style={[pad, { flexDirection: 'row', alignItems: 'center', gap: space.m }]}>
      {left}
      {words}
      {right}
      {chevron}
    </View>
  );
  return (
    <KCard>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} style={({ pressed }) => ({ opacity: pressed ? opacity.pressed : 1 })}>
          {content}
        </Pressable>
      ) : (
        <View accessible={!right} accessibilityLabel={right ? undefined : a11y}>
          {content}
        </View>
      )}
    </KCard>
  );
}
