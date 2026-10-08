// The morning/evening card (02 "S1d", DECISIONS-LOG #58–62).
// Full while it's the current window and nothing's been checked; collapsed to one row once a fit
// check lands in its window (with the score), when he's staying in, or once its window has passed.
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { localParts, type DayWeather, type IdeaReason, type MissingSlot } from '@kitted/core';
import {
  Icon, KButton, KCard, KCardSection, KText, MorphPicker, NeckDownPhoto, RowDivider, TagLine, TextLink, displayScore, opacity, scoreWordLabel, useTheme,
} from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import {
  DAY_CARD_OCCASIONS, EVENING_CARD_OCCASIONS, STYLES,
  type CardOccasion, type ClosetItemRow, type DailyIdeaRow, type FitCheckRow, type StyleKey,
} from '@/data/types';
import { shownPhoto } from '@/demo/demoPhotos';
import { quota } from '@/features/fitcheck/session';
import { OutfitTiles } from '@/features/stylist/cards/OutfitTiles';
import { showToast } from '@/features/toast/toast';
import { setStylistAction } from '@/router/stylistAction';
import { weatherSource } from '@/services/weather';
import { t } from '@/i18n/en';
import { weekdayName } from '@/i18n/format';
import { sessionClock } from '@/state/session';
import { cardOccasionLabel, missingLabel, stripLines, styleLabel, weatherSymbol, whyLine } from './copy';
import { morning } from './index';
import { checkInSlot, slotAt } from './service';
import { pickSwap } from './swapPicker';

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
  const myStyles = (profile?.styles ?? []).map(([s]) => (s === 'preppy' ? 'old_money' : s)).filter((s): s is StyleKey => (STYLES as readonly string[]).includes(s));
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
  const right = enough ? t('idea.fromCloset') : m.piecesKnown === 0 ? undefined : m.piecesKnown === 1 ? t('idea.pieces1') : t('idea.piecesN', { n: m.piecesKnown });
  const why = enough
    ? whyLine(m.reasons, m.items, row.occasion)
    : m.piecesKnown === 0 ? t('idea.empty') : m.piecesKnown === 1 ? t('idea.thin1') : t('idea.thinN', { n: m.piecesKnown });
  const needs = enough ? (m.missing ? [missingLabel(m.missing)] : []) : m.missingSlots.map(missingLabel);

  return (
    <KCard>
      <KCardSection gap={11}>
        <TagLine left={evening ? t('idea.tonight') : t('idea.today')} right={right} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <MorphPicker
            label={cardOccasionLabel(row.occasion)}
            value={row.occasion}
            sections={[{ options: occasions.map((o) => ({ value: o, label: cardOccasionLabel(o) })) }]}
            onPick={changeOccasion}
            accessibilityLabel={t('idea.a11y.occasion', { occasion: cardOccasionLabel(row.occasion) })}
          />
          <MorphPicker
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
        {weather ? <WeatherStrip w={weather} /> : m.permission === 'unknown' && weatherSource.kind !== 'none' ? <LocationAsk onAllow={() => void allow()} /> : null}
        {m.piecesKnown > 0 ? <OutfitTiles items={enough ? m.items : m.known} needs={needs} /> : null}
        <KText variant="subheadline" color="ink2">
          {why}
        </KText>
        {enough ? (
          <View style={isAccessibilitySize ? { gap: 8 } : { flexDirection: 'row', gap: 8 }}>
            <KButton title={wearing ? t('idea.wearing') : t('idea.wear')} icon={wearing ? 'check' : undefined} size="regular" fullWidth={isAccessibilitySize} disabled={wearing} onPress={() => void wear()} />
            <KButton title={t('idea.swap')} size="regular" kind="secondary" fullWidth={isAccessibilitySize} onPress={swap} />
          </View>
        ) : (
          <KButton title={t('idea.checkFit')} icon="camera" size="regular" fullWidth={isAccessibilitySize} onPress={openCamera} />
        )}
      </KCardSection>
      {enough ? <OwnFitRow evening={evening} wearing={wearing} checkUsed={m.checkUsed} onPress={openCamera} /> : null}
      {weather && weatherSource.kind === 'sample' ? (
        <KText variant="caption" color="ink3" style={{ paddingHorizontal: 16, paddingBottom: 12, marginTop: -4 }}>
          {t('wx.sample')}
        </KText>
      ) : null}
    </KCard>
  );
}

function WeatherStrip({ w }: { w: DayWeather }) {
  const { colors } = useTheme();
  const { main, rain } = stripLines(w, localParts(sessionClock.nowMs(), sessionClock.offset).hh);
  return (
    <View
      accessible
      accessibilityLabel={t('wx.strip.a11y', { main: main.replace(/ · /g, ', '), rain })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface2, borderRadius: 12, borderCurve: 'continuous', paddingVertical: 8, paddingHorizontal: 10 }}
    >
      <Icon name={weatherSymbol(w) as never} color="ink2" />
      <View style={{ flex: 1 }}>
        <KText variant="subheadline" weight="600">
          {main}
        </KText>
        <KText variant="footnote" color="ink2">
          {rain}
        </KText>
      </View>
    </View>
  );
}

function LocationAsk({ onAllow }: { onAllow: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface2, borderRadius: 12, borderCurve: 'continuous', paddingVertical: 8, paddingLeft: 10, paddingRight: 6 }}>
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

/** "Going with your own? · Check it before you leave" (#59): one 44 pt+ row, not a third button. */
function OwnFitRow({ evening, wearing, checkUsed, onPress }: { evening: boolean; wearing: boolean; checkUsed: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const title = wearing ? t('own.dressedTitle') : t('own.title');
  const sub = checkUsed ? t('own.limit') : wearing ? t('own.dressedSub') : evening ? t('own.subEvening') : t('own.sub');
  return (
    <>
      <RowDivider />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title} ${sub}.`}
        accessibilityHint={t('own.a11yHint')}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10, paddingHorizontal: 16, opacity: pressed ? opacity.pressed : 1 })}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera" size="small" color="ink" />
        </View>
        <View style={{ flex: 1 }}>
          <KText variant="subheadline" weight="600">
            {title}
          </KText>
          <KText variant="footnote" color="ink2">
            {sub}
          </KText>
        </View>
        <Icon name="next" size="small" color="ink3" />
      </Pressable>
    </>
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
      left={photo ? <NeckDownPhoto source={photo.source} aspect={photo.aspect} crop={photo.crop} width={44} height={56} borderRadii={{ tl: 8, tr: 8, br: 8, bl: 8 }} /> : null}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 }}>
      {left}
      <View style={{ flex: 1, gap: 4 }}>
        <KText variant="footnote" color="ink2" mono="label">
          {tag}
        </KText>
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
