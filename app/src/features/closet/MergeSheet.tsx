// "Same as which piece?" (09-ui-review §1 item 10, #280; §8, #289): his other pieces of this piece's kind, drawn as
// in the Closet grid.
//   - From the piece page's "Same as another piece…": a tap asks once ("Same as your khaki chinos?"), then folds this
//     piece into that one; the sheet closes and the page moves to the kept piece, with a toast that can undo it.
//   - From a photo's "It's another piece…" (`?photo=`): no subtitle; a tap moves just that photo there ("Saved as your
//     khaki chinos." with Undo) and the sheet closes on the same page; on the piece's only photo the tap merges the
//     piece instead, exactly as above.
// Scores never change.
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { radius } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { ClosetTile } from './ClosetTile';
import { mergePiece, pickAnother } from './pieceActions';
import { isOwned } from './profile';
import { photoOffer, pickerContent, type PhotoContext } from './wrongCard';

const COLUMNS = 3;
const GAP = 10;

export function MergeSheet() {
  const { id, photo } = useLocalSearchParams<{ id: string; photo?: string }>();
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const data = useLive(['closet', 'closetObs', 'fitChecks'], async () => {
    const all = await store.closet.all();
    const item = all.find((c) => c.id === id);
    if (!item || !isOwned(item)) return null;
    const content = pickerContent(item, all, { photo: !!photo });
    if (!photo) return { item, content, ctx: null, merging: true };
    const ctx: PhotoContext = {
      all, obs: await store.closetObs.all(), checks: new Map((await store.fitChecks.all()).map((r) => [r.id, { imageHash: r.imageHash }])),
    };
    return { item, content, ctx, merging: photoOffer(item, photo, ctx).another === 'merge' };
  }, [id, photo]);
  const tile = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  const title = data?.content.title ?? t('closet.merge.title');
  const subtitle = data ? data.content.subtitle ?? undefined : photo ? undefined : t('closet.merge.sub');

  return (
    <SheetScaffold title={title} subtitle={subtitle}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: GAP, paddingTop: 4 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {tile > 0 && data
          ? data.content.candidates.map((c) => (
              <ClosetTile
                key={c.id}
                item={c}
                size={tile}
                aspect={0.92}
                radius={radius.tile}
                label={c.name}
                // A merge asks first; moving one photo doesn't (its toast has Undo).
                accessibilityHint={data.merging ? t('closet.merge.a11y.pickHint') : undefined}
                onPress={() => {
                  if (busy) return;
                  setBusy(true);
                  const close = () => router.back();
                  const done = photo && data.ctx
                    ? pickAnother(data.item, photo, c, data.ctx, { onDone: close })
                    : mergePiece(data.item, c, { onMerged: close });
                  void done.finally(() => setBusy(false));
                }}
              />
            ))
          : null}
      </View>
    </SheetScaffold>
  );
}
