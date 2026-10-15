// "Same as another piece…" (09-ui-review §1 item 10, #280): his other pieces in this piece's slot, drawn as in the
// Closet grid. A tap asks once ("Same as your khaki chinos?"), then folds this piece into that one; the sheet closes
// and the piece page moves to the kept piece, with a toast that can undo it. Scores never change.
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { radius } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { mergeCandidates } from './merge';
import { mergePiece } from './pieceActions';
import { isOwned } from './profile';

const COLUMNS = 3;
const GAP = 10;

export function MergeSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const data = useLive(['closet'], async () => {
    const all = await store.closet.all();
    const item = all.find((c) => c.id === id);
    if (!item || !isOwned(item)) return null;
    return { item, candidates: mergeCandidates(item, all) };
  }, [id]);
  const tile = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;

  return (
    <SheetScaffold title={t('closet.merge.title')} subtitle={t('closet.merge.sub')}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP, paddingTop: 4 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {tile > 0 && data
          ? data.candidates.map((c) => (
              <ClosetTile
                key={c.id}
                item={c}
                size={tile}
                aspect={0.92}
                radius={radius.tile}
                label={c.name}
                accessibilityHint={t('closet.merge.a11y.pickHint')}
                onPress={() => {
                  if (busy) return;
                  setBusy(true);
                  void mergePiece(data.item, c, {
                    onMerged: () => {
                      router.back();
                    },
                  }).finally(() => setBusy(false));
                }}
              />
            ))
          : null}
      </View>
    </SheetScaffold>
  );
}
