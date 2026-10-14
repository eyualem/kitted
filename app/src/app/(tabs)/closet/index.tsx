// C1 · Closet (02 D15). Until P5 builds the full screen (Rotation, Starter essentials, filters),
// it shows what the closet really holds: the C1e empty state, or a grid of his pieces drawn with their
// details (#91), with a "Same as your …?" card on top for each question the stylist still has.
// No dev placeholder text in a tab (DECISIONS-LOG #56). The ScrollView stays the first child (tab bar
// minimize behavior).
import { useState } from 'react';
import { File } from 'expo-file-system';
import { ScrollView, View } from 'react-native';
import { EmptyState, KButton, KCard, KCardSection, RowDivider, TagLine, radius, space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { PieceMenu } from '@/features/closet/PieceMenu';
import { checksById, piecePreviewSource } from '@/features/closet/piecePreview';
import { DuplicateQuestion } from '@/features/closet/DuplicateQuestion';
import { isAwaitingAnswer, isOwned } from '@/features/closet/profile';
import { fitCheck } from '@/features/fitcheck/session';
import { goToStylist } from '@/router/stylistAction';
import { resolveStoredPath } from '@/services/photoFiles';
import { t } from '@/i18n/en';

const GAP = 10;

/** Whether a stored file is still on the phone (a cut-out or kept photo can be gone); never throws. */
function fileExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export default function ClosetScreen() {
  const { colors, isAccessibilitySize } = useTheme();
  const data = useLive(['closet', 'fitChecks', 'closetObs'], async () => {
    const all = await store.closet.all();
    const byId = new Map(all.map((c) => [c.id, c]));
    // Newest first (a row's place in the store moves when it's updated). A piece still waiting on his answer shows in
    // its question card only, not as a tile of its own (#116).
    const owned = all.filter(isOwned);
    const items = owned.filter((c) => !isAwaitingAnswer(c, owned)).sort((a, b) => b.addedAt - a.addedAt || (a.id < b.id ? -1 : 1));
    // Long-press preview (founder, Oct 14): his own photo of each piece, else its drawing.
    const obs = await store.closetObs.all();
    const checks = checksById(await store.fitChecks.all());
    const deps = { resolve: resolveStoredPath, exists: fileExists };
    const previews = new Map(items.map((it) => [it.id, piecePreviewSource(it.id, obs, checks, deps)]));
    return { items, byId, previews, asks: await fitCheck.closet.openAsks() };
  }, []);
  const [width, setWidth] = useState(0);
  if (!data) return null;
  const { items, byId, previews, asks } = data;
  const open = asks.flatMap(({ checkId, ask }) => {
    const photo = byId.get(ask.itemId), candidate = byId.get(ask.candidateId);
    if (!photo || !candidate) return [];
    return [{ checkId, ask, photo, candidate, runnerUp: ask.runnerUpId ? byId.get(ask.runnerUpId) ?? null : null }];
  });
  const cols = isAccessibilitySize ? 2 : 3;
  const tile = width > 0 ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: space.gutter, gap: space.stack }}>
      {items.length === 0 ? (
        <EmptyState icon="closet" title={t('closet.empty.title')} body={t('closet.empty.body')}>
          <KButton title={t('closet.empty.check')} icon="camera" size="regular" style={{ alignSelf: 'center' }} onPress={() => goToStylist({ kind: 'checkMyFit' })} />
        </EmptyState>
      ) : (
        <>
          {/* "To confirm · 2" (#117): every open question in one quiet card on top; no badge, no push. */}
          {open.length > 0 ? (
            <KCard>
              <KCardSection gap={12}>
                <TagLine left={t('closet.confirm.tag')} right={String(open.length)} />
                {open.map(({ checkId, ask, photo, candidate, runnerUp }, i) => (
                  <View key={ask.obsId} style={{ gap: 12 }}>
                    {i > 0 ? <RowDivider /> : null}
                    <DuplicateQuestion ask={ask} photo={photo} candidate={candidate} runnerUp={runnerUp} onAnswer={(a) => void fitCheck.answerDuplicate(checkId, ask.obsId, a)} />
                  </View>
                ))}
              </KCardSection>
            </KCard>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {tile > 0 ? items.map((it) => (
              <PieceMenu key={it.id} item={it} size={tile} aspect={0.92} radius={radius.tile} preview={previews.get(it.id) ?? { kind: 'drawn' }} />
            )) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
}
