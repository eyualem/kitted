// S11 Added to your closet (02 S11, #91): what this check put in his closet. New pieces with Undo (the row
// stays, so he can add it back) and, when the stylist wasn't sure, "Same as your khaki chinos?" inline; then
// "Already in your closet" with "Not the same" for a piece it matched. While the closet call is out (up to
// 12 s) the rows come from the reading with "Checking the details…". The score never changes here.
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon, KText, RowDivider, TextLink, opacity, size, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetAsk, ClosetItemRow, ClosetObservationRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { ClosetTile } from '@/features/closet/ClosetTile';
import { DuplicateQuestion } from '@/features/closet/DuplicateQuestion';
import { CLOSET_DEADLINE_MS } from '@/features/closet/service';
import { isPending } from '@/features/closet/summaryText';
import { garmentHex, garmentLabel } from '@/features/fitcheck/labels';
import { fitCheck } from '@/features/fitcheck/session';
import { SheetList, SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { addedDetail } from './addedDetail';

const CLOSET_CATEGORIES = ['top', 'outerwear', 'bottom', 'footwear'];

/** The edit-item sheet (C3) is still a placeholder: until it's built, rows here don't open it. One switch turns it back on.
 *  The sheet closes with the round X like Why and Which shoes (no "Done"). */
const EDIT_ITEM_BUILT = false;

export function AddedSheet() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const data = useLive(['fitChecks', 'closet', 'closetObs', 'readings'], async () => {
    const row = await store.fitChecks.get(checkId);
    if (!row) return null;
    const cs = row.details.closetSummary ?? { matched: [], added: [], undone: [] };
    const byId = new Map((await store.closet.all()).map((c) => [c.id, c]));
    const obs = new Map((await store.closetObs.all()).filter((o) => o.fitCheckId === checkId).map((o) => [o.id, o]));
    const reading = row.readingId ? (await store.readings.get(row.readingId))?.reading ?? null : null;
    return { row, cs, byId, obs, reading };
  }, [checkId]);
  const [now, setNow] = useState(() => sessionClock.nowMs());
  const pending = !!data && isPending(data.cs, now);
  // Re-check at the deadline: past it the rows show what was written from the reading.
  useEffect(() => {
    if (!pending || !data?.cs.startedAt) return;
    const h = setTimeout(() => setNow(sessionClock.nowMs()), Math.max(0, data.cs.startedAt + CLOSET_DEADLINE_MS - sessionClock.nowMs()) + 50);
    return () => clearTimeout(h);
  }, [pending, data?.cs.startedAt]);

  if (!data) return <SheetScaffold title={t('added.title')} subtitle={t('added.sub')} />;
  const { cs, byId, obs, reading } = data;
  const undone = new Set(cs.undone);
  const asks = cs.asks ?? [];
  const askFor = (itemId: string) => asks.find((a) => a.itemId === itemId && a.answer !== 'same' && a.answer !== 'runnerUp');
  const answer = (a: ClosetAsk, v: 'same' | 'new' | 'runnerUp') => void fitCheck.answerDuplicate(checkId, a.obsId, v);

  if (pending) {
    const pieces = [
      ...(reading?.garments ?? []).filter((g) => typeof g.category === 'string' && CLOSET_CATEGORIES.includes(g.category) && g.certainty !== 'unsure'),
      ...(reading?.held_items ?? []),
    ];
    return (
      <SheetScaffold title={t('added.title')} subtitle={t('added.sub')}>
        <SheetList>
          {pieces.map((g, i) => {
            const name = garmentLabel(g);
            return (
              <View key={i}>
                {i > 0 ? <RowDivider /> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 64, paddingVertical: 10 }} accessible accessibilityLabel={t('added.a11y.pending', { name })}>
                  <ClosetTile item={{ garment: g, hex: garmentHex(g), art: null, name, isPhotographed: true }} size={44} radius={12} scale={0.82} decorative />
                  <View style={{ flex: 1, gap: 2 }}>
                    <KText variant="subheadline" weight="600">{name}</KText>
                    <KText role="rowSubtitle" color="ink2">{t('added.pending')}</KText>
                  </View>
                </View>
              </View>
            );
          })}
        </SheetList>
      </SheetScaffold>
    );
  }

  const added = cs.added.map((id) => byId.get(id)).filter((c): c is ClosetItemRow => !!c);
  // Pieces it matched, once each, with the sighting that matched them.
  const matched: { item: ClosetItemRow; o: ClosetObservationRow | undefined; ask: ClosetAsk | undefined }[] = [];
  for (const id of [...new Set(cs.matched)]) {
    const item = byId.get(id);
    if (!item) continue;
    const link = (cs.links ?? []).find((l) => l.itemId === id);
    const o = link ? obs.get(link.obsId) : undefined;
    const ask = asks.find((a) => link && a.obsId === link.obsId && (a.answer === 'same' || a.answer === 'runnerUp'));
    matched.push({ item, o, ask });
  }

  return (
    <SheetScaffold title={t('added.title')} subtitle={t('added.sub')}>
      <View style={{ gap: 18 }}>
        {added.length > 0 ? (
          <SheetList>
            {added.map((item, i) => {
              const ask = askFor(item.id);
              const candidate = ask ? byId.get(ask.candidateId) : undefined;
              const runnerUp = ask?.runnerUpId ? byId.get(ask.runnerUpId) ?? null : null;
              const removed = undone.has(item.id);
              return (
                <View key={item.id}>
                  {i > 0 ? <RowDivider /> : null}
                  <AddedItemRow
                    item={item}
                    removed={removed}
                    onEdit={() => router.push(`/sheets/edit-item/${item.id}`)}
                    onToggle={(u) => void fitCheck.setItemUndone(checkId, item.id, u)}
                  />
                  {ask && candidate && !removed ? (
                    <View style={{ paddingLeft: 72, paddingRight: 16, paddingBottom: 14 }}>
                      <DuplicateQuestion ask={ask} photo={item} candidate={candidate} runnerUp={runnerUp} onAnswer={(v) => answer(ask, v)} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </SheetList>
        ) : null}
        {matched.length > 0 ? (
          <View style={{ gap: 8 }}>
            <KText variant="footnote" weight="600" color="ink2" accessibilityRole="header" style={{ paddingHorizontal: 4 }}>
              {t('added.section.inCloset')}
            </KText>
            <SheetList>
              {matched.map(({ item, o, ask }, i) => {
                const photo = ask ? byId.get(ask.itemId) : undefined;
                const candidate = ask ? byId.get(ask.candidateId) : undefined;
                const runnerUp = ask?.runnerUpId ? byId.get(ask.runnerUpId) ?? null : null;
                return (
                  <View key={item.id}>
                    {i > 0 ? <RowDivider /> : null}
                    <MatchedRow item={item} onSplit={o && o.decision === 'same' ? () => void fitCheck.splitItem(checkId, o.id) : undefined} />
                    {ask && photo && candidate ? (
                      <View style={{ paddingLeft: 72, paddingRight: 16, paddingBottom: 14 }}>
                        <DuplicateQuestion ask={ask} photo={photo} candidate={candidate} runnerUp={runnerUp} onAnswer={(v) => answer(ask, v)} />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </SheetList>
          </View>
        ) : null}
      </View>
    </SheetScaffold>
  );
}

function MatchedRow({ item, onSplit }: { item: ClosetItemRow; onSplit?: () => void }) {
  const detail = addedDetail(item);
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 12, minHeight: 64, paddingVertical: 10 }}
      accessible
      accessibilityLabel={t('added.a11y.matched', { name: item.name, detail: detail.replace(' · ', ', ').toLowerCase() })}
      accessibilityActions={onSplit ? [{ name: 'split', label: t('added.notSame') }] : undefined}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'split' && onSplit?.()}
    >
      <ClosetTile item={item} size={44} radius={12} scale={0.82} decorative />
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="subheadline" weight="600">{item.name}</KText>
        <KText role="rowSubtitle" color="ink2">{detail}</KText>
      </View>
      {onSplit ? <TextLink title={t('added.notSame')} onPress={onSplit} compact accessibilityHint={t('added.a11y.notSame', { name: item.name })} /> : null}
    </View>
  );
}

function AddedItemRow({ item, removed, onEdit, onToggle }: { item: ClosetItemRow; removed: boolean; onEdit: () => void; onToggle: (undone: boolean) => void }) {
  const { colors } = useTheme();
  const detail = addedDetail(item);
  const name = item.name;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 8, minHeight: 64 }}
      accessible
      accessibilityLabel={removed ? t('added.a11y.removed', { name }) : t('added.a11y.row', { name, detail: detail.replace(' · ', ', ').toLowerCase() })}
      accessibilityActions={removed ? [{ name: 'addBack', label: t('added.addBack') }] : [...(EDIT_ITEM_BUILT ? [{ name: 'edit', label: t('common.edit') }] : []), { name: 'undo', label: t('common.undo') }]}
      onAccessibilityAction={(e) => {
        const a = e.nativeEvent.actionName;
        if (a === 'edit' && EDIT_ITEM_BUILT) onEdit();
        else if (a === 'undo') onToggle(true);
        else if (a === 'addBack') onToggle(false);
      }}
    >
      <Pressable
        onPress={removed || !EDIT_ITEM_BUILT ? undefined : onEdit}
        disabled={removed || !EDIT_ITEM_BUILT}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? opacity.pressed : 1 })}
      >
        <ClosetTile item={item} size={44} radius={12} scale={0.82} dim={removed} decorative />
        <View style={{ flex: 1, gap: 2 }}>
          <KText variant="subheadline" weight="600" color={removed ? 'ink3' : 'ink'} style={removed ? { textDecorationLine: 'line-through', textDecorationColor: colors.ink3 } : undefined}>
            {name}
          </KText>
          <KText role="rowSubtitle" color="ink2">
            {removed ? t('added.removed') : detail}
          </KText>
        </View>
      </Pressable>
      {removed ? (
        <View style={{ paddingRight: 8 }}>
          <TextLink title={t('added.addBack')} onPress={() => onToggle(false)} />
        </View>
      ) : (
        <Pressable
          onPress={() => onToggle(true)}
          accessibilityRole="button"
          accessibilityLabel={t('added.a11y.undo', { name })}
          style={({ pressed }) => ({ width: size.hit, height: size.hit, alignItems: 'center', justifyContent: 'center', opacity: pressed ? opacity.pressed : 1 })}
        >
          <Icon name="undo" size="regular" color="ink2" />
        </Pressable>
      )}
    </View>
  );
}
