// S21 What changed? (02 S21): the re-check missed a change he made. One row per fix from the
// first check, each with a "Done" chip; the score line updates live; "Update score" applies them
// to the first reading (a userConfirmed reading and a fixConfirmed correction) and the card
// adds "You confirmed it." Fixes the re-check already saw are ticked and locked.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Chip, KButton, KText, RowDivider } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { fitCheck } from '@/features/fitcheck/session';
import { ScoreMoveLine } from '@/features/sheet/ScoreMoveLine';
import { SheetList, SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';

export function TellMeSheet() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const data = useLive(['fitChecks'], async () => {
    const row = await store.fitChecks.get(checkId);
    const parent = row?.parentId ? await store.fitChecks.get(row.parentId) : null;
    if (!row || !parent) return null;
    const seen = new Set((row.details.recheck?.doneFixes ?? []).map((f) => f.copy));
    return { row, fixes: parent.fixes.map((f) => ({ target: f.target, copy: f.copy, tag: f.tag, caught: seen.has(f.copy) })) };
  }, [checkId]);

  const [ticked, setTicked] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ before: number; after: number } | null>(null);
  useEffect(() => {
    let live = true;
    void fitCheck.previewConfirm(checkId, ticked).then((p) => {
      if (live && p && p.before !== null) setPreview({ before: p.before, after: p.after ?? p.before });
    });
    return () => {
      live = false;
    };
  }, [checkId, ticked, data]);

  const update = async () => {
    await fitCheck.confirmFixes(checkId, ticked);
    router.back();
  };
  const toggle = (target: string) => setTicked((xs) => (xs.includes(target) ? xs.filter((x) => x !== target) : [...xs, target]));

  return (
    <SheetScaffold title={t('recheck.tell.title')}>
      {data ? (
        <SheetList>
          {data.fixes.map((f, i) => {
            const on = f.caught || ticked.includes(f.target);
            return (
              <View key={f.target}>
                {i > 0 ? <RowDivider /> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 12, minHeight: 64 }}>
                  <View style={{ flex: 1, gap: 2, paddingVertical: 10 }}>
                    <KText variant="subheadline" weight="600">
                      {f.copy}
                    </KText>
                    {f.tag ? <KText role="rowSubtitle" color="ink2">{f.tag}</KText> : null}
                  </View>
                  <Chip
                    title={t('recheck.tell.done')}
                    small
                    state={on ? 'selected' : 'normal'}
                    disabled={f.caught}
                    onPress={() => toggle(f.target)}
                    accessibilityHint={f.copy}
                  />
                </View>
              </View>
            );
          })}
        </SheetList>
      ) : null}
      {preview ? <ScoreMoveLine before={preview.before} after={preview.after} /> : null}
      <KButton title={t('recheck.tell.update')} onPress={() => void update()} disabled={ticked.length === 0} />
    </SheetScaffold>
  );
}
