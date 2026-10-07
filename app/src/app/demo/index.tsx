// /demo: every mockup screen as a link (demo builds only). Handy on the Simulator and web.
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KText, space, useTheme } from '@/design-system';
import { SCREENS } from '@/demo/scenarios';
import { t } from '@/i18n/en';

export default function DemoIndex() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={[styles.list, { paddingTop: insets.top + space.l }]}>
      <KText variant="title2" weight="700">
        {t('demo.index.title')}
      </KText>
      {SCREENS.map((s) => (
        <Link key={s.n} href={`/demo/screen/${s.n}`} asChild>
          <Pressable style={[styles.row, { borderColor: colors.line }]} accessibilityRole="link">
            <KText variant="body">{`${s.n}. ${s.name}`}</KText>
            <KText variant="footnote" color="ink3">
              {s.id}
            </KText>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.gutter, gap: space.s },
  row: { minHeight: 44, paddingVertical: space.s, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
});
