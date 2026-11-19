// "What is it, then?" (specs/closet-beta.md CB4, founder Nov 19): the sheet `Not the same` opens, asked in place.
//   list   his other pieces of the photographed piece's slot (a tap selects one and shows the two pictures with
//          `Yes, same one`; nothing is saved until then), then `It's a new piece`;
//   kinds  `What kind of piece is it?`: 2 to 4 kinds drawn in the piece's own color, then `Something else`;
//   all    the slot's full list of kinds (the same one What it is → Kind offers).
// With nothing else in the slot it opens straight on the kinds, with its own line and no Back.
// Two ways in: an open (or answered) "Is this your …?" question (a pick answers `same` with that piece, a new piece
// answers `new` with the kind confirmed), and a sighting the app matched (`Not the same` in the Added sheet: a pick
// moves the photo there, a new piece splits it off). Scores never change: only closet rows.
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon, KButton, KCard, KText, TagLine, opacity, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { ClosetItemRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { GoneSheet } from '@/features/gone/Gone';
import { garmentLabel } from '@/features/fitcheck/labels';
import { fitCheck } from '@/features/fitcheck/session';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { showToast, TOAST_MS_REMOVAL } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { answerLine } from './answerToast';
import { askQuestionText } from './askText';
import { useAskEvidence, type Shot } from './askEvidence';
import { ClosetTile } from './ClosetTile';
import { Choice } from './EditSheet';
import { pickAnother } from './pieceActions';
import { notSameContent, sectionKey } from './notSame';
import { editOptions, kindWord, type EditOption } from './pieceEdit';
import { SightingCrop } from './SightingCrop';
import type { PhotoContext } from './wrongCard';

const GAP = 10;
const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

function Frame({ shot, item, w, h }: { shot: Shot | null; item: ClosetItemRow; w: number; h: number }) {
  if (shot) return <SightingCrop source={shot.photo.source} aspect={shot.photo.aspect} box={shot.box} top={shot.top} mirrored={shot.mirrored} width={w} height={h} radius={14} />;
  return <ClosetTile item={item} size={w} aspect={h / w} radius={14} scale={0.7} decorative />;
}

/** The photographed piece, for reference: its crop from this photo and the name the app read. */
function Reference({ obsId, base, name }: { obsId: string; base: ClosetItemRow; name: string }) {
  const { colors } = useTheme();
  const ev = useAskEvidence({ obsId, candidateId: base.id });
  return (
    <View
      accessible
      accessibilityLabel={`${t('item.dup.thisPhoto')}. ${name}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.m, backgroundColor: colors.surface, borderRadius: radius.tile, borderCurve: 'continuous' }}
    >
      <Frame shot={ev?.thisPhoto ?? null} item={base} w={48} h={52} />
      <View style={{ flex: 1, gap: 2 }}>
        <KText variant="footnote" color="ink2">{t('item.dup.thisPhoto')}</KText>
        <KText variant="subheadline" weight="600">{name}</KText>
      </View>
    </View>
  );
}

/** A tap on a piece turned the reference row into this: the question's own two pictures and `Yes, same one`. */
function Comparison({ obsId, base, piece, ax, busy, onYes }: { obsId: string; base: ClosetItemRow; piece: ClosetItemRow; ax: boolean; busy: boolean; onYes: () => void }) {
  const { colors } = useTheme();
  const ev = useAskEvidence({ obsId, candidateId: piece.id });
  const w = 130;
  const h = 150;
  const question = askQuestionText(lower(piece.name), piece.slot);
  return (
    <View style={{ gap: space.m, padding: space.m, backgroundColor: colors.surface, borderRadius: radius.tile, borderCurve: 'continuous' }}>
      <KText variant="subheadline" weight="600" accessibilityRole="header">{question}</KText>
      <View style={ax ? { gap: 10 } : { flexDirection: 'row', gap: 12 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {([[ev?.thisPhoto ?? null, base, t('item.dup.thisPhoto')], [ev?.inCloset ?? null, piece, t('item.dup.inCloset')]] as const).map(([shot, it, caption]) => (
          <View key={caption} style={{ gap: 4, width: w }}>
            <Frame shot={shot} item={it} w={w} h={h} />
            <KText variant="caption" color="ink2" style={{ textAlign: 'center' }}>{caption}</KText>
          </View>
        ))}
      </View>
      <KButton title={t('item.dup.yes')} onPress={onYes} disabled={busy} fullWidth />
    </View>
  );
}

function ActionRow({ title, plus, onPress, testID }: { title: string; plus?: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.m, backgroundColor: colors.surface,
        borderRadius: radius.tile, borderCurve: 'continuous', opacity: pressed ? opacity.pressed : 1,
      })}
    >
      {plus ? <Icon name="plus" size="regular" color="ink" /> : null}
      <KText variant="subheadline" weight="600" style={{ flex: 1 }}>{title}</KText>
      <Icon name="next" size="small" color="ink3" />
    </Pressable>
  );
}

type Step = 'list' | 'kinds' | 'all';

export function NotSameSheet() {
  const { checkId, obsId, toast } = useLocalSearchParams<{ checkId: string; obsId: string; toast?: string }>();
  const { isAccessibilitySize: ax } = useTheme();
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);

  const data = useLive(['fitChecks', 'closet', 'closetObs'], async () => {
    const row = await store.fitChecks.get(checkId);
    const obs = await store.closetObs.get(obsId);
    if (!row || !obs) return null;
    const ask = (row.details.closetSummary?.asks ?? []).find((a) => a.obsId === obsId) ?? null;
    const all = await store.closet.all();
    // A question: the photographed piece is the flagged copy. A matched sighting: it sits on the piece it matched.
    const base = all.find((c) => c.id === (ask ? ask.itemId : obs.itemId));
    if (!base || (!ask && obs.decision !== 'same')) return null;
    const name = ask ? base.name : garmentLabel(obs.garment);
    const content = notSameContent(
      { ...base, garment: ask ? base.garment : obs.garment }, all, ask, ask ? [] : [base.id],
    );
    return { row, obs, ask, all, base, name, content };
  }, [checkId, obsId]);

  if (data === null && !busy) return <GoneSheet />;
  if (!data) return <SheetScaffold title={t('notSame.title')} subtitle={t('notSame.sub')} />;
  const { ask, all, base, name, content, obs } = data;
  const cur: Step = step ?? (content.empty ? 'kinds' : 'list');
  const selected = selectedId ? content.pieces.find((p) => p.id === selectedId) ?? null : null;
  const cols = ax ? 2 : 3;
  const tile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  const kindTile = width > 0 ? Math.floor((width - GAP * ((ax ? 1 : 2) - 1)) / (ax ? 1 : 2)) : 0;
  const allKinds = (() => {
    const o = editOptions(base, 'kind');
    return [...o.main, ...o.more].map((x): EditOption => ({ ...x, current: false }));
  })();

  const say = (text: string, undo: () => void) => {
    if (toast === '1' || !ask) void showToast(text, undo, { ms: TOAST_MS_REMOVAL });
  };
  const run = (job: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true);
    const fail = () => {
      // A failed or refused write: the sheet stays open with nothing selected and nothing saved.
      setSelectedId(null);
      setKind(null);
      setBusy(false);
    };
    // On success the sheet closes and stays busy (its piece may be folded away under it; no Gone flash).
    void job().then((ok) => (ok ? router.back() : fail())).catch(fail);
  };

  // A piece he picked is the one it is.
  const yes = () => {
    if (!selected) return;
    run(async () => {
      if (ask) {
        const done = await fitCheck.answerDuplicate(checkId, ask.obsId, 'same', { targetId: selected.id });
        if (!done) return false;
        say(answerLine('same', selected, null, { picked: selected }), () => void fitCheck.unanswerDuplicate(checkId, ask.obsId));
        return true;
      }
      const ctx: PhotoContext = { all, obs: await store.closetObs.all(), checks: new Map((await store.fitChecks.all()).map((r) => [r.id, { imageHash: r.imageHash }])) };
      let moved = false;
      await pickAnother(base, obsId, selected, ctx, { onDone: () => { moved = true; } });
      return moved;
    });
  };

  // A kind he confirmed: the photographed piece is new, with that kind.
  const pickKind = (k: string) => {
    if (busy) return;
    setKind(k);
    run(async () => {
      if (ask) {
        const done = await fitCheck.answerDuplicate(checkId, ask.obsId, 'new', { kind: k });
        if (!done) return false;
        const photo = await store.closet.get(ask.itemId);
        say(answerLine('new', base, null, { newPiece: photo ?? base }), () => void fitCheck.unanswerDuplicate(checkId, ask.obsId));
        return true;
      }
      const split = await fitCheck.closet.splitPhoto(obs.id);
      if (!split) return false;
      await fitCheck.closet.editPiece(split.piece.id, 'kind', k);
      const piece = await store.closet.get(split.piece.id);
      void showToast(answerLine('new', base, null, { newPiece: piece ?? split.piece }), () => void fitCheck.closet.restorePhoto(split.undo), { ms: TOAST_MS_REMOVAL });
      return true;
    });
  };

  const back = cur === 'all' ? () => setStep('kinds') : cur === 'kinds' && !content.empty ? () => { setSelectedId(null); setStep('list'); } : undefined;
  const title = cur === 'list' ? t('notSame.title') : t('notSame.kindTitle');
  const subtitle = cur === 'list' ? t('notSame.sub') : cur === 'kinds' && content.empty ? t('notSame.empty') : undefined;

  const kindGrid = (list: readonly EditOption[], size: number) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: space.m }} pointerEvents={busy ? 'none' : 'auto'}>
      {list.map((o) => {
        const chosen = kind === String(o.value);
        return (
          <View key={String(o.value)} style={{ width: size, opacity: busy && !chosen ? 0.4 : 1 }}>
            <Choice item={base} field="kind" option={{ ...o, current: chosen }} size={size} onPick={() => pickKind(String(o.value))} />
          </View>
        );
      })}
    </View>
  );

  return (
    <SheetScaffold
      title={title} subtitle={subtitle} onBack={back} backLabel={t('notSame.a11y.back')}
      scrollTopKey={`${cur}:${selectedId ?? ''}`}
    >
      <View style={{ gap: space.l, paddingTop: 4 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {cur === 'list' ? (
          <>
            {selected ? <Comparison obsId={obsId} base={base} piece={selected} ax={ax} busy={busy} onYes={yes} /> : <Reference obsId={obsId} base={base} name={name} />}
            <View style={{ gap: space.s }}>
              <TagLine left={t(sectionKey(base.slot))} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP }}>
                {tile > 0
                  ? content.pieces.map((p) => {
                      const on = p.id === selectedId;
                      return (
                        <View key={p.id} style={{ width: tile }}>
                          <ClosetTile
                            item={p}
                            size={tile}
                            aspect={0.92}
                            radius={radius.tile}
                            label={p.name}
                            accessibilityHint={on ? t('notSame.a11y.selected') : t('notSame.a11y.pickHint')}
                            onPress={() => !busy && setSelectedId(on ? null : p.id)}
                          />
                          {on ? <SelectedRing size={tile} /> : null}
                        </View>
                      );
                    })
                  : null}
              </View>
            </View>
            <ActionRow testID="notsame-new" title={t('notSame.new')} plus onPress={() => { setSelectedId(null); setStep('kinds'); }} />
          </>
        ) : (
          <>
            <Reference obsId={obsId} base={base} name={name} />
            {cur === 'kinds' ? (
              <>
                {kindTile > 0 ? kindGrid(content.kinds.map((k): EditOption => ({ value: k, label: kindWord(k), current: false })), kindTile) : null}
                <ActionRow testID="notsame-more" title={t('notSame.more')} onPress={() => !busy && setStep('all')} />
              </>
            ) : tile > 0 ? kindGrid(allKinds, tile) : null}
          </>
        )}
      </View>
    </SheetScaffold>
  );
}

/** The ring and check of a selected tile (never color alone). */
function SelectedRing({ size }: { size: number }) {
  const { colors } = useTheme();
  const h = Math.round(size * 0.92);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: h, borderRadius: radius.tile, borderCurve: 'continuous', borderWidth: 2.5, borderColor: colors.ink }}>
      <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={12} weight="bold" color="bg" />
      </View>
    </View>
  );
}
