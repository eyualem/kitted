// T113 · Add a look (specs/style-game.md SG4, SG7 FS2): a form sheet over Here's your style listing only the looks he
// doesn't have, as setup's tiles. A tap adds it last, or on a full list takes #3's place with an Undo toast, then the
// sheet closes. Opened with no game on results (a stale link), it closes at once.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { space, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { StyleKey } from '@/data/types';
import { styleLabel } from '@/features/morning/copy';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';
import { LOOKS } from './looks';
import { LookTile } from './LookTile';
import { lookChoices } from './styleGame';
import { addToResults, undoChange, useStyleGame } from './styleGameSession';

const GAP = 10;

export function AddLookSheet() {
  const { isAccessibilitySize: ax } = useTheme();
  const session = useStyleGame();
  const window = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const picked = useRef(false);
  const open = session !== null && session.stage === 'results' && session.results !== null;
  useEffect(() => {
    if (!open) router.back();
  }, [open]);
  if (!open) return null;

  const width = measured || window.width - 2 * space.xl;
  const columns = ax ? 1 : 2;
  const tileW = Math.floor((width - GAP * (columns - 1)) / columns);
  const choices = lookChoices(session.results!.picks);

  const pick = async (look: StyleKey) => {
    // One pick per sheet: a second tile pressed before the first add lands would add two and pop Here's your style too.
    if (picked.current) return;
    picked.current = true;
    const r = await addToResults(store, look);
    void Haptics.selectionAsync();
    router.back();
    if (!r) return;
    if (r.replaced) {
      const token = r.token;
      showToast(t('game.results.swapped', { name: styleLabel(look), old: styleLabel(r.replaced) }), () => undoChange(store, token).then(() => undefined));
    } else {
      AccessibilityInfo.announceForAccessibility(t('game.results.added', { name: styleLabel(look) }));
    }
  };

  return (
    <SheetScaffold title={t('game.sheet.title')}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }} onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}>
        {choices.map((s) => {
          const look = LOOKS.find((l) => l.style === s);
          return look ? (
            <LookTile key={s} testID={`addlook-tile-${s}`} look={look} width={tileW} selected={false} shake={0} onPress={() => void pick(s)} />
          ) : null;
        })}
      </View>
    </SheetScaffold>
  );
}
