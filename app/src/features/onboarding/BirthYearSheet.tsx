// O3w · Birth year (02 §3): a list of years in a sheet, newest first, nothing preselected (ruling 28). A tap
// saves the year into the basics draft and closes; O3 re-reads the draft when it's back in focus. No wheel
// package: a plain list needs no new dependency and VoiceOver reads it row by row.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, KText, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { BASICS_KEY, birthYears, parseBasics } from './basics';

export function BirthYearSheet() {
  const { colors } = useTheme();
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => {
    void store.getKv(BASICS_KEY).then((raw) => setPicked(parseBasics(raw).birthYear));
  }, []);
  const choose = async (year: number) => {
    const draft = parseBasics(await store.getKv(BASICS_KEY));
    await store.setKv(BASICS_KEY, JSON.stringify({ ...draft, birthYear: year }));
    router.back();
  };
  return (
    <SheetScaffold title={t('onb.year.title')}>
      <View style={[styles.list, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        {birthYears(sessionClock.now().getFullYear()).map((y, i) => (
          <Pressable
            key={y}
            onPress={() => void choose(y)}
            accessibilityRole="button"
            accessibilityState={{ selected: y === picked }}
            style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }, pressed && { backgroundColor: colors.surface2 }]}
          >
            <KText variant="body" weight={y === picked ? '600' : '400'} tabular>
              {String(y)}
            </KText>
            {y === picked ? <Icon name="check" size="small" color="accent" /> : null}
          </Pressable>
        ))}
      </View>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, overflow: 'hidden' },
  row: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
