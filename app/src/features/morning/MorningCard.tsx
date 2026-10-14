// The morning/evening card (02 "S1d", DECISIONS-LOG #58–62).
// Full while it's the current window and nothing's been checked; collapsed to one row once a fit
// check lands in its window (with the score), when he's staying in, or once its window has passed.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { localParts, type DayWeather, type IdeaReason, type MissingSlot } from '@kitted/core';
import {
  Icon, KButton, KCard, KCardSection, KText, MonoLabel, MorphPicker, NeckDownPhoto, TextLink, displayScore, opacity, radius, scoreWordLabel, space, useTheme,
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
import { isNwsWeather, weatherSource } from '@/services/weather';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { badgeTemps, cardOccasionLabel, ideaTitle, missingLabel, styleLabel, weatherSymbol, whyLine } from './copy';
import { morning } from './index';
import { checkInSlot, slotAt } from './service';
import { pickSwap } from './swapPicker';
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
  current: boolean;
  checkUsed: boolean;
  permission: 'granted' | 'denied' | 'unknown';
  myStyles: StyleKey[];
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
    row, items, known, missing: details.missing ?? null, missingSlots, reasons: details.reasons ?? [], piecesKnown: closet.length, check,
    current: cur.day === row.dayKey && cur.slot === row.slot,
    checkUsed: !snap.pro && snap.checksUsed >= snap.checkLimit,
    permission: await weatherSource.permission(),
    myStyles: Array.from(new Set(myStyles)),
  };
}

export function MorningCard({ ideaId }: { ideaId: string }) {
  const m = useLive(['dailyIdeas', 'outfits', 'closet', 'fitChecks', 'usage', 'kv', 'chat', 'profile'], () => load(ideaId), [ideaId]);
  if (!m) return null;
  if (m.check) return <CheckedRow m={m} />;
  if (m.row.state === 'stayingIn') return <StayingInRow m={m} />;
  if (!m.current) return <PastRow m={m} />;
  return <FullCard m={m} />;
}

/** The hero-strip card (#70, the Apple-native direction the founder picked): the outfit edge to
 *  edge on top, a headline with a small weather badge, one context line ("Class ⌄ · Smart casual ⌄"),
 *  the reason, one primary action per state, and a one-line camera link. */
function FullCard({ m }: { m: Model }) {
  const { isAccessibilitySize } = useTheme();
  const { row } = m;
  const evening = row.slot === 'evening';
  const weather = row.weather as unknown as DayWeather | null;
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
  const swap = () => pickSwap(m.items, (id) => void morning.swap(row.id, [id]));
  const allow = async () => {
    if ((await weatherSource.requestPermission()) === 'granted') await morning.refreshWeather(row.id);
  };

  const wearing = row.state === 'wearing';
  const title = enough
    ? ideaTitle(m.reasons, row.occasion)
    : m.piecesKnown === 0 ? t('idea.title.empty') : m.piecesKnown === 1 ? t('idea.title.thin1') : t('idea.title.thin', { n: m.piecesKnown });
  const why = enough
    ? whyLine(m.reasons, m.items, row.occasion)
    : m.piecesKnown === 0 ? t('idea.empty') : m.piecesKnown === 1 ? t('idea.thin1') : t('idea.thinN', { n: m.piecesKnown });
  const needs: MissingSlot[] = enough ? (m.missing ? [m.missing] : []) : m.piecesKnown === 0 ? ['top', 'bottom', 'shoes'] : m.missingSlots;
  const showLink = enough && !wearing;

  return (
    <KCard>
      <HeroStrip items={enough ? m.items : m.known} needs={needs} />
      <KCardSection>
        <View style={{ gap: space.xs }}>
          <View style={isAccessibilitySize ? { gap: space.xs } : { flexDirection: 'row', alignItems: 'baseline', gap: space.s }}>
            <KText variant="title3" weight="600" style={{ flex: isAccessibilitySize ? undefined : 1 }} accessibilityRole="header">
              {title}
            </KText>
            {weather ? <WeatherBadge w={weather} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s }}>
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
            {weather ? (
              // Where the weather came from: live NWS, or sample weather (never passed off as real).
              <KText variant="caption" color="ink3" style={{ marginLeft: 'auto' }}>
                {isNwsWeather(weather) ? t('wx.nws') : t('wx.sample')}
              </KText>
            ) : null}
          </View>
        </View>
        {!weather && m.permission === 'unknown' && weatherSource.kind !== 'none' ? <LocationAsk onAllow={() => void allow()} /> : null}
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
            <View style={{ flexDirection: 'row' }}>
              <TextLink title={`${evening ? t('idea.own.linkEvening') : t('idea.own.link')} ›`} onPress={openCamera} compact accessibilityHint={t('own.a11yHint')} />
            </View>
          )
        ) : null}
      </KCardSection>
    </KCard>
  );
}

/** The outfit, edge to edge across the top of the card: equal tiles with 1 pt hairline gaps, no
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
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 1, backgroundColor: colors.line, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, overflow: 'hidden' }}
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

/** "☂ 46°→63°": the weather at a glance; the greeting above says it in words (#70). */
function WeatherBadge({ w }: { w: DayWeather }) {
  const { now, later } = badgeTemps(w);
  return (
    <View accessible accessibilityLabel={t('idea.badge.a11y', { now, later })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <Icon name={weatherSymbol(w) as never} size={15} color="ink2" />
      <KText variant="subheadline" weight="500" color="ink2" style={{ fontVariant: ['tabular-nums'] }}>
        {`${now}°→${later}°`}
      </KText>
    </View>
  );
}

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
function CheckedRow({ m }: { m: Model }) {
  const { latest, first, messageId } = m.check!;
  const photo = shownPhoto(first.demoPhotoId, first.photoFile, undefined);
  const score = latest.score ?? 0;
  const what = m.row.state === 'wearing' ? t('idea.went.pick') : t('idea.went.own');
  const occasion = cardOccasionLabel(m.row.occasion);
  return (
    <CollapsedShell
      onPress={messageId ? () => setStylistAction({ kind: 'scrollTo', messageId }) : undefined}
      a11y={t('idea.a11y.collapsed', { when: whenLabel(m.row), occasion, what, score: displayScore(score), word: scoreWordLabel(score) })}
      left={photo ? <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={44} height={56} borderRadii={{ tl: radius.thumb, tr: radius.thumb, br: radius.thumb, bl: radius.thumb }} /> : null}
      tag={`${whenLabel(m.row)} · ${occasion}`}
      title={what}
      right={
        <View style={{ alignItems: 'flex-end' }}>
          <KText variant="title2" weight="700">
            {displayScore(score)}
          </KText>
          <KText variant="footnote" color="ink2">
            {scoreWordLabel(score)}
          </KText>
        </View>
      }
    />
  );
}

function StayingInRow({ m }: { m: Model }) {
  return (
    <CollapsedShell
      tag={whenLabel(m.row)}
      title={t('idea.stayingIn')}
      a11y={`${whenLabel(m.row)}: ${t('idea.stayingIn')}`}
      right={
        <MorphPicker
          label={cardOccasionLabel(m.row.occasion)}
          value={m.row.occasion}
          sections={[{ options: EVENING_CARD_OCCASIONS.map((o) => ({ value: o, label: cardOccasionLabel(o) })) }]}
          onPick={(o) => void morning.change(m.row.id, { occasion: o })}
          accessibilityLabel={t('idea.a11y.occasion', { occasion: cardOccasionLabel(m.row.occasion) })}
        />
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
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.cardPadH, paddingVertical: space.cardPadV }}>
      {left}
      <View style={{ flex: 1, gap: space.xs }}>
        <MonoLabel>{tag}</MonoLabel>
        {title ? (
          <KText variant="subheadline" weight="600">
            {title}
          </KText>
        ) : null}
        {body}
      </View>
      {right}
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
