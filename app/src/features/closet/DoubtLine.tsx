// The fit-check card's "Not sure about your mid-wash jeans' leg? Tap." (09-ui-review §19, #319). Which piece, and
// whether it may show, is fitLine.cardLine; this draws it (the card's "Scored as … Not right? Tap." pill), counts it
// toward the cap once per check, and on a tap logs the answer, stops the line for that piece and opens "Not quite
// right?" on its row. Never on Past chats' cards.
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { KText, opacity, size, useTheme } from '@/design-system';
import { store } from '@/data/db';
import type { FitCheckRow } from '@/data/types';
import { useLive } from '@/data/useLive';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { cardLine, FIT_LINE_KEY, parseLineCap, withShown, withTapped } from './fitLine';
import { logFitAnswer } from './fitLog';

export function DoubtLine({ row, readOnly }: { row: FitCheckRow; readOnly: boolean }) {
  const { colors } = useTheme();
  const rawCap = useLive(['kv'], () => store.getKv(FIT_LINE_KEY), [], FIT_LINE_KEY);
  const data = useLive(['closet', 'closetObs', 'readings'], async () => {
    const reading = row.readingId ? (await store.readings.get(row.readingId))?.reading : null;
    return { garments: reading?.garments ?? [], items: await store.closet.all(), obs: await store.closetObs.all() };
  }, [row.readingId]);
  const line = !readOnly && data && rawCap !== undefined ? cardLine(row, data.garments, data.items, data.obs, parseLineCap(rawCap)) : null;
  const shownKey = line ? `${line.itemId}:${row.id}` : null;
  // Counts toward the cap once per check (a check shown again doesn't count twice).
  useEffect(() => {
    if (!line) return;
    const cap = parseLineCap(rawCap);
    const next = withShown(cap, line.itemId, row.id);
    if (next !== cap) void store.setKv(FIT_LINE_KEY, JSON.stringify(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey]);
  if (!line || !data) return null;
  const tap = () => {
    void (async () => {
      await store.setKv(FIT_LINE_KEY, JSON.stringify(withTapped(parseLineCap(await store.getKv(FIT_LINE_KEY)), line.itemId)));
      await logFitAnswer(store, data.obs, { at: sessionClock.nowMs(), kind: 'lineTap', itemId: line.itemId, field: line.field, checkId: row.id, value: null });
    })();
    router.push(line.href as Href);
  };
  return (
    <Pressable
      onPress={tap}
      accessibilityRole="button"
      accessibilityLabel={`${line.lead} ${line.action}`}
      accessibilityHint={t('closet.unsure.a11y.lineHint')}
      style={({ pressed }) => ({
        minHeight: size.hit, justifyContent: 'center', backgroundColor: colors.surface2, borderRadius: 12, borderCurve: 'continuous',
        paddingVertical: 8, paddingHorizontal: 12, opacity: pressed ? opacity.pressed : 1,
      })}
    >
      <KText variant="footnote" color="ink2">
        {`${line.lead} `}
        <KText variant="footnote" weight="600" color="ink">
          {line.action}
        </KText>
      </KText>
    </Pressable>
  );
}
