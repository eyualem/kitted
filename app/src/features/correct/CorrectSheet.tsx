// S8 Not quite right? (02 D9): fix a detail the app got wrong and see the score live; Save
// makes a NEW corrected reading (the original is never edited). Four reasons; P2 edits fit
// (tops) and leg shape (bottoms) in "Wrong color or fit". The live score and next fix come from the fit-check
// service's previewCorrection, the same evaluation Save runs with the check's own engine (#276; it used core's
// v4 score() before, so a parts check could show one number and save another).
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { garmentName, matchClosetItem, type Fix, type Garment } from '@kitted/core';
import {
  Chip, ChipFlow, Icon, KButton, KText, Pill, RowDivider, displayScore, opacity, useTheme,
} from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { garmentHex, garmentLabel } from '@/features/fitcheck/labels';
import { fitCheck } from '@/features/fitcheck/session';
import { ScoreMoveLine } from '@/features/sheet/ScoreMoveLine';
import { SheetList as List, SheetScaffold } from '@/features/sheet/SheetScaffold';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { fitField, typeOptions, volumeWord, type FieldOption } from './fields';
import { PieceArt } from '@/features/closet/GarmentArt';
import { GoneSheet } from '@/features/gone/Gone';

type Reason = 'item' | 'detail' | 'fix' | 'score';
const REASONS: [Reason, Parameters<typeof t>[0]][] = [
  ['item', 'nqr.reason.item'], ['detail', 'nqr.reason.detail'], ['fix', 'nqr.reason.fix'], ['score', 'nqr.reason.score'],
];
const LOW_SNEAKERS = ['white_leather_sneaker', 'low_profile_sneaker', 'canvas_sneaker'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function CorrectSheet() {
  const p = useLocalSearchParams<{ checkId: string; reason?: string; garment?: string; field?: string; value?: string }>();
  const data = useLive(['fitChecks', 'readings', 'closet', 'profile'], async () => {
    const row = await store.fitChecks.get(p.checkId);
    const reading = row?.readingId ? (await store.readings.get(row.readingId))?.reading : undefined;
    return row && reading ? { row, reading, closet: (await store.closet.all()).filter((c) => !c.isDeleted), profile: await store.profile.get('me') } : null;
  }, [p.checkId]);

  const [reason, setReason] = useState<Reason>(REASONS.some(([r]) => r === p.reason) ? (p.reason as Reason) : 'detail');
  const [open, setOpen] = useState<number | null>(p.garment !== undefined ? Number(p.garment) : null);
  const [draft, setDraft] = useState<{ index: number; field: keyof Garment & string; value: Garment[keyof Garment] } | { index: number; remove: true } | null>(
    p.garment !== undefined && p.field && p.value !== undefined
      ? { index: Number(p.garment), field: p.field as keyof Garment & string, value: (/^\d+$/.test(p.value) ? Number(p.value) : p.value) as Garment[keyof Garment] }
      : null,
  );
  const [skipTarget, setSkipTarget] = useState<string | null>(null);
  const [feel, setFeel] = useState<'higher' | 'lower' | null>(null);

  // What Save would give for the change on screen; a reply is used only while it still matches the request.
  const change = draft && reason !== 'fix' && reason !== 'score' ? draft : null;
  const hideTarget = reason === 'fix' ? skipTarget : null;
  const request = JSON.stringify([change, hideTarget]);
  const [scored, setScored] = useState<{ request: string; after: number | null; nextFix: Fix | null } | null>(null);
  useEffect(() => {
    let live = true;
    const d = change ? ('remove' in change ? { garmentIndex: change.index, remove: true as const } : { garmentIndex: change.index, field: change.field, value: change.value }) : undefined;
    void fitCheck.previewCorrection(p.checkId, { draft: d, hideTarget: hideTarget ?? undefined }).then((r) => {
      if (live && r) setScored({ request, after: r.after, nextFix: r.nextFix });
    });
    return () => {
      live = false;
    };
    // `request` stands for change + hideTarget; `data` re-runs it when the check or closet changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.checkId, request, data]);

  const preview = useMemo(() => {
    if (!data) return null;
    const fresh = scored?.request === request ? scored : null;
    const original = draft ? data.reading.garments[draft.index] : undefined;
    // The piece the change goes to: the stored garment → item link (#91); pre-V6 checks: one of its own pieces.
    const linked = draft ? (data.row.details.closetSummary?.links ?? []).find((l) => l.origin === 'garment' && l.index === draft.index) : undefined;
    const closetHit = original && !('remove' in (draft ?? {}))
      ? (linked ? data.closet.find((c) => c.id === linked.itemId) : matchClosetItem(original, data.closet.filter((c) => data.row.itemIds.includes(c.id)))) ?? null
      : null;
    const before = data.row.score ?? 0;
    return { before, after: fresh?.after ?? before, closetHit, nextFix: hideTarget ? fresh?.nextFix ?? undefined : undefined };
  }, [data, draft, scored, request, hideTarget]);

  if (data === null) return <GoneSheet />;
  if (!data || !preview) return <SheetScaffold title={t('nqr.title')} subtitle={t('nqr.sub')} />;
  const { row, reading } = data;

  const save = async () => {
    if (reason === 'fix' && skipTarget) await fitCheck.hideFix(row.id, skipTarget);
    else if (reason === 'score' && feel) await fitCheck.scoreFeedback(row.id, feel);
    else if (draft) {
      const r = await fitCheck.saveCorrection(row.id, 'remove' in draft ? { garmentIndex: draft.index, remove: true } : { garmentIndex: draft.index, field: draft.field, value: draft.value });
      // "Saved to your tan chinos." when a closet item took the change, else "Correction saved." (02 D9).
      if (r) showToast(r.itemName ? t('nqr.toast.saved', { item: r.itemName.toLowerCase() }) : t('nqr.toast.generic'));
    }
    router.back();
  };

  return (
    <SheetScaffold title={t('nqr.title')} subtitle={t('nqr.sub')}>
      <ChipFlow accessibilityLabel={t('nqr.title')} rowGap={6}>
        {REASONS.map(([r, k]) => (
          <Chip key={r} title={t(k)} state={reason === r ? 'selected' : 'normal'} onPress={() => setReason(r)} />
        ))}
      </ChipFlow>

      {reason === 'fix' ? (
        <List>
          {row.fixes.map((f, i) => (
            <View key={f.target}>
              {i > 0 ? <RowDivider /> : null}
              <Row title={f.copy} detail={skipTarget === f.target ? t('nqr.skipFix') : f.tag} active={skipTarget === f.target} onPress={() => setSkipTarget(skipTarget === f.target ? null : f.target)} />
            </View>
          ))}
        </List>
      ) : reason === 'score' ? (
        <View style={{ gap: 8 }}>
          <ChipFlow rowGap={6}>
            <Chip title={t('nqr.higher')} state={feel === 'higher' ? 'selected' : 'normal'} onPress={() => setFeel('higher')} />
            <Chip title={t('nqr.lower')} state={feel === 'lower' ? 'selected' : 'normal'} onPress={() => setFeel('lower')} />
          </ChipFlow>
        </View>
      ) : (
        <List>
          {reading.garments.map((g, i) => {
            if (g.certainty === 'unsure' || g.category === 'accessory') return null;
            const shown = draft && !('remove' in draft) && draft.index === i ? { ...g, [draft.field]: draft.value } : g;
            const isOpen = open === i;
            const fit = fitField(g);
            const options: FieldOption[] = reason === 'item' ? typeOptions(g, (sub) => cap(garmentName({ subcategory: sub }))) : fit?.options ?? [];
            const field = reason === 'item' ? 'subcategory' : fit?.field;
            const title =
              // The title says what I read; the selected chip shows his correction (mockup 9).
              g.category === 'bottom' && typeof g.leg_shape === 'string' && g.leg_shape !== 'na'
                ? t('nqr.legTitle', { name: garmentLabel(g), leg: g.leg_shape })
                : garmentLabel(g);
            const detail = isOpen
              ? reason === 'item' ? t('nqr.reason.item') : t('nqr.ask.fit')
              : g.category === 'top' || g.category === 'outerwear' ? t('nqr.fitDetail', { fit: volumeWord(shown.volume) })
              : g.category === 'footwear' && LOW_SNEAKERS.includes(String(g.subcategory)) ? t('nqr.example.sneakerDetail') : '';
            return (
              <View key={i}>
                {i > 0 ? <RowDivider /> : null}
                <Row title={title} detail={detail} garment={shown} active={isOpen} onPress={() => setOpen(isOpen ? null : i)} />
                {isOpen && (options.length > 0 || reason === 'item') ? (
                  <OpenPanel>
                    <ChipFlow rowGap={6}>
                      {options.map((o) => {
                        const current = draft && !('remove' in draft) && draft.index === i ? draft.value : field ? g[field] : undefined;
                        return (
                          <Chip
                            key={String(o.value)}
                            title={o.label}
                            state={current === o.value ? 'selected' : 'normal'}
                            onPress={() => field && setDraft({ index: i, field: field as keyof Garment & string, value: o.value })}
                          />
                        );
                      })}
                      {reason === 'item' ? (
                        <Chip title={t('nqr.notInPhoto')} state={draft && 'remove' in draft && draft.index === i ? 'selected' : 'normal'} onPress={() => setDraft({ index: i, remove: true })} />
                      ) : null}
                    </ChipFlow>
                  </OpenPanel>
                ) : null}
              </View>
            );
          })}
        </List>
      )}

      <PreviewLine
        reason={reason}
        before={preview.before}
        after={preview.after}
        closetUpdated={!!preview.closetHit && !!draft}
        nextFix={preview.nextFix?.copy}
      />
      <KButton title={reason === 'score' ? t('nqr.send') : t('nqr.save')} onPress={() => void save()} disabled={reason === 'fix' ? !skipTarget : reason === 'score' ? !feel : !draft} />
    </SheetScaffold>
  );
}

function OpenPanel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ backgroundColor: colors.accentSoft, paddingTop: 2, paddingHorizontal: 14, paddingBottom: 14 }}>{children}</View>;
}

function Row({ title, detail, garment, active, onPress }: { title: string; detail: string; garment?: Garment; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      accessibilityState={{ expanded: active }}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16,
        backgroundColor: active ? colors.accentSoft : 'transparent', opacity: pressed ? opacity.pressed : 1,
      })}
    >
      {garment ? (
        <View style={{ width: 44, height: 44, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <PieceArt item={{ garment, hex: garmentHex(garment) }} size={40} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="subheadline" weight="600">
          {title}
        </KText>
        {detail ? (
          <KText role="rowSubtitle" color={active ? 'accent' : 'ink2'} weight={active ? '600' : undefined}>
            {detail}
          </KText>
        ) : null}
      </View>
      <Icon name="edit" size="regular" color="ink3" />
    </Pressable>
  );
}

function PreviewLine({ reason, before, after, closetUpdated, nextFix }: { reason: Reason; before: number; after: number; closetUpdated: boolean; nextFix?: string }) {
  if (reason === 'fix' || reason === 'score') {
    const text = reason === 'fix'
      ? nextFix ? t('nqr.nextFix', { title: nextFix }) : t('nqr.scoreStays', { score: displayScore(before) })
      : `${t('nqr.scoreStays', { score: displayScore(before) })}. ${t('nqr.thanks')}`;
    return (
      <View style={{ paddingTop: 4 }}>
        <KText variant="subheadline" color="ink2">{text}</KText>
      </View>
    );
  }
  return <ScoreMoveLine before={before} after={after} trailing={closetUpdated && reason === 'detail' ? <Pill title={t('nqr.closetUpdated')} tone="ok" /> : null} />;
}
