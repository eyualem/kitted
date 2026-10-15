// O3w · Birth year (02 §3): a list of years in a sheet, newest first, nothing preselected (ruling 28). It opens
// scrolled to his year, or near a 22-year-old's when none is picked (#276; it used to open on 2016). A tap saves
// the year into the basics draft and closes; O3 re-reads the draft when it's back in focus. No wheel package: a
// plain list needs no new dependency and VoiceOver reads it row by row.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, KText, useTheme } from '@/design-system';
import { store } from '@/data/db';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';
import { BASICS_KEY, birthYearAnchor, birthYears, parseBasics } from './basics';

/** One row: 44 pt plus its 1 pt divider. The list opens with a few rows above the year, so it reads as a list. */
const ROW_H = 45;
const ROWS_ABOVE = 3;

export function BirthYearSheet() {
  const { colors } = useTheme();
  // O3 passes his year (?year=2005) so the one-time offset can land on it before the draft is read.
  const { year } = useLocalSearchParams<{ year?: string }>();
  const [picked, setPicked] = useState<number | null>(year ? Number(year) : null);
  useEffect(() => {
    void store.getKv(BASICS_KEY).then((raw) => setPicked(parseBasics(raw).birthYear));
  }, []);
  const now = sessionClock.now().getFullYear();
  const years = birthYears(now);
  const [openAt] = useState(() => Math.max(0, years.indexOf(year ? Number(year) : birthYearAnchor(now)) - ROWS_ABOVE) * ROW_H);
  const choose = async (year: number) => {
    const draft = parseBasics(await store.getKv(BASICS_KEY));
    await store.setKv(BASICS_KEY, JSON.stringify({ ...draft, birthYear: year }));
    router.back();
  };
  return (
    <SheetScaffold title={t('onb.year.title')} initialScrollY={openAt}>
      <View style={[styles.list, { borderColor: colors.line, backgroundColor: colors.surface }]}>
        {years.map((y, i) => (
          <Pressable
            key={y}
            onPress={() => void choose(y)}
            accessibilityRole="button"
            accessibilityState={{ selected: y === picked }}
            style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }, pressed && { backgroundColor: colors.surface2 }]}
          >
            <KText variant="body" weight={y === picked ? '600' : '400'} tabular>
              {String(y)}
            </KText>
            {y === picked ? <Icon name="check" size="small" color="ink" /> : null}
          </Pressable>
        ))}
      </View>
    </SheetScaffold>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: 1, borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' },
  row: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
